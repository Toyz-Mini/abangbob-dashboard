'use client';

import React, { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useOrders } from '@/lib/store';
import {
    DailySalesData,
    generateDailyReport,
    generateReportSummary,
    downloadCSV,
    filterOrdersByDate
} from '@/lib/report-helpers';
import {
    Calendar,
    Download,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    CreditCard,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { id } from 'date-fns/locale';

export default function SalesReportPage() {
    const { orders } = useOrders();
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });
    const [viewMode, setViewMode] = useState<'month' | 'custom'>('month');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Handle month navigation
    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = direction === 'prev'
            ? subMonths(currentMonth, 1)
            : addMonths(currentMonth, 1);
        setCurrentMonth(newDate);
        setDateRange({
            start: startOfMonth(newDate),
            end: endOfMonth(newDate)
        });
    };

    // Process data
    const filteredOrders = useMemo(() =>
        filterOrdersByDate(orders, dateRange.start, dateRange.end),
        [orders, dateRange]);

    const summary = useMemo(() =>
        generateReportSummary(filteredOrders, dateRange.start, dateRange.end),
        [filteredOrders, dateRange]);

    const dailyData = useMemo(() =>
        generateDailyReport(filteredOrders, dateRange.start, dateRange.end),
        [filteredOrders, dateRange]);

    // Export handler
    const handleExport = () => {
        const filename = `Sales_Report_${format(dateRange.start, 'yyyy-MM-dd')}_to_${format(dateRange.end, 'yyyy-MM-dd')}.csv`;
        downloadCSV(dailyData, filename);
    };

    return (
        <MainLayout>
            <div className="p-6 max-w-7xl mx-auto">

                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <TrendingUp className="text-primary" />
                            Laporan Jualan
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Analisis prestasi jualan harian dan bulanan
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
                        {/* Month Navigator */}
                        <div className="flex items-center gap-2 mr-4">
                            <button onClick={() => navigateMonth('prev')} className="p-1 hover:bg-gray-100 rounded">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="font-semibold min-w-[100px] text-center">
                                {format(currentMonth, 'MMMM yyyy')}
                            </span>
                            <button
                                onClick={() => navigateMonth('next')}
                                className="p-1 hover:bg-gray-100 rounded"
                                disabled={addMonths(currentMonth, 1) > new Date()}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="h-6 w-px bg-gray-300 mx-2"></div>

                        <button
                            onClick={handleExport}
                            className="btn btn-primary flex items-center gap-2 text-sm"
                            disabled={dailyData.length === 0}
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <SummaryCard
                        title="Total Jualan Kasar"
                        value={`BND ${summary.totalGross.toFixed(2)}`}
                        icon={TrendingUp}
                        color="bg-blue-50 text-blue-600"
                    />
                    <SummaryCard
                        title="Jualan Bersih (Net)"
                        value={`BND ${summary.totalNet.toFixed(2)}`}
                        subtitle={`Selepas redemption`}
                        icon={DollarSign}
                        color="bg-green-50 text-green-600"
                        highlight
                    />
                    <SummaryCard
                        title="Total Transaksi"
                        value={summary.totalOrders.toString()}
                        icon={ShoppingCart}
                        color="bg-purple-50 text-purple-600"
                    />
                    <SummaryCard
                        title="Purata Nilai Order (AOV)"
                        value={`BND ${summary.averageOrderValue.toFixed(2)}`}
                        icon={CreditCard}
                        color="bg-orange-50 text-orange-600"
                    />
                </div>

                {/* Daily Breakdown Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold">Perincian Harian</h3>
                        <span className="text-sm text-gray-500">
                            {filteredOrders.length} Pesanan dijumpai
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Tarikh</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Pesanan</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Gross Sales</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Redemption</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Net Sales</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {dailyData.length > 0 ? (
                                    dailyData.map((day) => (
                                        <tr key={day.date} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {format(new Date(day.date), 'dd MMM yyyy')}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600">
                                                {day.orderCount}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600">
                                                ${day.grossTotal.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-red-500">
                                                {day.redemptionTotal > 0 ? `-$${day.redemptionTotal.toFixed(2)}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                ${day.netTotal.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                            Tiada data jualan untuk tempoh ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {dailyData.length > 0 && (
                                <tfoot className="bg-gray-50 font-semibold border-t">
                                    <tr>
                                        <td className="px-4 py-3">Summary</td>
                                        <td className="px-4 py-3 text-right">{summary.totalOrders}</td>
                                        <td className="px-4 py-3 text-right">${summary.totalGross.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-red-500">-${summary.totalRedemptions.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-green-700">${summary.totalNet.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}

function SummaryCard({ title, value, subtitle, icon: Icon, color, highlight }: any) {
    return (
        <div className={`bg-white p-4 rounded-xl border shadow-sm ${highlight ? 'ring-2 ring-primary ring-opacity-10' : ''}`}>
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon size={20} />
                </div>
                <span className="text-gray-500 text-sm font-medium">{title}</span>
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
            </div>
        </div>
    );
}
