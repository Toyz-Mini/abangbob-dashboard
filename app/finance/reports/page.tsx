'use client';

import { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useFinance } from '@/lib/store';
import { useToast } from '@/lib/contexts/ToastContext';
import { getCategoryLabel, EXPENSE_CATEGORIES } from '@/lib/finance-data';
import { exportToCSV, type ExportColumn } from '@/lib/services';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Download,
    FileText,
    Calendar,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'pnl' | 'sales' | 'expenses';

interface PLLine {
    label: string;
    amount: number;
    isSubtotal?: boolean;
    isTotal?: boolean;
    indent?: number;
}

export default function ReportsPage() {
    const { expenses, orders, getMonthlyExpenses, getMonthlyRevenue, isInitialized } = useFinance();
    const { showToast } = useToast();

    const [reportType, setReportType] = useState<ReportType>('pnl');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isExporting, setIsExporting] = useState(false);

    // Get month label
    const getMonthLabel = (month: string) => {
        const [year, monthNum] = month.split('-');
        const monthNames = [
            'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
            'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
        ];
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    };

    // Calculate P&L data
    const plData = useMemo(() => {
        const monthlyExpenses = getMonthlyExpenses(selectedMonth);
        const monthlyRevenue = getMonthlyRevenue(selectedMonth);

        // Group expenses by category
        const expensesByCategory: Record<string, number> = {};
        monthlyExpenses.forEach(exp => {
            expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
        });

        // COGS categories
        const cogsCategories = ['ingredients', 'supplies'];
        const cogs = cogsCategories.reduce((sum, cat) => sum + (expensesByCategory[cat] || 0), 0);

        // Operating expenses (everything else)
        const operatingCategories = Object.keys(expensesByCategory).filter(cat => !cogsCategories.includes(cat));
        const operatingExpenses = operatingCategories.reduce((sum, cat) => sum + (expensesByCategory[cat] || 0), 0);

        const grossProfit = monthlyRevenue - cogs;
        const netProfit = grossProfit - operatingExpenses;

        return {
            revenue: monthlyRevenue,
            cogs,
            grossProfit,
            operatingExpenses,
            netProfit,
            expensesByCategory,
            cogsCategories,
            operatingCategories,
        };
    }, [selectedMonth, getMonthlyExpenses, getMonthlyRevenue]);

    // Build P&L lines for display
    const plLines = useMemo((): PLLine[] => {
        const lines: PLLine[] = [
            // Revenue
            { label: 'PENDAPATAN', amount: 0, isSubtotal: true },
            { label: 'Jualan POS', amount: plData.revenue, indent: 1 },
            { label: 'Jumlah Pendapatan', amount: plData.revenue, isSubtotal: true },

            // COGS
            { label: 'KOS BARANG DIJUAL (COGS)', amount: 0, isSubtotal: true },
        ];

        plData.cogsCategories.forEach(cat => {
            if (plData.expensesByCategory[cat]) {
                lines.push({
                    label: getCategoryLabel(cat as any),
                    amount: plData.expensesByCategory[cat],
                    indent: 1
                });
            }
        });

        lines.push({ label: 'Jumlah Kos Barang', amount: plData.cogs, isSubtotal: true });
        lines.push({ label: 'UNTUNG KASAR', amount: plData.grossProfit, isTotal: true });

        // Operating Expenses
        lines.push({ label: 'PERBELANJAAN OPERASI', amount: 0, isSubtotal: true });

        plData.operatingCategories.forEach(cat => {
            if (plData.expensesByCategory[cat]) {
                lines.push({
                    label: getCategoryLabel(cat as any),
                    amount: plData.expensesByCategory[cat],
                    indent: 1
                });
            }
        });

        lines.push({ label: 'Jumlah Perbelanjaan Operasi', amount: plData.operatingExpenses, isSubtotal: true });
        lines.push({ label: 'UNTUNG / RUGI BERSIH', amount: plData.netProfit, isTotal: true });

        return lines;
    }, [plData]);

    // Sales data for the month
    const salesData = useMemo(() => {
        const monthOrders = (orders || []).filter(o =>
            o.createdAt.startsWith(selectedMonth) && o.status === 'completed'
        );

        const byPaymentMethod: Record<string, { count: number; total: number }> = {};
        const byOrderType: Record<string, { count: number; total: number }> = {};

        monthOrders.forEach(order => {
            // By payment method
            const pm = order.paymentMethod || 'unknown';
            if (!byPaymentMethod[pm]) byPaymentMethod[pm] = { count: 0, total: 0 };
            byPaymentMethod[pm].count++;
            byPaymentMethod[pm].total += order.total;

            // By order type
            if (!byOrderType[order.orderType]) byOrderType[order.orderType] = { count: 0, total: 0 };
            byOrderType[order.orderType].count++;
            byOrderType[order.orderType].total += order.total;
        });

        return {
            totalOrders: monthOrders.length,
            totalRevenue: monthOrders.reduce((sum, o) => sum + o.total, 0),
            averageOrder: monthOrders.length > 0 ? monthOrders.reduce((sum, o) => sum + o.total, 0) / monthOrders.length : 0,
            byPaymentMethod,
            byOrderType,
        };
    }, [orders, selectedMonth]);

    // Export P&L to PDF
    const handleExportPDF = useCallback(async () => {
        setIsExporting(true);
        try {
            const doc = new jsPDF();

            // Title
            doc.setFontSize(16);
            doc.text('PENYATA UNTUNG RUGI', 105, 20, { align: 'center' });
            doc.setFontSize(12);
            doc.text(`AbangBob Enterprise`, 105, 28, { align: 'center' });
            doc.text(`${getMonthLabel(selectedMonth)}`, 105, 36, { align: 'center' });

            doc.setFontSize(8);
            doc.text(`Dijana: ${new Date().toLocaleDateString('ms-MY')}`, 14, 45);

            // P&L Table
            autoTable(doc, {
                startY: 50,
                head: [['Butiran', 'Jumlah (BND)']],
                body: plLines.map(line => [
                    (line.indent ? '    ' : '') + line.label,
                    line.isSubtotal && line.amount === 0 ? '' : line.amount.toFixed(2),
                ]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [185, 28, 28] },
                bodyStyles: { halign: 'left' },
                columnStyles: {
                    0: { cellWidth: 120 },
                    1: { cellWidth: 50, halign: 'right' },
                },
                didParseCell: function (data) {
                    const line = plLines[data.row.index];
                    if (line) {
                        if (line.isTotal) {
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.fillColor = [240, 240, 240];
                        }
                        if (line.isSubtotal && !line.isTotal) {
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                },
            });

            // Summary box
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFillColor(240, 240, 240);
            doc.rect(14, finalY, 180, 25, 'F');
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`UNTUNG BERSIH: BND ${plData.netProfit.toFixed(2)}`, 105, finalY + 15, { align: 'center' });

            doc.save(`pnl_${selectedMonth}.pdf`);
            showToast('Laporan P&L diexport ke PDF', 'success');
        } catch (error) {
            showToast('Gagal export PDF', 'error');
        } finally {
            setIsExporting(false);
        }
    }, [plLines, plData, selectedMonth, showToast]);

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
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChart3 size={28} />
                        <div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                                Laporan Kewangan
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
                                P&L, Jualan & Perbelanjaan
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="form-input"
                            style={{ width: 'auto' }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleExportPDF}
                            disabled={isExporting}
                        >
                            <FileText size={16} />
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* Report Type Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <button
                        className={`btn ${reportType === 'pnl' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setReportType('pnl')}
                    >
                        <BarChart3 size={16} />
                        Untung Rugi (P&L)
                    </button>
                    <button
                        className={`btn ${reportType === 'sales' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setReportType('sales')}
                    >
                        <TrendingUp size={16} />
                        Ringkasan Jualan
                    </button>
                    <button
                        className={`btn ${reportType === 'expenses' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setReportType('expenses')}
                    >
                        <TrendingDown size={16} />
                        Ringkasan Perbelanjaan
                    </button>
                </div>

                {/* Stats Summary */}
                <div className="content-grid cols-4 mb-lg">
                    <StatCard
                        label="Pendapatan"
                        value={`BND ${plData.revenue.toFixed(2)}`}
                        icon={TrendingUp}
                        gradient="peach"
                    />
                    <StatCard
                        label="Kos Barang (COGS)"
                        value={`BND ${plData.cogs.toFixed(2)}`}
                        icon={TrendingDown}
                    />
                    <StatCard
                        label="Untung Kasar"
                        value={`BND ${plData.grossProfit.toFixed(2)}`}
                        changeType={plData.grossProfit >= 0 ? 'positive' : 'negative'}
                        icon={DollarSign}
                        gradient="info"
                    />
                    <StatCard
                        label="Untung Bersih"
                        value={`BND ${plData.netProfit.toFixed(2)}`}
                        changeType={plData.netProfit >= 0 ? 'positive' : 'negative'}
                        icon={plData.netProfit >= 0 ? ArrowUpRight : ArrowDownRight}
                        gradient={plData.netProfit >= 0 ? 'primary' : undefined}
                    />
                </div>

                {/* P&L Report */}
                {reportType === 'pnl' && (
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Penyata Untung Rugi - {getMonthLabel(selectedMonth)}</div>
                        </div>
                        <div style={{ padding: '0' }}>
                            {plLines.map((line, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem 1rem',
                                        background: line.isTotal ? 'var(--primary)' : line.isSubtotal ? 'var(--gray-50)' : 'white',
                                        color: line.isTotal ? 'white' : 'inherit',
                                        fontWeight: line.isSubtotal || line.isTotal ? 600 : 400,
                                        paddingLeft: line.indent ? '2rem' : '1rem',
                                        borderBottom: '1px solid var(--gray-100)',
                                    }}
                                >
                                    <span>{line.label}</span>
                                    <span style={{ fontFamily: 'monospace' }}>
                                        {line.isSubtotal && line.amount === 0 ? '' : `BND ${line.amount.toFixed(2)}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sales Report */}
                {reportType === 'sales' && (
                    <div className="content-grid cols-2">
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">Jualan Mengikut Jenis Pembayaran</div>
                            </div>
                            <div style={{ padding: '1rem' }}>
                                {Object.entries(salesData.byPaymentMethod).length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Tiada data</p>
                                ) : (
                                    Object.entries(salesData.byPaymentMethod).map(([method, data]) => (
                                        <div key={method} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                                            <div>
                                                <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{method}</span>
                                                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({data.count} orders)</span>
                                            </div>
                                            <span style={{ fontWeight: 600 }}>BND {data.total.toFixed(2)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">Jualan Mengikut Jenis Pesanan</div>
                            </div>
                            <div style={{ padding: '1rem' }}>
                                {Object.entries(salesData.byOrderType).length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Tiada data</p>
                                ) : (
                                    Object.entries(salesData.byOrderType).map(([type, data]) => (
                                        <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                                            <div>
                                                <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{type}</span>
                                                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({data.count} orders)</span>
                                            </div>
                                            <span style={{ fontWeight: 600 }}>BND {data.total.toFixed(2)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Expenses Report */}
                {reportType === 'expenses' && (
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Perbelanjaan Mengikut Kategori - {getMonthLabel(selectedMonth)}</div>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            {Object.entries(plData.expensesByCategory).length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Tiada perbelanjaan untuk bulan ini</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {EXPENSE_CATEGORIES.map(cat => {
                                        const amount = plData.expensesByCategory[cat.value] || 0;
                                        if (amount === 0) return null;
                                        const total = Object.values(plData.expensesByCategory).reduce((s, v) => s + v, 0);
                                        const percentage = total > 0 ? (amount / total) * 100 : 0;

                                        return (
                                            <div key={cat.value} style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color }} />
                                                        <span style={{ fontWeight: 500 }}>{cat.label}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>BND {amount.toFixed(2)}</span>
                                                </div>
                                                <div style={{ height: 8, background: 'var(--gray-200)', borderRadius: 4, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${percentage}%`, background: cat.color, borderRadius: 4 }} />
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                    {percentage.toFixed(1)}% daripada jumlah perbelanjaan
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
