'use client';

import { useState, useMemo } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaff, useStore } from '@/lib/store';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Printer,
  Building2
} from 'lucide-react';


// Demo: Using dynamic user ID
// const CURRENT_STAFF_ID = '2';

// Payslip Settings (can be loaded from settings in production)
interface PayslipBranding {
  companyName: string;
  companyLogo: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyRegNo: string;
  showLogo: boolean;
  primaryColor: string;
  footerNote: string;
}

const DEFAULT_PAYSLIP_BRANDING: PayslipBranding = {
  companyName: 'ABANGBOB SDN BHD',
  companyLogo: '/logo.png', // Default logo path
  companyAddress: 'Lot 123, Jalan Utama, Kampung Baru, B1234, Brunei Darussalam',
  companyPhone: '+673 123 4567',
  companyEmail: 'hr@abangbob.com',
  companyRegNo: 'RC/00012345',
  showLogo: true,
  primaryColor: '#4F46E5',
  footerNote: 'Ini adalah slip gaji yang dijana secara automatik. Sila simpan untuk rekod anda.'
};

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
  const { user } = useAuth();
  const { staff, isInitialized } = useStaff();
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(mockPayslips[0]);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(mockPayslips[0]?.month);

  // Get branding from localStorage or use defaults
  const [branding, setBranding] = useState<PayslipBranding>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('payslipBranding');
      if (saved) return JSON.parse(saved);
    }
    return DEFAULT_PAYSLIP_BRANDING;
  });

  const currentStaff = staff.find(s => s.id === user?.id);

  // Calculate totals
  const totalEarnings = selectedPayslip
    ? selectedPayslip.basicSalary + selectedPayslip.overtime + selectedPayslip.allowances
    : 0;

  const totalDeductions = selectedPayslip
    ? selectedPayslip.epfEmployee + selectedPayslip.socso + selectedPayslip.otherDeductions
    : 0;

  if (!isInitialized || !currentStaff) {
    return (
      <StaffLayout>
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="staff-portal animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>

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
                {/* Company Branding Header */}
                <div style={{
                  background: `linear-gradient(135deg, ${branding.primaryColor}10 0%, ${branding.primaryColor}05 100%)`,
                  borderBottom: `2px solid ${branding.primaryColor}`,
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    {branding.showLogo && (
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: 'var(--radius-md)',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-light)',
                        overflow: 'hidden'
                      }}>
                        {branding.companyLogo ? (
                          <img
                            src={branding.companyLogo}
                            alt="Logo"
                            style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size: 1.5rem; font-weight: 700; color: var(--primary)">AB</span>';
                            }}
                          />
                        ) : (
                          <Building2 size={28} color={branding.primaryColor} />
                        )}
                      </div>
                    )}
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: branding.primaryColor, marginBottom: '0.25rem' }}>
                        {branding.companyName}
                      </h2>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {branding.companyRegNo}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>{branding.companyAddress}</div>
                    <div style={{ textAlign: 'right' }}>
                      📞 {branding.companyPhone} | ✉️ {branding.companyEmail}
                    </div>
                  </div>
                </div>

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
                    <strong>EMP-{(user?.id || '').slice(-4).padStart(4, '0')}</strong>
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
                        <span>TAP (Pekerja)</span>
                        <span>BND {selectedPayslip.epfEmployee.toFixed(2)}</span>
                      </div>
                      <div className="payslip-item">
                        <span>SCP</span>
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
                  <span>Caruman Majikan TAP: BND {selectedPayslip.epfEmployer.toFixed(2)}</span>
                </div>

                {/* Footer Note */}
                {branding.footerNote && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    fontStyle: 'italic'
                  }}>
                    {branding.footerNote}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </StaffLayout>
  );
}




