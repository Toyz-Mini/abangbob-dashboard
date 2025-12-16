'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaff } from '@/lib/store';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import StaffPortalNav from '@/components/StaffPortalNav';
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Printer
} from 'lucide-react';

const CURRENT_STAFF_ID = '2';

interface PayslipData {
  month: string;
  year: number;
  basicSalary: number;
  overtime: number;
  allowances: number;
  epfEmployee: number;
  epfEmployer: number;
  socso: number;
  otherDeductions: number;
  netPay: number;
  status: 'paid' | 'pending';
  paidDate?: string;
}

// Mock payslip data
const mockPayslips: PayslipData[] = [
  {
    month: 'Disember',
    year: 2024,
    basicSalary: 1800,
    overtime: 150,
    allowances: 100,
    epfEmployee: 180,
    epfEmployer: 216,
    socso: 18,
    otherDeductions: 0,
    netPay: 1852,
    status: 'pending'
  },
  {
    month: 'November',
    year: 2024,
    basicSalary: 1800,
    overtime: 200,
    allowances: 100,
    epfEmployee: 180,
    epfEmployer: 216,
    socso: 18,
    otherDeductions: 50,
    netPay: 1852,
    status: 'paid',
    paidDate: '2024-11-28'
  },
  {
    month: 'Oktober',
    year: 2024,
    basicSalary: 1800,
    overtime: 100,
    allowances: 100,
    epfEmployee: 180,
    epfEmployer: 216,
    socso: 18,
    otherDeductions: 0,
    netPay: 1802,
    status: 'paid',
    paidDate: '2024-10-28'
  },
];

export default function PayslipPage() {
  const { staff, isInitialized } = useStaff();
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(mockPayslips[0]);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(mockPayslips[0]?.month);

  const currentStaff = staff.find(s => s.id === CURRENT_STAFF_ID);

  // Calculate totals
  const totalEarnings = selectedPayslip
    ? selectedPayslip.basicSalary + selectedPayslip.overtime + selectedPayslip.allowances
    : 0;

  const totalDeductions = selectedPayslip
    ? selectedPayslip.epfEmployee + selectedPayslip.socso + selectedPayslip.otherDeductions
    : 0;

  if (!isInitialized || !currentStaff) {
    return (
      <MainLayout>
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="staff-portal animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/staff-portal" className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-2" style={{ marginBottom: '0.5rem', transition: 'color 0.2s' }}>
              <ArrowLeft size={18} />
              Kembali ke Portal
            </Link>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>
              Slip Gaji
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Lihat dan muat turun slip gaji anda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1.5rem' }}>
          {/* Payslip List */}
          <div className="card" style={{ height: 'fit-content' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} />
                Pilih Bulan
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {mockPayslips.map(payslip => (
                <button
                  key={`${payslip.month}-${payslip.year}`}
                  className={`payslip-month-btn ${selectedPayslip?.month === payslip.month ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPayslip(payslip);
                    setExpandedMonth(payslip.month);
                  }}
                >
                  <div className="payslip-month-info">
                    <span className="payslip-month-name">{payslip.month} {payslip.year}</span>
                    <span className="payslip-month-amount">BND {payslip.netPay.toFixed(2)}</span>
                  </div>
                  <span className={`badge ${payslip.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    {payslip.status === 'paid' ? 'Dibayar' : 'Pending'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Payslip Details */}
          <div style={{ gridColumn: 'span 2' }}>
            {selectedPayslip && (
              <div className="card payslip-detail-card">
                <div className="payslip-header">
                  <div>
                    <h2>Slip Gaji</h2>
                    <p>{selectedPayslip.month} {selectedPayslip.year}</p>
                  </div>
                  <div className="payslip-actions">
                    <button className="btn btn-outline btn-sm">
                      <Printer size={16} />
                      Cetak
                    </button>
                    <button className="btn btn-primary btn-sm">
                      <Download size={16} />
                      Muat Turun
                    </button>
                  </div>
                </div>

                <div className="payslip-employee-info">
                  <div className="info-row">
                    <span>Nama:</span>
                    <strong>{currentStaff.name}</strong>
                  </div>
                  <div className="info-row">
                    <span>Jawatan:</span>
                    <strong>{currentStaff.role}</strong>
                  </div>
                  <div className="info-row">
                    <span>Nombor Staff:</span>
                    <strong>EMP-{CURRENT_STAFF_ID.padStart(4, '0')}</strong>
                  </div>
                </div>

                <div className="payslip-sections">
                  {/* Earnings */}
                  <div className="payslip-section earnings">
                    <div className="section-header">
                      <TrendingUp size={18} />
                      <h3>Pendapatan</h3>
                    </div>
                    <div className="section-items">
                      <div className="payslip-item">
                        <span>Gaji Pokok</span>
                        <span>BND {selectedPayslip.basicSalary.toFixed(2)}</span>
                      </div>
                      <div className="payslip-item">
                        <span>Elaun Kerja Lebih Masa</span>
                        <span>BND {selectedPayslip.overtime.toFixed(2)}</span>
                      </div>
                      <div className="payslip-item">
                        <span>Elaun Lain</span>
                        <span>BND {selectedPayslip.allowances.toFixed(2)}</span>
                      </div>
                      <div className="payslip-item total">
                        <span>Jumlah Pendapatan</span>
                        <span>BND {totalEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="payslip-section deductions">
                    <div className="section-header">
                      <TrendingDown size={18} />
                      <h3>Potongan</h3>
                    </div>
                    <div className="section-items">
                      <div className="payslip-item">
                        <span>EPF (Pekerja)</span>
                        <span>BND {selectedPayslip.epfEmployee.toFixed(2)}</span>
                      </div>
                      <div className="payslip-item">
                        <span>SOCSO</span>
                        <span>BND {selectedPayslip.socso.toFixed(2)}</span>
                      </div>
                      {selectedPayslip.otherDeductions > 0 && (
                        <div className="payslip-item">
                          <span>Potongan Lain</span>
                          <span>BND {selectedPayslip.otherDeductions.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="payslip-item total">
                        <span>Jumlah Potongan</span>
                        <span>BND {totalDeductions.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Pay */}
                <div className="payslip-net-pay">
                  <div className="net-pay-label">Gaji Bersih</div>
                  <div className="net-pay-amount">BND {selectedPayslip.netPay.toFixed(2)}</div>
                  {selectedPayslip.paidDate && (
                    <div className="net-pay-date">
                      Dibayar pada {new Date(selectedPayslip.paidDate).toLocaleDateString('ms-MY')}
                    </div>
                  )}
                </div>

                {/* Employer Contribution Note */}
                <div className="payslip-note">
                  <FileText size={14} />
                  <span>Caruman Majikan EPF: BND {selectedPayslip.epfEmployer.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <StaffPortalNav />
      </div>
    </MainLayout>
  );
}




