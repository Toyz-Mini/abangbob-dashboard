'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
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
    calculatePayroll,
    formatBND,
    getMonthLabel,
    getPayrollStatusLabel,
    TAP_EMPLOYEE_RATE,
    TAP_EMPLOYER_RATE,
    SCP_EMPLOYEE_RATE,
    SCP_EMPLOYER_RATE,
} from '@/lib/payroll-data';
import { generatePayslipPDF } from '@/lib/pdf-generator';
import PayslipSettingsModal, { DEFAULT_CONFIG } from '@/components/PayslipSettingsModal';
import { PayslipConfig } from '@/lib/types';
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
    RefreshCw,
    Settings
} from 'lucide-react';


export default function PayrollPage() {
    const { showToast } = useToast();
    const { getApprovedSalaryAdvances, markSalaryAdvanceAsDeducted, staff, leaveRequests } = useStaffPortal();

    // State
    const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>(MOCK_PAYROLL_ENTRIES);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<PayrollEntry>>({});

    // Settings State
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [payslipConfig, setPayslipConfig] = useState<PayslipConfig>(DEFAULT_CONFIG);

    useEffect(() => {
        const saved = localStorage.getItem('payslipConfig');
        if (saved) {
            try {
                setPayslipConfig(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse payslip config', e);
            }
        }
    }, []);

    const handleSaveConfig = (newConfig: PayslipConfig) => {
        setPayslipConfig(newConfig);
        localStorage.setItem('payslipConfig', JSON.stringify(newConfig));
    };

    // Get approved unpaid leave days for a staff member in the selected month
    const getApprovedUnpaidLeaveDays = useCallback((staffId: string, month: string): number => {
        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr);
        const monthIndex = parseInt(monthStr) - 1; // 0-based index

        const startOfMonth = new Date(year, monthIndex, 1);
        const endOfMonth = new Date(year, monthIndex + 1, 0);

        const unpaidLeaves = leaveRequests.filter(req =>
            req.staffId === staffId &&
            req.type === 'unpaid' &&
            req.status === 'approved' &&
            // Check overlap
            new Date(req.startDate) <= endOfMonth &&
            new Date(req.endDate) >= startOfMonth
        );

        let totalDays = 0;
        unpaidLeaves.forEach(req => {
            // Simple overlap calculation (assuming strict day counts from request duration)
            // Ideally should calculate exact days overlapping this month
            // For now, using the request's duration if it falls in the month
            // Refinement: Calculate exact overlap days
            const reqStart = new Date(req.startDate);
            const reqEnd = new Date(req.endDate);

            const overlapStart = reqStart > startOfMonth ? reqStart : startOfMonth;
            const overlapEnd = reqEnd < endOfMonth ? reqEnd : endOfMonth;

            if (overlapStart <= overlapEnd) {
                const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                totalDays += diffDays;
            }
        });

        return totalDays;
    }, [leaveRequests]);

    // Get approved salary advances for a staff member
    const getStaffAdvanceDeduction = useCallback((staffId: string): number => {
        const advances = getApprovedSalaryAdvances(staffId);
        return advances.reduce((sum, a) => sum + a.amount, 0);
    }, [getApprovedSalaryAdvances]);

    // Handle Generate/Refresh Payroll
    const handleGeneratePayroll = useCallback(() => {
        setIsGenerating(true);
        try {
            // In a real app, this might fetch from backend.
            // Here we generate based on current staff data.
            const newEntries: PayrollEntry[] = staff.map(s => {
                const unpaidDays = getApprovedUnpaidLeaveDays(s.id, selectedMonth);

                const calculated = calculatePayroll(
                    s,
                    0, // overtime (placeholder)
                    0, // bonus
                    0, // otherEarnings
                    0, // otherDeductions
                    unpaidDays
                );

                return {
                    ...calculated,
                    id: `pay_${s.id}_${selectedMonth}`,
                    staffId: s.id,
                    staffName: s.name,
                    month: selectedMonth,
                    status: 'draft',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
            });

            setPayrollEntries(newEntries);
            showToast('Payroll refreshed with latest staff & leave data', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to generate payroll', 'error');
        } finally {
            setIsGenerating(false);
        }
    }, [staff, selectedMonth, getApprovedUnpaidLeaveDays, showToast]);

    // Auto-generate on mount/month change if empty (optional, keeping manual mostly)
    // For demo purposes, let's keep the mock data initial state, but allow refresh.

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
                    { key: 'unpaidLeaveDeduction', label: 'Unpaid Leave Cut', format: 'currency' },
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
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;
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
                head: [['Staff', 'Gross', 'TAP (E)', 'TAP (R)', 'SCP (E)', 'SCP (R)', 'Unpaid', 'Deductions', 'Net Pay']],
                body: filteredEntries.map(e => [
                    e.staffName,
                    e.grossSalary.toFixed(2),
                    e.tapEmployee.toFixed(2),
                    e.tapEmployer.toFixed(2),
                    e.scpEmployee.toFixed(2),
                    e.scpEmployer.toFixed(2),
                    e.unpaidLeaveDeduction.toFixed(2),
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
                    filteredEntries.reduce((s, e) => s + (e.unpaidLeaveDeduction || 0), 0).toFixed(2),
                    filteredEntries.reduce((s, e) => s + e.totalDeductions, 0).toFixed(2),
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
        setEditForm({});
        setIsEditing(false);
        setShowDetailModal(true);
    };

    const handleEditClick = () => {
        if (selectedEntry) {
            setEditForm({
                bonus: selectedEntry.bonus,
                allowances: selectedEntry.allowances,
                unpaidLeaveDays: selectedEntry.unpaidLeaveDays,
                otherDeductions: selectedEntry.otherDeductions,
            });
            setIsEditing(true);
        }
    };

    const handleSaveEdit = () => {
        if (!selectedEntry || !staff) return;

        const currentStaff = staff.find(s => s.id === selectedEntry.staffId);
        if (!currentStaff) {
            showToast('Staff not found', 'error');
            return;
        }

        const newUnpaidDays = Number(editForm.unpaidLeaveDays) || 0;
        const newBonus = Number(editForm.bonus) || 0;
        const newAllowances = Number(editForm.allowances) || 0;
        const newOtherDeductions = Number(editForm.otherDeductions) || 0;

        // Recalculate basic parts (statutory rates etc)
        // We use the helper directly or calculatePayroll. 
        // calculatePayroll adds staff.allowances to gross. 
        // We want to OVERRIDE allowances.
        // So we calculate manually here to ensure we control the inputs.

        const manualGrossSalary = currentStaff.baseSalary + selectedEntry.overtimePay + newAllowances + newBonus + selectedEntry.otherEarnings;

        // Recalculate Statutory
        // Note: We use the stored settings in the entry (snapshot) rather than current staff settings, 
        // to preserve the state at time of generation, OR we can use current settings. 
        // Usually edits respect the snapshot settings.
        const tap = selectedEntry.tapEnabled ? (manualGrossSalary * TAP_EMPLOYEE_RATE / 100) : 0;
        const scp = selectedEntry.scpEnabled ? (manualGrossSalary * SCP_EMPLOYEE_RATE / 100) : 0;

        const unpaidCut = (selectedEntry.baseSalary / 26) * newUnpaidDays;

        // Fixed deductions from profile are usually fixed. otherDeductions is the variable part.
        // We need to know what 'fixedDeductions' were. 
        // In the entry, 'otherDeductions' stores (fixed + manual other).
        // This is tricky. 
        // Let's assume the user is editing the TOTAL 'otherDeductions' field which includes fixed ones.
        // simplified: 'otherDeductions' in UI = entry.otherDeductions.

        const tapEmp = Math.round(tap * 100) / 100;
        const tapEmpYr = Math.round((selectedEntry.tapEnabled ? (manualGrossSalary * TAP_EMPLOYER_RATE / 100) : 0) * 100) / 100;
        const scpEmp = Math.round(scp * 100) / 100;
        const scpEmpYr = Math.round((selectedEntry.scpEnabled ? (manualGrossSalary * SCP_EMPLOYER_RATE / 100) : 0) * 100) / 100;

        const totalDeductions = tapEmp + scpEmp + newOtherDeductions + unpaidCut;
        const netPay = manualGrossSalary - totalDeductions;

        const updatedEntry: PayrollEntry = {
            ...selectedEntry,
            grossSalary: manualGrossSalary,
            allowances: newAllowances,
            bonus: newBonus,
            // Update statutory
            tapEmployee: tapEmp,
            tapEmployer: tapEmpYr,
            scpEmployee: scpEmp,
            scpEmployer: scpEmpYr,
            // Update deductions
            unpaidLeaveDays: newUnpaidDays,
            unpaidLeaveDeduction: unpaidCut,
            otherDeductions: newOtherDeductions,
            totalDeductions: totalDeductions,
            netPay: netPay,
        };

        setPayrollEntries(prev => prev.map(e => e.id === selectedEntry.id ? updatedEntry : e));
        setSelectedEntry(updatedEntry);
        setIsEditing(false);
        showToast('Payslip updated', 'success');
    };

    const handleStatusUpdate = (entry: PayrollEntry, newStatus: PayrollEntry['status']) => {
        const updatedEntry = {
            ...entry,
            status: newStatus,
            paidAt: newStatus === 'paid' ? new Date().toISOString() : entry.paidAt
        };

        setPayrollEntries(prev => prev.map(e => e.id === entry.id ? updatedEntry : e));
        setSelectedEntry(updatedEntry);

        const label = getPayrollStatusLabel(newStatus).label;
        showToast(`Status dikemaskini: ${label}`, 'success');
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
                        <button
                            className="btn btn-primary"
                            onClick={handleGeneratePayroll}
                            disabled={isGenerating}
                            title="Kira semula gaji berdasarkan data terkini"
                        >
                            <RefreshCw size={16} className={isGenerating ? "spin-slow" : ""} />
                            {isGenerating ? 'Computing...' : 'Auto-Generate'}
                        </button>

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
                            className="btn btn-outline"
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
                        <div style={{ color: 'var(--danger)' }}>
                            * Unpaid Leave dikira: (Gaji Pokok ÷ 26) × Hari Cuti
                        </div>
                    </div>
                </div>

                {/* Payroll Table */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Senarai Gaji - {getMonthLabel(selectedMonth)}</div>
                    </div>

                    {filteredEntries.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Tiada rekod gaji untuk bulan ini</p>
                            <button className="btn btn-sm btn-primary mt-sm" onClick={handleGeneratePayroll}>
                                Generate Payroll for {getMonthLabel(selectedMonth)}
                            </button>
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
                                                <td style={{ textAlign: 'right' }}>{(entry.baseSalary || 0).toFixed(2)}</td>
                                                <td style={{ textAlign: 'right' }}>{(entry.overtimePay || 0).toFixed(2)}</td>
                                                <td style={{ textAlign: 'right' }}>{(entry.allowances || 0).toFixed(2)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                    {(entry.grossSalary || 0).toFixed(2)}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {entry.tapEnabled ? (
                                                        <span style={{ color: 'var(--success)' }}>
                                                            <CheckCircle size={14} style={{ display: 'inline', marginRight: '2px' }} />
                                                            {(entry.tapEmployee || 0).toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-light)' }}>-</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {entry.scpEnabled ? (
                                                        <span style={{ color: 'var(--success)' }}>
                                                            <CheckCircle size={14} style={{ display: 'inline', marginRight: '2px' }} />
                                                            {(entry.scpEmployee || 0).toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-light)' }}>-</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>
                                                    -{(entry.totalDeductions || 0).toFixed(2)}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                                                    BND {(entry.netPay || 0).toFixed(2)}
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
                                        <td style={{ textAlign: 'right' }}>{filteredEntries.reduce((s, e) => s + (e.baseSalary || 0), 0).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{filteredEntries.reduce((s, e) => s + (e.overtimePay || 0), 0).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{filteredEntries.reduce((s, e) => s + (e.allowances || 0), 0).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{(summary.totalGrossSalary || 0).toFixed(2)}</td>
                                        <td style={{ textAlign: 'center' }}>{(summary.totalTapEmployee || 0).toFixed(2)}</td>
                                        <td style={{ textAlign: 'center' }}>{(summary.totalScpEmployee || 0).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', color: 'var(--danger)' }}>
                                            -{((summary.totalTapEmployee || 0) + (summary.totalScpEmployee || 0)).toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--primary)' }}>
                                            BND {(summary.totalNetPay || 0).toFixed(2)}
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
                    title={isEditing ? "Edit Slip Gaji" : "Slip Gaji"}
                    maxWidth="500px"
                >
                    {selectedEntry && (
                        <div className="space-y-6 w-full">
                            {/* Header Section */}
                            <div className="flex justify-between items-start border-b border-gray-100 pb-4 gap-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{selectedEntry.staffName}</h3>
                                    <p className="text-sm text-gray-500 font-medium mt-1">{getMonthLabel(selectedEntry.month)}</p>
                                    {!isEditing && (
                                        <div className="mt-2">
                                            <span className={`badge badge-${getPayrollStatusLabel(selectedEntry.status).color}`}>
                                                {getPayrollStatusLabel(selectedEntry.status).label}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {!isEditing && (
                                    <div className="flex gap-2">
                                        <button
                                            className="btn btn-sm btn-ghost hover:bg-gray-100 text-gray-400 w-8 h-8 p-0 rounded-full flex items-center justify-center shrink-0"
                                            onClick={() => setShowSettingsModal(true)}
                                            title="Payslip Settings"
                                        >
                                            <Settings size={16} />
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline h-8 px-3 rounded-full flex items-center justify-center shrink-0 gap-2 hover:bg-gray-50 transition-colors"
                                            onClick={() => generatePayslipPDF(selectedEntry, payslipConfig)}
                                            title="Download PDF"
                                        >
                                            <Download size={14} />
                                            <span>PDF</span>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline h-8 px-3 rounded-full flex items-center justify-center shrink-0 gap-2 hover:bg-gray-50 transition-colors"
                                            onClick={handleEditClick}
                                            title="Edit Slip Gaji"
                                        >
                                            <Edit2 size={14} />
                                            <span>Edit</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Earnings Section */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pendapatan</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Gaji Pokok</span>
                                        <span className="font-medium">{(selectedEntry.baseSalary || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Overtime</span>
                                        <span className="font-medium">{(selectedEntry.overtimePay || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-gray-600">Elaun</span>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="form-input py-1 px-2 w-24 text-right text-sm"
                                                value={editForm.allowances}
                                                onChange={e => setEditForm({ ...editForm, allowances: Number(e.target.value) })}
                                            />
                                        ) : (
                                            <span className="font-medium">{(selectedEntry.allowances || 0).toFixed(2)}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-gray-600">Bonus</span>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="form-input py-1 px-2 w-24 text-right text-sm"
                                                value={editForm.bonus}
                                                onChange={e => setEditForm({ ...editForm, bonus: Number(e.target.value) })}
                                            />
                                        ) : (
                                            <span className="font-medium">{(selectedEntry.bonus || 0).toFixed(2)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 font-bold text-gray-900">
                                    <span>Jumlah Pendapatan</span>
                                    <span>BND {(selectedEntry.grossSalary || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Deductions Section */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Potongan</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">TAP (Pekerja {TAP_EMPLOYEE_RATE}%)</span>
                                        <span className={selectedEntry.tapEnabled ? "font-medium" : "text-gray-400"}>
                                            {selectedEntry.tapEnabled ? (selectedEntry.tapEmployee || 0).toFixed(2) : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">SCP (Pekerja {SCP_EMPLOYEE_RATE}%)</span>
                                        <span className={selectedEntry.scpEnabled ? "font-medium" : "text-gray-400"}>
                                            {selectedEntry.scpEnabled ? (selectedEntry.scpEmployee || 0).toFixed(2) : '-'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm items-center text-red-600">
                                        <span className="flex items-center gap-1">
                                            Cuti Tanpa Gaji
                                            {isEditing && (
                                                <span className="flex items-center bg-red-50 px-1 rounded text-xs ml-2">
                                                    Hari: <input
                                                        type="number"
                                                        className="bg-transparent w-8 text-center border-b border-red-200 focus:outline-none"
                                                        value={editForm.unpaidLeaveDays}
                                                        onChange={e => setEditForm({ ...editForm, unpaidLeaveDays: Number(e.target.value) })}
                                                    />
                                                </span>
                                            )}
                                            {!isEditing && selectedEntry.unpaidLeaveDays > 0 && (
                                                <span className="text-xs bg-red-50 px-1.5 py-0.5 rounded ml-2">
                                                    {selectedEntry.unpaidLeaveDays} hari
                                                </span>
                                            )}
                                        </span>
                                        <span className="font-medium">{(selectedEntry.unpaidLeaveDeduction || 0).toFixed(2)}</span>
                                    </div>

                                    {getStaffAdvanceDeduction(selectedEntry.staffId) > 0 && (
                                        <div className="flex justify-between text-sm text-yellow-600">
                                            <span>Pendahuluan Gaji</span>
                                            <span>{(getStaffAdvanceDeduction(selectedEntry.staffId) || 0).toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-gray-600">Potongan Lain</span>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="form-input py-1 px-2 w-24 text-right text-sm"
                                                value={editForm.otherDeductions}
                                                onChange={e => setEditForm({ ...editForm, otherDeductions: Number(e.target.value) })}
                                            />
                                        ) : (
                                            <span className="font-medium">{(selectedEntry.otherDeductions || 0).toFixed(2)}</span>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 font-bold"
                                    style={{ color: 'var(--danger)' }}
                                >
                                    <span>Jumlah Potongan</span>
                                    <span>-BND {((selectedEntry.totalDeductions || 0) + (getStaffAdvanceDeduction(selectedEntry.staffId) || 0)).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Employer Contributions (Reference) */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Caruman Majikan (Rujukan)</h4>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>TAP Majikan ({TAP_EMPLOYER_RATE}%)</span>
                                        <span>{selectedEntry.tapEnabled ? (selectedEntry.tapEmployer || 0).toFixed(2) : '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>SCP Majikan ({SCP_EMPLOYER_RATE}%)</span>
                                        <span>{selectedEntry.scpEnabled ? (selectedEntry.scpEmployer || 0).toFixed(2) : '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Net Pay */}
                            <div
                                className="text-white p-4 rounded-xl shadow-lg flex justify-between items-center transform transition-transform hover:scale-[1.02]"
                                style={{ background: 'var(--primary)' }}
                            >
                                <div className="flex flex-col">
                                    <span className="text-white/80 text-xs font-bold uppercase tracking-widest">Gaji Bersih</span>
                                    {selectedEntry.paidAt && (
                                        <span className="text-[10px] bg-white/20 px-1.5 rounded w-fit mt-1">
                                            Dibayar: {new Date(selectedEntry.paidAt).toLocaleDateString('ms-MY')}
                                        </span>
                                    )}
                                </div>
                                <span className="text-2xl font-bold tracking-tight">
                                    BND {((selectedEntry.netPay || 0) - (getStaffAdvanceDeduction(selectedEntry.staffId) || 0)).toFixed(2)}
                                </span>
                            </div>

                            {isEditing && (
                                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                                    <button
                                        className="btn btn-ghost hover:bg-gray-100 text-gray-600"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        className="btn btn-primary px-6"
                                        onClick={handleSaveEdit}
                                    >
                                        Simpan
                                    </button>
                                </div>
                            )}
                            {/* Status Actions */}
                            {!isEditing && (
                                <div className="mt-6 flex flex-col gap-3">
                                    {selectedEntry.status === 'draft' && (
                                        <button
                                            className="btn btn-primary w-full shadow-md"
                                            onClick={() => handleStatusUpdate(selectedEntry, 'approved')}
                                        >
                                            <CheckCircle size={18} className="mr-2" />
                                            Luluskan Payslip
                                        </button>
                                    )}
                                    {selectedEntry.status === 'approved' && (
                                        <button
                                            className="btn btn-success w-full shadow-md text-white"
                                            onClick={() => handleStatusUpdate(selectedEntry, 'paid')}
                                            style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                                        >
                                            <CheckCircle size={18} className="mr-2" />
                                            Tandai Selesai Dibayar
                                        </button>
                                    )}
                                    {selectedEntry.status === 'paid' && (
                                        <div className="text-center">
                                            <p className="text-sm text-gray-500 mb-2">Slip gaji telah dibayar pada {new Date(selectedEntry.paidAt!).toLocaleDateString('ms-MY')}</p>
                                            <button
                                                className="text-xs text-gray-400 hover:text-gray-600 underline"
                                                onClick={() => handleStatusUpdate(selectedEntry, 'approved')}
                                            >
                                                Kembalikan ke status Diluluskan
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </Modal>

                <PayslipSettingsModal
                    isOpen={showSettingsModal}
                    onClose={() => setShowSettingsModal(false)}
                    config={payslipConfig}
                    onSave={handleSaveConfig}
                />
            </div>
        </MainLayout>
    );
}
