'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/lib/contexts/ToastContext';
import { exportToCSV, type ExportColumn } from '@/lib/services';
import {
    PayrollEntry,
    MOCK_PAYROLL_ENTRIES,
    formatBND,
    getMonthLabel,
    TAP_EMPLOYEE_RATE,
    TAP_EMPLOYER_RATE,
    SCP_EMPLOYEE_RATE,
    SCP_EMPLOYER_RATE,
} from '@/lib/payroll-data';
import {
    Building2,
    Users,
    Download,
    FileText,
    Calendar,
    CheckCircle,
    XCircle,
    TrendingUp,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TaxSummaryPage() {
    const { showToast } = useToast();

    // State
    const [payrollEntries] = useState<PayrollEntry[]>(MOCK_PAYROLL_ENTRIES);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [isExporting, setIsExporting] = useState(false);

    // Filter entries by selected year
    const yearlyEntries = useMemo(() => {
        return payrollEntries.filter(e => e.month.startsWith(selectedYear));
    }, [payrollEntries, selectedYear]);

    // Calculate yearly totals
    const yearlyTotals = useMemo(() => {
        return {
            totalGross: yearlyEntries.reduce((sum, e) => sum + e.grossSalary, 0),
            totalNet: yearlyEntries.reduce((sum, e) => sum + e.netPay, 0),
            tapEmployee: yearlyEntries.reduce((sum, e) => sum + e.tapEmployee, 0),
            tapEmployer: yearlyEntries.reduce((sum, e) => sum + e.tapEmployer, 0),
            scpEmployee: yearlyEntries.reduce((sum, e) => sum + e.scpEmployee, 0),
            scpEmployer: yearlyEntries.reduce((sum, e) => sum + e.scpEmployer, 0),
            staffWithTap: yearlyEntries.filter(e => e.tapEnabled).length,
            staffWithScp: yearlyEntries.filter(e => e.scpEnabled).length,
            totalStaff: yearlyEntries.length,
        };
    }, [yearlyEntries]);

    // Monthly breakdown
    const monthlyBreakdown = useMemo(() => {
        const months: Record<string, {
            tapEmployee: number;
            tapEmployer: number;
            scpEmployee: number;
            scpEmployer: number;
            staffCount: number;
        }> = {};

        yearlyEntries.forEach(entry => {
            if (!months[entry.month]) {
                months[entry.month] = {
                    tapEmployee: 0,
                    tapEmployer: 0,
                    scpEmployee: 0,
                    scpEmployer: 0,
                    staffCount: 0,
                };
            }
            months[entry.month].tapEmployee += entry.tapEmployee;
            months[entry.month].tapEmployer += entry.tapEmployer;
            months[entry.month].scpEmployee += entry.scpEmployee;
            months[entry.month].scpEmployer += entry.scpEmployer;
            months[entry.month].staffCount++;
        });

        return Object.entries(months)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => ({ month, ...data }));
    }, [yearlyEntries]);

    // Export to PDF for accountant
    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const doc = new jsPDF();

            // Title
            doc.setFontSize(16);
            doc.text('RINGKASAN CARUMAN TAP & SCP', 105, 20, { align: 'center' });
            doc.setFontSize(12);
            doc.text('AbangBob Enterprise', 105, 28, { align: 'center' });
            doc.text(`Tahun ${selectedYear}`, 105, 36, { align: 'center' });

            doc.setFontSize(8);
            doc.text(`Dijana: ${new Date().toLocaleDateString('ms-MY')}`, 14, 45);

            // Yearly Summary
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('RINGKASAN TAHUNAN', 14, 55);
            doc.setFont('helvetica', 'normal');

            const summaryData = [
                ['Jumlah Gaji Kasar', formatBND(yearlyTotals.totalGross)],
                ['TAP (Pekerja)', formatBND(yearlyTotals.tapEmployee)],
                ['TAP (Majikan)', formatBND(yearlyTotals.tapEmployer)],
                ['TAP Jumlah', formatBND(yearlyTotals.tapEmployee + yearlyTotals.tapEmployer)],
                ['SCP (Pekerja)', formatBND(yearlyTotals.scpEmployee)],
                ['SCP (Majikan)', formatBND(yearlyTotals.scpEmployer)],
                ['SCP Jumlah', formatBND(yearlyTotals.scpEmployee + yearlyTotals.scpEmployer)],
                ['JUMLAH CARUMAN', formatBND(yearlyTotals.tapEmployee + yearlyTotals.tapEmployer + yearlyTotals.scpEmployee + yearlyTotals.scpEmployer)],
            ];

            autoTable(doc, {
                startY: 60,
                head: [['Butiran', 'Jumlah']],
                body: summaryData,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [185, 28, 28] },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 60, halign: 'right' },
                },
            });

            // Monthly Breakdown
            const startY = (doc as any).lastAutoTable.finalY + 15;
            doc.setFont('helvetica', 'bold');
            doc.text('PECAHAN BULANAN', 14, startY);

            autoTable(doc, {
                startY: startY + 5,
                head: [['Bulan', 'TAP (P)', 'TAP (M)', 'SCP (P)', 'SCP (M)', 'Jumlah']],
                body: monthlyBreakdown.map(m => [
                    getMonthLabel(m.month),
                    m.tapEmployee.toFixed(2),
                    m.tapEmployer.toFixed(2),
                    m.scpEmployee.toFixed(2),
                    m.scpEmployer.toFixed(2),
                    (m.tapEmployee + m.tapEmployer + m.scpEmployee + m.scpEmployer).toFixed(2),
                ]),
                foot: [[
                    'JUMLAH',
                    yearlyTotals.tapEmployee.toFixed(2),
                    yearlyTotals.tapEmployer.toFixed(2),
                    yearlyTotals.scpEmployee.toFixed(2),
                    yearlyTotals.scpEmployer.toFixed(2),
                    (yearlyTotals.tapEmployee + yearlyTotals.tapEmployer + yearlyTotals.scpEmployee + yearlyTotals.scpEmployer).toFixed(2),
                ]],
                styles: { fontSize: 8 },
                headStyles: { fillColor: [100, 100, 100] },
                footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            });

            // Notes
            const notesY = (doc as any).lastAutoTable.finalY + 15;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('Nota:', 14, notesY);
            doc.text(`- TAP Rate: Pekerja ${TAP_EMPLOYEE_RATE}% + Majikan ${TAP_EMPLOYER_RATE}%`, 14, notesY + 5);
            doc.text(`- SCP Rate: Pekerja ${SCP_EMPLOYEE_RATE}% + Majikan ${SCP_EMPLOYER_RATE}%`, 14, notesY + 10);
            doc.text('- P = Caruman Pekerja, M = Caruman Majikan', 14, notesY + 15);

            doc.save(`tap_scp_summary_${selectedYear}.pdf`);
            showToast('Ringkasan TAP/SCP diexport ke PDF', 'success');
        } catch (error) {
            showToast('Gagal export PDF', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    // Export to CSV
    const handleExportCSV = () => {
        exportToCSV({
            filename: `tap_scp_${selectedYear}`,
            columns: [
                { key: 'month', label: 'Bulan' },
                { key: 'tapEmployee', label: 'TAP Pekerja', format: 'currency' },
                { key: 'tapEmployer', label: 'TAP Majikan', format: 'currency' },
                { key: 'scpEmployee', label: 'SCP Pekerja', format: 'currency' },
                { key: 'scpEmployer', label: 'SCP Majikan', format: 'currency' },
                { key: 'total', label: 'Jumlah', format: 'currency' },
            ],
            data: monthlyBreakdown.map(m => ({
                month: getMonthLabel(m.month),
                tapEmployee: m.tapEmployee,
                tapEmployer: m.tapEmployer,
                scpEmployee: m.scpEmployee,
                scpEmployer: m.scpEmployer,
                total: m.tapEmployee + m.tapEmployer + m.scpEmployee + m.scpEmployer,
            })),
        });
        showToast('Data diexport ke CSV', 'success');
    };


    const years = ['2024', '2025', '2026'];

    return (
        <MainLayout>
            <div className="animate-fade-in">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Building2 size={28} />
                        <div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                                Ringkasan TAP & SCP
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
                                Caruman statutori untuk akaun dan pihak berkuasa
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="form-select"
                            style={{ width: 'auto' }}
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <button
                            className="btn btn-outline"
                            onClick={handleExportCSV}
                            disabled={isExporting || monthlyBreakdown.length === 0}
                        >
                            <Download size={16} />
                            CSV
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleExportPDF}
                            disabled={isExporting || monthlyBreakdown.length === 0}
                        >
                            <FileText size={16} />
                            PDF
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="content-grid cols-4 mb-lg">
                    <StatCard
                        label="Jumlah TAP (Tahun)"
                        value={formatBND(yearlyTotals.tapEmployee + yearlyTotals.tapEmployer)}
                        change={`P: ${yearlyTotals.tapEmployee.toFixed(2)} | M: ${yearlyTotals.tapEmployer.toFixed(2)}`}
                        changeType="neutral"
                        icon={Building2}
                        gradient="primary"
                    />
                    <StatCard
                        label="Jumlah SCP (Tahun)"
                        value={formatBND(yearlyTotals.scpEmployee + yearlyTotals.scpEmployer)}
                        change={`P: ${yearlyTotals.scpEmployee.toFixed(2)} | M: ${yearlyTotals.scpEmployer.toFixed(2)}`}
                        changeType="neutral"
                        icon={Building2}
                        gradient="info"
                    />
                    <StatCard
                        label="Jumlah Semua Caruman"
                        value={formatBND(yearlyTotals.tapEmployee + yearlyTotals.tapEmployer + yearlyTotals.scpEmployee + yearlyTotals.scpEmployer)}
                        icon={TrendingUp}
                        gradient="peach"
                    />
                    <StatCard
                        label="Rekod Gaji"
                        value={yearlyTotals.totalStaff}
                        change={`TAP: ${yearlyTotals.staffWithTap} | SCP: ${yearlyTotals.staffWithScp}`}
                        changeType="neutral"
                        icon={Users}
                    />
                </div>

                {/* Rate Info */}
                <div className="card mb-lg" style={{ padding: '1rem', background: 'var(--gray-50)' }}>
                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>KADAR CARUMAN</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                            <h5 style={{ margin: '0 0 0.5rem', color: 'var(--primary)' }}>TAP - Tabung Amanah Pekerja</h5>
                            <div style={{ fontSize: '0.875rem' }}>
                                <div>Pekerja: <strong>{TAP_EMPLOYEE_RATE}%</strong></div>
                                <div>Majikan: <strong>{TAP_EMPLOYER_RATE}%</strong></div>
                            </div>
                        </div>
                        <div style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                            <h5 style={{ margin: '0 0 0.5rem', color: 'var(--info)' }}>SCP - Skim Caruman Tambahan</h5>
                            <div style={{ fontSize: '0.875rem' }}>
                                <div>Pekerja: <strong>{SCP_EMPLOYEE_RATE}%</strong></div>
                                <div>Majikan: <strong>{SCP_EMPLOYER_RATE}%</strong></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Breakdown Table */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Pecahan Bulanan - {selectedYear}</div>
                    </div>

                    {monthlyBreakdown.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Tiada rekod untuk tahun ini</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Bulan</th>
                                        <th style={{ textAlign: 'right' }}>TAP (Pekerja)</th>
                                        <th style={{ textAlign: 'right' }}>TAP (Majikan)</th>
                                        <th style={{ textAlign: 'right' }}>SCP (Pekerja)</th>
                                        <th style={{ textAlign: 'right' }}>SCP (Majikan)</th>
                                        <th style={{ textAlign: 'right' }}>Jumlah</th>
                                        <th style={{ textAlign: 'center' }}>Staf</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyBreakdown.map((row) => {
                                        const total = row.tapEmployee + row.tapEmployer + row.scpEmployee + row.scpEmployer;
                                        return (
                                            <tr key={row.month}>
                                                <td style={{ fontWeight: 500 }}>{getMonthLabel(row.month)}</td>
                                                <td style={{ textAlign: 'right' }}>{row.tapEmployee.toFixed(2)}</td>
                                                <td style={{ textAlign: 'right' }}>{row.tapEmployer.toFixed(2)}</td>
                                                <td style={{ textAlign: 'right' }}>{row.scpEmployee.toFixed(2)}</td>
                                                <td style={{ textAlign: 'right' }}>{row.scpEmployer.toFixed(2)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{total.toFixed(2)}</td>
                                                <td style={{ textAlign: 'center' }}>{row.staffCount}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: 'var(--gray-100)', fontWeight: 600 }}>
                                        <td>JUMLAH TAHUNAN</td>
                                        <td style={{ textAlign: 'right' }}>{yearlyTotals.tapEmployee.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{yearlyTotals.tapEmployer.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{yearlyTotals.scpEmployee.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{yearlyTotals.scpEmployer.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', color: 'var(--primary)' }}>
                                            BND {(yearlyTotals.tapEmployee + yearlyTotals.tapEmployer + yearlyTotals.scpEmployee + yearlyTotals.scpEmployer).toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{yearlyTotals.totalStaff}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
