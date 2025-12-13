'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaff, useKPI } from '@/lib/store';
import { StaffProfile, AttendanceRecord } from '@/lib/types';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getRankTier, getScoreColor } from '@/lib/kpi-data';
import Link from 'next/link';
import { 
  DollarSign, 
  Calculator, 
  FileText, 
  Download,
  Users,
  Clock,
  Calendar,
  Printer,
  CheckCircle,
  Trophy,
  Award
} from 'lucide-react';
import StatCard from '@/components/StatCard';

interface PayrollEntry {
  staffId: string;
  staffName: string;
  role: string;
  baseSalary: number;
  hourlyRate: number;
  daysWorked: number;
  totalHours: number;
  regularHours: number;
  otHours: number;
  regularPay: number;
  otPay: number;
  kpiBonus: number;
  kpiScore: number;
  grossPay: number;
  deductions: {
    epf: number;
    socso: number;
    advances: number;
    other: number;
  };
  netPay: number;
}

export default function PayrollPage() {
  const { staff, attendance, isInitialized } = useStaff();
  const { getStaffKPI, getStaffBonus } = useKPI();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollEntry | null>(null);
  const [otRate, setOtRate] = useState(1.5); // OT multiplier
  const [regularHoursPerDay, setRegularHoursPerDay] = useState(8);
  const [deductionRates, setDeductionRates] = useState({
    epf: 8, // % of gross
    socso: 0.5, // % of gross
  });

  // Calculate payroll for each staff
  const payrollData = useMemo((): PayrollEntry[] => {
    const activeStaff = staff.filter(s => s.status === 'active');
    const monthAttendance = attendance.filter(a => a.date.startsWith(selectedMonth));

    return activeStaff.map(s => {
      const staffRecords = monthAttendance.filter(a => a.staffId === s.id);
      
      // Calculate hours worked
      let totalMinutes = 0;
      staffRecords.forEach(record => {
        if (record.clockInTime && record.clockOutTime) {
          const [inH, inM] = record.clockInTime.split(':').map(Number);
          const [outH, outM] = record.clockOutTime.split(':').map(Number);
          const worked = (outH * 60 + outM) - (inH * 60 + inM) - record.breakDuration;
          totalMinutes += Math.max(0, worked);
        }
      });

      const totalHours = totalMinutes / 60;
      const daysWorked = staffRecords.filter(r => r.clockInTime && r.clockOutTime).length;
      const regularHoursLimit = daysWorked * regularHoursPerDay;
      const regularHours = Math.min(totalHours, regularHoursLimit);
      const otHours = Math.max(0, totalHours - regularHoursLimit);

      // Calculate pay
      const regularPay = regularHours * s.hourlyRate;
      const otPay = otHours * s.hourlyRate * otRate;
      
      // Get KPI bonus
      const staffKPI = getStaffKPI(s.id, selectedMonth);
      const kpiBonus = getStaffBonus(s.id, selectedMonth);
      const kpiScore = staffKPI?.overallScore || 0;
      
      const grossPay = regularPay + otPay + kpiBonus;

      // Calculate deductions (on base pay, not including bonus)
      const basePay = regularPay + otPay;
      const epf = (basePay * deductionRates.epf) / 100;
      const socso = (basePay * deductionRates.socso) / 100;
      const advances = 0; // Could be tracked separately
      const other = 0;
      const totalDeductions = epf + socso + advances + other;
      const netPay = grossPay - totalDeductions;

      return {
        staffId: s.id,
        staffName: s.name,
        role: s.role,
        baseSalary: s.baseSalary,
        hourlyRate: s.hourlyRate,
        daysWorked,
        totalHours: Math.round(totalHours * 100) / 100,
        regularHours: Math.round(regularHours * 100) / 100,
        otHours: Math.round(otHours * 100) / 100,
        regularPay: Math.round(regularPay * 100) / 100,
        otPay: Math.round(otPay * 100) / 100,
        kpiBonus: Math.round(kpiBonus * 100) / 100,
        kpiScore,
        grossPay: Math.round(grossPay * 100) / 100,
        deductions: {
          epf: Math.round(epf * 100) / 100,
          socso: Math.round(socso * 100) / 100,
          advances,
          other
        },
        netPay: Math.round(netPay * 100) / 100,
      };
    }).sort((a, b) => b.netPay - a.netPay);
  }, [staff, attendance, selectedMonth, otRate, regularHoursPerDay, deductionRates, getStaffKPI, getStaffBonus]);

  // Summary totals
  const summary = useMemo(() => {
    return {
      totalStaff: payrollData.length,
      totalGross: payrollData.reduce((sum, p) => sum + p.grossPay, 0),
      totalDeductions: payrollData.reduce((sum, p) => sum + p.deductions.epf + p.deductions.socso + p.deductions.advances + p.deductions.other, 0),
      totalNet: payrollData.reduce((sum, p) => sum + p.netPay, 0),
      totalHours: payrollData.reduce((sum, p) => sum + p.totalHours, 0),
      totalOT: payrollData.reduce((sum, p) => sum + p.otHours, 0),
      totalKPIBonus: payrollData.reduce((sum, p) => sum + p.kpiBonus, 0),
    };
  }, [payrollData]);

  const openPayslip = (entry: PayrollEntry) => {
    setSelectedPayroll(entry);
    setShowPayslipModal(true);
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
  };

  if (!isInitialized) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Payroll Generator
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Jana gaji staf secara automatik dari rekod kehadiran
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Calendar size={20} color="var(--text-secondary)" />
            <input
              type="month"
              className="form-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: 'auto' }}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label="Jumlah Staf"
            value={summary.totalStaff}
            change="staf aktif bulan ini"
            changeType="neutral"
            icon={Users}
            gradient="primary"
          />
          <StatCard
            label="Jumlah Jam"
            value={`${summary.totalHours.toFixed(1)}h`}
            change={`OT: ${summary.totalOT.toFixed(1)}h`}
            changeType={summary.totalOT > 0 ? "neutral" : "positive"}
            icon={Clock}
          />
          <StatCard
            label="Gaji Kasar"
            value={`BND ${summary.totalGross.toFixed(2)}`}
            change="jumlah sebelum potongan"
            changeType="neutral"
            icon={Calculator}
            gradient="warning"
          />
          <StatCard
            label="Gaji Bersih"
            value={`BND ${summary.totalNet.toFixed(2)}`}
            change={`Bonus KPI: BND ${summary.totalKPIBonus.toFixed(2)}`}
            changeType={summary.totalKPIBonus > 0 ? "positive" : "neutral"}
            icon={DollarSign}
            gradient="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4" style={{ gap: '1.5rem' }}>
          {/* Settings */}
          <div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Tetapan Gaji</div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Jam Biasa / Hari</label>
                <input
                  type="number"
                  className="form-input"
                  value={regularHoursPerDay}
                  onChange={(e) => setRegularHoursPerDay(Number(e.target.value))}
                  min="1"
                  max="12"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kadar OT (×)</label>
                <select
                  className="form-select"
                  value={otRate}
                  onChange={(e) => setOtRate(Number(e.target.value))}
                >
                  <option value="1.25">1.25× (25% lebih)</option>
                  <option value="1.5">1.5× (50% lebih)</option>
                  <option value="2">2× (Double)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Potongan TAP/SCP (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={deductionRates.epf}
                  onChange={(e) => setDeductionRates(prev => ({ ...prev, epf: Number(e.target.value) }))}
                  min="0"
                  max="20"
                  step="0.5"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Potongan SCP (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={deductionRates.socso}
                  onChange={(e) => setDeductionRates(prev => ({ ...prev, socso: Number(e.target.value) }))}
                  min="0"
                  max="5"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} />
                  Senarai Gaji - {getMonthName(selectedMonth)}
                </div>
              </div>

              {payrollData.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th>Jawatan</th>
                        <th>Hari</th>
                        <th>Jam</th>
                        <th>OT</th>
                        <th style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                            <Trophy size={14} color="var(--warning)" />
                            KPI Bonus
                          </div>
                        </th>
                        <th>Gaji Kasar</th>
                        <th>Potongan</th>
                        <th>Gaji Bersih</th>
                        <th>Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollData.map(entry => {
                        const tier = entry.kpiScore > 0 ? getRankTier(entry.kpiScore) : null;
                        return (
                          <tr key={entry.staffId}>
                            <td style={{ fontWeight: 600 }}>{entry.staffName}</td>
                            <td>{entry.role}</td>
                            <td>{entry.daysWorked}</td>
                            <td>{entry.regularHours.toFixed(1)}h</td>
                            <td>
                              {entry.otHours > 0 ? (
                                <span className="badge badge-warning">{entry.otHours.toFixed(1)}h</span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {entry.kpiBonus > 0 ? (
                                <Link href={`/hr/kpi/${entry.staffId}`} style={{ textDecoration: 'none' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                    <span style={{ 
                                      padding: '0.125rem 0.5rem',
                                      borderRadius: '9999px',
                                      fontSize: '0.65rem',
                                      fontWeight: 600,
                                      background: tier ? `${tier.color}20` : 'var(--gray-100)',
                                      color: tier?.color || 'var(--text-secondary)'
                                    }}>
                                      {tier?.icon} {entry.kpiScore}%
                                    </span>
                                    <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>
                                      +BND {entry.kpiBonus.toFixed(2)}
                                    </span>
                                  </div>
                                </Link>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>-</span>
                              )}
                            </td>
                            <td>BND {entry.grossPay.toFixed(2)}</td>
                            <td style={{ color: 'var(--danger)' }}>
                              - BND {(entry.deductions.epf + entry.deductions.socso + entry.deductions.advances + entry.deductions.other).toFixed(2)}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                              BND {entry.netPay.toFixed(2)}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => openPayslip(entry)}
                              >
                                <FileText size={14} />
                                Payslip
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--gray-100)', fontWeight: 700 }}>
                        <td colSpan={5}>JUMLAH</td>
                        <td style={{ textAlign: 'center', color: 'var(--success)' }}>+BND {summary.totalKPIBonus.toFixed(2)}</td>
                        <td>BND {summary.totalGross.toFixed(2)}</td>
                        <td style={{ color: 'var(--danger)' }}>- BND {summary.totalDeductions.toFixed(2)}</td>
                        <td style={{ color: 'var(--success)' }}>BND {summary.totalNet.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <Users size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Tiada data gaji untuk bulan ini
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Pastikan staf telah clock in/out untuk menjana gaji
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payslip Modal */}
        <Modal
          isOpen={showPayslipModal}
          onClose={() => setShowPayslipModal(false)}
          title="Payslip"
          subtitle={`${selectedPayroll?.staffName} - ${getMonthName(selectedMonth)}`}
          maxWidth="500px"
        >
          {selectedPayroll && (
            <div key={`payslip-${selectedPayroll.staffId}-${selectedMonth}`}>
              <div style={{ 
                background: 'var(--gray-50)', 
                padding: '1.5rem', 
                borderRadius: 'var(--radius-md)',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>ABANGBOB</h3>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Nasi Lemak & Burger</div>
                  <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>SLIP GAJI</div>
                </div>

                <div style={{ borderTop: '1px dashed var(--gray-300)', paddingTop: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Nama</div>
                      <div style={{ fontWeight: 600 }}>{selectedPayroll.staffName}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Jawatan</div>
                      <div>{selectedPayroll.role}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Tempoh</div>
                      <div>{getMonthName(selectedMonth)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Hari Bekerja</div>
                      <div>{selectedPayroll.daysWorked} hari</div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed var(--gray-300)', paddingTop: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>PENDAPATAN</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Gaji Biasa ({selectedPayroll.regularHours.toFixed(1)}h × BND {selectedPayroll.hourlyRate.toFixed(2)})</span>
                    <span>BND {selectedPayroll.regularPay.toFixed(2)}</span>
                  </div>
                  {selectedPayroll.otHours > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>OT ({selectedPayroll.otHours.toFixed(1)}h × BND {(selectedPayroll.hourlyRate * otRate).toFixed(2)})</span>
                      <span>BND {selectedPayroll.otPay.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedPayroll.kpiBonus > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '0.25rem',
                      background: '#fef3c7',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      marginTop: '0.5rem'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Trophy size={14} color="#d97706" />
                        Bonus KPI ({selectedPayroll.kpiScore}%)
                      </span>
                      <span style={{ color: '#d97706', fontWeight: 600 }}>+ BND {selectedPayroll.kpiBonus.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--gray-200)' }}>
                    <span>Jumlah Pendapatan</span>
                    <span>BND {selectedPayroll.grossPay.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed var(--gray-300)', paddingTop: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>POTONGAN</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>TAP/SCP ({deductionRates.epf}%)</span>
                    <span style={{ color: 'var(--danger)' }}>- BND {selectedPayroll.deductions.epf.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>SCP ({deductionRates.socso}%)</span>
                    <span style={{ color: 'var(--danger)' }}>- BND {selectedPayroll.deductions.socso.toFixed(2)}</span>
                  </div>
                  {selectedPayroll.deductions.advances > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Pendahuluan</span>
                      <span style={{ color: 'var(--danger)' }}>- BND {selectedPayroll.deductions.advances.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--gray-200)' }}>
                    <span>Jumlah Potongan</span>
                    <span style={{ color: 'var(--danger)' }}>
                      - BND {(selectedPayroll.deductions.epf + selectedPayroll.deductions.socso + selectedPayroll.deductions.advances + selectedPayroll.deductions.other).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ 
                  background: '#d1fae5', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 700, color: '#065f46' }}>GAJI BERSIH</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#065f46' }}>
                    BND {selectedPayroll.netPay.toFixed(2)}
                  </span>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div>Dijana pada: {new Date().toLocaleDateString('ms-MY')}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowPayslipModal(false)}
                  style={{ flex: 1 }}
                >
                  Tutup
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handlePrintPayslip}
                  style={{ flex: 1 }}
                >
                  <Printer size={18} />
                  Cetak
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}

