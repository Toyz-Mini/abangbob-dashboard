'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';

import OTCharts from '@/components/hr/OTCharts';
import OTClaimsTable from '@/components/hr/OTClaimsTable';
import {
    DollarSign,
    Clock,
    CheckCircle,
    AlertCircle,
    Calendar,
    Download,
} from 'lucide-react';


const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];



export default function OTReportPage() {
    const { otClaims, isInitialized } = useStore();
    const { user } = useAuth();

    // Default to current month/year
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    // Filter claims by selected month/year
    const filteredClaims = useMemo(() => {
        return otClaims.filter(claim => {
            const claimDate = new Date(claim.date);
            return claimDate.getMonth() === selectedMonth && claimDate.getFullYear() === selectedYear;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [otClaims, selectedMonth, selectedYear]);

    // Calculate Stats
    const stats = useMemo(() => {
        const totalCost = filteredClaims.reduce((sum, c) => sum + (c.status !== 'rejected' ? c.totalAmount : 0), 0);
        const totalHours = filteredClaims.reduce((sum, c) => sum + (c.status !== 'rejected' ? c.hoursWorked : 0), 0);
        const pendingCount = filteredClaims.filter(c => c.status === 'pending').length;

        const approvedOrPaid = filteredClaims.filter(c => ['approved', 'paid'].includes(c.status)).length;
        const totalDecided = filteredClaims.filter(c => c.status !== 'pending').length;
        const approvalRate = totalDecided > 0 ? (approvedOrPaid / totalDecided) * 100 : 0;

        return { totalCost, totalHours, pendingCount, approvalRate };
    }, [filteredClaims]);

    // Chart Data: Cost by Staff
    const staffCostData = useMemo(() => {
        const staffMap = new Map<string, number>();
        filteredClaims.forEach(c => {
            if (c.status === 'rejected') return;
            const current = staffMap.get(c.staffName) || 0;
            staffMap.set(c.staffName, current + c.totalAmount);
        });

        return Array.from(staffMap.entries())
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount); // Sort desc
    }, [filteredClaims]);

    // Chart Data: Status Distribution
    const statusData = useMemo(() => {
        const counts = { pending: 0, approved: 0, rejected: 0, paid: 0 };
        filteredClaims.forEach(c => {
            if (counts[c.status] !== undefined) counts[c.status]++;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredClaims]);

    const handleExportPDF = async () => {
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('Overtime Summary Report', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Period: ${MONTHS[selectedMonth]} ${selectedYear}`, 14, 28);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 33);

        // Stats Summary
        autoTable(doc, {
            startY: 40,
            head: [['Total Cost', 'Total Hours', 'Pending Claims', 'Approval Rate']],
            body: [[
                `$${stats.totalCost.toFixed(2)}`,
                `${stats.totalHours.toFixed(1)} hrs`,
                stats.pendingCount,
                `${stats.approvalRate.toFixed(1)}%`
            ]],
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 5 }
        });

        // Detailed Table
        autoTable(doc, {
            startY: 70,
            head: [['Date', 'Staff', 'Time', 'Hours', 'Rate', 'Total', 'Status']],
            body: filteredClaims.map(c => [
                new Date(c.date).toLocaleDateString(),
                c.staffName,
                `${c.startTime} - ${c.endTime}`,
                c.hoursWorked.toFixed(1),
                `$${c.hourlyRate.toFixed(2)} x ${c.multiplier}`,
                `$${c.totalAmount.toFixed(2)}`,
                c.status.toUpperCase()
            ]),
            headStyles: { fillColor: [66, 66, 66] },
        });

        doc.save(`OT_Report_${MONTHS[selectedMonth]}_${selectedYear}.pdf`);
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
                {/* Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Clock size={28} color="var(--primary)" />
                            Laporan Kerja Lebih Masa (OT)
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Ringkasan tuntutan OT dan kos bulanan
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Month/Year Filter */}
                        <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center', border: '1px solid var(--border)' }}>
                            <Calendar size={16} color="var(--text-secondary)" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 500, outline: 'none' }}
                            >
                                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 500, outline: 'none' }}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <button className="btn btn-outline" onClick={handleExportPDF}>
                            <Download size={18} />
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="content-grid cols-4" style={{ marginBottom: '2rem' }}>
                    <StatCard
                        label="Jumlah Kos OT"
                        value={`$${stats.totalCost.toFixed(2)}`}
                        icon={DollarSign}
                        gradient="primary"
                    />
                    <StatCard
                        label="Jumlah Jam"
                        value={`${stats.totalHours.toFixed(1)} jam`}
                        icon={Clock}
                        gradient="info"
                    />
                    <StatCard
                        label="Tuntutan Belum Selesai"
                        value={stats.pendingCount}
                        icon={AlertCircle}
                        gradient="warning"
                    />
                    <StatCard
                        label="Kadar Kelulusan"
                        value={`${stats.approvalRate.toFixed(0)}%`}
                        icon={CheckCircle}
                        gradient="success"
                    />
                </div>

                {/* Charts Area */}
                <OTCharts
                    staffCostData={staffCostData}
                    statusData={statusData}
                />

                {/* Detailed Table */}
                <OTClaimsTable
                    claims={filteredClaims}
                    monthName={MONTHS[selectedMonth]}
                    year={selectedYear}
                />

            </div >
        </MainLayout >
    );
}
