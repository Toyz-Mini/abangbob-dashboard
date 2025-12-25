'use client';

import { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import { useToast } from '@/lib/contexts/ToastContext';
import { useStaffPortal } from '@/lib/store';
import { exportToCSV, type ExportColumn } from '@/lib/services';
import {
    PayrollEntry,
    PayrollSummary,
    MOCK_PAYROLL_ENTRIES,
    calculatePayrollSummary,
    formatBND,
    getMonthLabel,
    getPayrollStatusLabel,
    TAP_EMPLOYEE_RATE,
    TAP_EMPLOYER_RATE,
    SCP_EMPLOYEE_RATE,
    SCP_EMPLOYER_RATE,
} from '@/lib/payroll-data';
import {
    Users,
    DollarSign,
    Building2,
    Download,
    FileText,
    Calendar,
    CheckCircle,
    Clock,
    Eye,
    Edit2,
    Printer,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PayrollPage() {
    const { showToast } = useToast();
    const { getApprovedSalaryAdvances, markSalaryAdvanceAsDeducted, staff } = useStaffPortal();

    // State
    const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>(MOCK_PAYROLL_ENTRIES);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Get approved salary advances for a staff member
    const getStaffAdvanceDeduction = useCallback((staffId: string): number => {
        const advances = getApprovedSalaryAdvances(staffId);
        return advances.reduce((sum, a) => sum + a.amount, 0);
    }, [getApprovedSalaryAdvances]);

    // Filter entries by selected month
    const filteredEntries = useMemo(() => {
        return payrollEntries.filter(e => e.month === selectedMonth);
    }, [payrollEntries, selectedMonth]);

    // Calculate summary
    const summary = useMemo(() => {
        if (filteredEntries.length === 0) {
            return {
                month: selectedMonth,
                totalGrossSalary: 0,
                totalNetPay: 0,
                totalTapEmployee: 0,
                totalTapEmployer: 0,
                totalScpEmployee: 0,
                totalScpEmployer: 0,
                staffCount: 0,
            } as PayrollSummary;
        }
        return calculatePayrollSummary(filteredEntries);
    }, [filteredEntries, selectedMonth]);

    // Export handlers
    const handleExportCSV = useCallback(async () => {
        setIsExporting(true);
        try {
            exportToCSV({
                filename: `payroll_${selectedMonth}`,
                columns: [
                    { key: 'staffName', label: 'Staff Name' },
                    { key: 'baseSalary', label: 'Base Salary', format: 'currency' },
                    { key: 'overtimePay', label: 'Overtime', format: 'currency' },
                    { key: 'allowances', label: 'Allowances', format: 'currency' },
                    { key: 'grossSalary', label: 'Gross Salary', format: 'currency' },
                    { key: 'tapEmployee', label: 'TAP (Employee)', format: 'currency' },
                    { key: 'tapEmployer', label: 'TAP (Employer)', format: 'currency' },
                    { key: 'scpEmployee', label: 'SCP (Employee)', format: 'currency' },
                    { key: 'scpEmployer', label: 'SCP (Employer)', format: 'currency' },
                    { key: 'totalDeductions', label: 'Total Deductions', format: 'currency' },
                    { key: 'netPay', label: 'Net Pay', format: 'currency' },
                    { key: 'status', label: 'Status' },
                ],
                data: filteredEntries.map(e => ({
                    ...e,
                    status: getPayrollStatusLabel(e.status).label,
                })),
            });
            showToast('Payroll exported to CSV', 'success');
        } catch (error) {
            showToast('Failed to export', 'error');
        } finally {
            setIsExporting(false);
        }
    }, [filteredEntries, selectedMonth, showToast]);


    const handleExportPDF = useCallback(async () => {
        setIsExporting(true);
        try {
            const doc = new jsPDF();

            // Title
            doc.setFontSize(18);
            doc.text(`Payroll Report - ${getMonthLabel(selectedMonth)}`, 14, 20);

            // Summary
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString('ms-MY')}`, 14, 28);
            doc.text(`Total Staff: ${summary.staffCount}`, 14, 34);
            doc.text(`Total Gross: ${formatBND(summary.totalGrossSalary)}`, 14, 40);
            doc.text(`Total Net Pay: ${formatBND(summary.totalNetPay)}`, 14, 46);

            // TAP/SCP Summary
            doc.text(`TAP (Employee + Employer): ${formatBND(summary.totalTapEmployee + summary.totalTapEmployer)}`, 100, 34);
            doc.text(`SCP (Employee + Employer): ${formatBND(summary.totalScpEmployee + summary.totalScpEmployer)}`, 100, 40);

            // Table
            autoTable(doc, {
                startY: 55,
                head: [['Staff', 'Gross', 'TAP (E)', 'TAP (R)', 'SCP (E)', 'SCP (R)', 'Deductions', 'Net Pay']],
                body: filteredEntries.map(e => [
                    e.staffName,
                    e.grossSalary.toFixed(2),
                    e.tapEmployee.toFixed(2),
                    e.tapEmployer.toFixed(2),
                    e.scpEmployee.toFixed(2),
                    e.scpEmployer.toFixed(2),
                    e.totalDeductions.toFixed(2),
                    e.netPay.toFixed(2),
                ]),
                foot: [[
                    'TOTAL',
                    summary.totalGrossSalary.toFixed(2),
                    summary.totalTapEmployee.toFixed(2),
                    summary.totalTapEmployer.toFixed(2),
                    summary.totalScpEmployee.toFixed(2),
                    summary.totalScpEmployer.toFixed(2),
                    (summary.totalTapEmployee + summary.totalScpEmployee).toFixed(2),
                    summary.totalNetPay.toFixed(2),
                ]],
                styles: { fontSize: 8 },
                headStyles: { fillColor: [185, 28, 28] },
                footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            });

            doc.save(`payroll_${selectedMonth}.pdf`);
            showToast('Payroll exported to PDF', 'success');
        } catch (error) {
            showToast('Failed to export PDF', 'error');
        } finally {
            setIsExporting(false);
        }
    }, [filteredEntries, selectedMonth, summary, showToast]);

    // View detail
    const handleViewDetail = (entry: PayrollEntry) => {
        setSelectedEntry(entry);
        setShowDetailModal(true);
    };

    return (
        <MainLayout>
            <div className="animate-fade-in">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Users size={28} />
                        <div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                                Pengurusan Gaji
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
                                Gaji, TAP & SCP untuk staf
                            </p>
                        </div>
                    </div>

                    {/* Month Picker & Export */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="form-input"
                            style={{ width: 'auto' }}
                        />
                        <button
                            className="btn btn-outline"
                            onClick={handleExportCSV}
                            disabled={isExporting || filteredEntries.length === 0}
                        >
                            <Download size={16} />
                            CSV
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleExportPDF}
                            disabled={isExporting || filteredEntries.length === 0}
                        >
                            <FileText size={16} />
                            PDF
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="content-grid cols-4 mb-lg">
                    <StatCard
                        label="Jumlah Staf"
                        value={summary.staffCount}
                        icon={Users}
                        gradient="primary"
                    />
                    <StatCard
                        label="Jumlah Gaji Kasar"
                        value={`BND ${summary.totalGrossSalary.toFixed(2)}`}
                        icon={DollarSign}
                        gradient="peach"
                    />
                    <StatCard
                        label="Total TAP (Caruman)"
                        value={`BND ${(summary.totalTapEmployee + summary.totalTapEmployer).toFixed(2)}`}
                        change={`E: ${summary.totalTapEmployee.toFixed(2)} | R: ${summary.totalTapEmployer.toFixed(2)}`}
                        changeType="neutral"
                        icon={Building2}
                        gradient="info"
                    />
                    <StatCard
                        label="Total SCP (Caruman)"
                        value={`BND ${(summary.totalScpEmployee + summary.totalScpEmployer).toFixed(2)}`}
                        change={`E: ${summary.totalScpEmployee.toFixed(2)} | R: ${summary.totalScpEmployer.toFixed(2)}`}
                        changeType="neutral"
                        icon={Building2}
                    />
                </div>

                {/* Rate Info */}
                <div className="card mb-lg" style={{ padding: '1rem', background: 'var(--gray-50)' }}>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                        <div>
                            <strong>TAP Rate:</strong> Employee {TAP_EMPLOYEE_RATE}% + Employer {TAP_EMPLOYER_RATE}%
                        </div>
                        <div>
                            <strong>SCP Rate:</strong> Employee {SCP_EMPLOYEE_RATE}% + Employer {SCP_EMPLOYER_RATE}%
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                            * TAP/SCP boleh enable/disable per staf
                        </div>
                    </div>
                </div>

                {/* Payroll Table */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Senarai Gaji - {getMonthLabel(selectedMonth)}</div>
                    </div>

                    {filteredEntries.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Tiada rekod gaji untuk bulan ini</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nama Staf</th>
                                        <th style={{ textAlign: 'right' }}>Gaji Pokok</th>
                                        <th style={{ textAlign: 'right' }}>OT</th>
                                        <th style={{ textAlign: 'right' }}>Elaun</th>
                                        <th style={{ textAlign: 'right' }}>Gaji Kasar</th>
                                        <th style={{ textAlign: 'center' }}>TAP</th>
                                        <th style={{ textAlign: 'center' }}>SCP</th>
                                        <th style={{ textAlign: 'right' }}>Potongan</th>
                                        <th style={{ textAlign: 'right' }}>Gaji Bersih</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEntries.map((entry) => {
                                        const status = getPayrollStatusLabel(entry.status);
                                        return (
                                            <tr key={entry.id}>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{entry.staffName}</div>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>{entry.baseSalary.toFixed(2)}</td>
                                                <td style={{ textAlign: 'right' }}>{entry.overtimePay.toFixed(2)}</td>
                                                <td style={{ textAlign: 'right' }}>{entry.allowances.toFixed(2)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                    {entry.grossSalary.toFixed(2)}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {entry.tapEnabled ? (
                                                        <span style={{ color: 'var(--success)' }}>
                                                            <CheckCircle size={14} style={{ display: 'inline', marginRight: '2px' }} />
                                                            {entry.tapEmployee.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-light)' }}>-</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {entry.scpEnabled ? (
                                                        <span style={{ color: 'var(--success)' }}>
                                                            <CheckCircle size={14} style={{ display: 'inline', marginRight: '2px' }} />
                                                            {entry.scpEmployee.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-light)' }}>-</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>
                                                    -{entry.totalDeductions.toFixed(2)}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                                                    BND {entry.netPay.toFixed(2)}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`badge badge-${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-ghost"
                                                        onClick={() => handleViewDetail(entry)}
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: 'var(--gray-100)', fontWeight: 600 }}>
                                        <td>JUMLAH</td>
                                        <td style={{ textAlign: 'right' }}>{filteredEntries.reduce((s, e) => s + e.baseSalary, 0).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{filteredEntries.reduce((s, e) => s + e.overtimePay, 0).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{filteredEntries.reduce((s, e) => s + e.allowances, 0).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{summary.totalGrossSalary.toFixed(2)}</td>
                                        <td style={{ textAlign: 'center' }}>{summary.totalTapEmployee.toFixed(2)}</td>
                                        <td style={{ textAlign: 'center' }}>{summary.totalScpEmployee.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', color: 'var(--danger)' }}>
                                            -{(summary.totalTapEmployee + summary.totalScpEmployee).toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--primary)' }}>
                                            BND {summary.totalNetPay.toFixed(2)}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Slip Gaji"
                    maxWidth="500px"
                >
                    {selectedEntry && (
                        <div>
                            <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
                                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem' }}>{selectedEntry.staffName}</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{getMonthLabel(selectedEntry.month)}</p>
                            </div>

                            {/* Earnings */}
                            <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>PENDAPATAN</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>Gaji Pokok</span>
                                    <span>{selectedEntry.baseSalary.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>Overtime</span>
                                    <span>{selectedEntry.overtimePay.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>Elaun</span>
                                    <span>{selectedEntry.allowances.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>Bonus</span>
                                    <span>{selectedEntry.bonus.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, paddingTop: '0.5rem', borderTop: '1px solid var(--gray-200)' }}>
                                    <span>Jumlah Pendapatan</span>
                                    <span>BND {selectedEntry.grossSalary.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>POTONGAN</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>TAP (Pekerja {TAP_EMPLOYEE_RATE}%)</span>
                                    <span style={{ color: selectedEntry.tapEnabled ? 'inherit' : 'var(--text-light)' }}>
                                        {selectedEntry.tapEnabled ? selectedEntry.tapEmployee.toFixed(2) : '- (Tidak Aktif)'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>SCP (Pekerja {SCP_EMPLOYEE_RATE}%)</span>
                                    <span style={{ color: selectedEntry.scpEnabled ? 'inherit' : 'var(--text-light)' }}>
                                        {selectedEntry.scpEnabled ? selectedEntry.scpEmployee.toFixed(2) : '- (Tidak Aktif)'}
                                    </span>
                                </div>
                                {getStaffAdvanceDeduction(selectedEntry.staffId) > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: 'var(--warning)' }}>
                                        <span>Pendahuluan Gaji</span>
                                        <span>{getStaffAdvanceDeduction(selectedEntry.staffId).toFixed(2)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>Potongan Lain</span>
                                    <span>{selectedEntry.otherDeductions.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, paddingTop: '0.5rem', borderTop: '1px solid var(--gray-200)', color: 'var(--danger)' }}>
                                    <span>Jumlah Potongan</span>
                                    <span>-BND {(selectedEntry.totalDeductions + getStaffAdvanceDeduction(selectedEntry.staffId)).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Employer Contributions (for reference) */}
                            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>CARUMAN MAJIKAN (Untuk Rujukan)</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span>TAP Majikan ({TAP_EMPLOYER_RATE}%)</span>
                                    <span>{selectedEntry.tapEnabled ? selectedEntry.tapEmployer.toFixed(2) : '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span>SCP Majikan ({SCP_EMPLOYER_RATE}%)</span>
                                    <span>{selectedEntry.scpEnabled ? selectedEntry.scpEmployer.toFixed(2) : '-'}</span>
                                </div>
                            </div>

                            {/* Net Pay */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, padding: '1rem', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-md)' }}>
                                <span>GAJI BERSIH</span>
                                <span>BND {(selectedEntry.netPay - getStaffAdvanceDeduction(selectedEntry.staffId)).toFixed(2)}</span>
                            </div>

                            {/* Status */}
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={`badge badge-${getPayrollStatusLabel(selectedEntry.status).color}`}>
                                    {getPayrollStatusLabel(selectedEntry.status).label}
                                </span>
                                {selectedEntry.paidAt && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        Dibayar: {new Date(selectedEntry.paidAt).toLocaleDateString('ms-MY')}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
}
