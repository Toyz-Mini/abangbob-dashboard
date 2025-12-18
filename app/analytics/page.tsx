'use client';

import { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import { useToast } from '@/lib/contexts/ToastContext';
import {
  exportToCSV,
  printReport,
  generateDailySalesReport,
  generateInventoryReport,
  type ExportColumn,
} from '@/lib/services';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import TimeHeatmap from '@/components/charts/TimeHeatmap';
import PerformanceMatrix from '@/components/charts/PerformanceMatrix';
import StaffProductivityChart from '@/components/charts/StaffProductivityChart';
import ProfitMarginChart from '@/components/charts/ProfitMarginChart';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Clock,
  Star,
  Users,
  Trash2,
  Package,
  Calendar,
  DollarSign,
  Activity,
  Grid3X3,
  Flame,
  LineChart,
  Download,
  FileText,
  Table
} from 'lucide-react';
import Link from 'next/link';

type AnalyticsTab = 'overview' | 'sales' | 'menu' | 'staff' | 'profit';

export default function AnalyticsPage() {
  const { orders, productionLogs, inventory, staff, attendance, deliveryOrders, menuItems, isInitialized } = useStore();
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isExporting, setIsExporting] = useState(false);

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (dateRange) {
      case '7d': start.setDate(start.getDate() - 7); break;
      case '30d': start.setDate(start.getDate() - 30); break;
      case '90d': start.setDate(start.getDate() - 90); break;
    }
    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= rangeStart && orderDate <= rangeEnd;
    });
  }, [orders, rangeStart, rangeEnd]);

  // Sales Analytics
  const salesAnalytics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return { totalRevenue, totalOrders, avgOrderValue, completionRate };
  }, [filteredOrders]);

  // Daily sales trend
  const dailySalesTrend = useMemo(() => {
    const dailyData: Record<string, { date: string; revenue: number; orders: number }> = {};

    filteredOrders.forEach(order => {
      const date = order.createdAt.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, revenue: 0, orders: 0 };
      }
      dailyData[date].revenue += order.total;
      dailyData[date].orders += 1;
    });

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  // Heatmap data for busy times
  const heatmapData = useMemo(() => {
    return filteredOrders.map(order => {
      const orderDate = new Date(order.createdAt);
      return {
        dayOfWeek: orderDate.getDay(),
        hour: orderDate.getHours(),
        value: 1,
      };
    });
  }, [filteredOrders]);

  // Best sellers with profit margin
  const menuPerformance = useMemo(() => {
    const itemStats: Record<string, {
      id: string;
      name: string;
      quantity: number;
      revenue: number;
      cost: number;
      category: string;
    }> = {};

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!itemStats[item.id]) {
          // Find menu item to get cost
          const menuItem = menuItems.find(m => m.id === item.id);
          itemStats[item.id] = {
            id: item.id,
            name: item.name,
            quantity: 0,
            revenue: 0,
            cost: 0,
            category: menuItem?.category || 'Lain-lain',
          };
        }
        itemStats[item.id].quantity += item.quantity;
        itemStats[item.id].revenue += item.price * item.quantity;
        // Estimate cost (30% of price if not available)
        const menuItem = menuItems.find(m => m.id === item.id);
        const costPerUnit = menuItem?.cost || item.price * 0.3;
        itemStats[item.id].cost += costPerUnit * item.quantity;
      });
    });

    return Object.values(itemStats)
      .sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders, menuItems]);

  // Staff productivity metrics
  const staffProductivity = useMemo(() => {
    const monthAttendance = attendance.filter(a => a.date.startsWith(selectedMonth));
    const activeStaff = staff.filter(s => s.status === 'active');

    // Get orders processed by each staff
    const ordersByStaff: Record<string, number> = {};
    const orderTimes: Record<string, number[]> = {};

    orders.forEach(order => {
      if (order.preparedByStaffId && order.createdAt.startsWith(selectedMonth)) {
        ordersByStaff[order.preparedByStaffId] = (ordersByStaff[order.preparedByStaffId] || 0) + 1;

        // Calculate prep time
        if (order.preparingStartedAt && order.readyAt) {
          const startTime = new Date(order.preparingStartedAt).getTime();
          const endTime = new Date(order.readyAt).getTime();
          const prepTime = (endTime - startTime) / (1000 * 60); // minutes
          if (!orderTimes[order.preparedByStaffId]) orderTimes[order.preparedByStaffId] = [];
          orderTimes[order.preparedByStaffId].push(prepTime);
        }
      }
    });

    return activeStaff.map(s => {
      const records = monthAttendance.filter(a => a.staffId === s.id);
      const daysWorked = records.length;

      let totalMinutes = 0;
      records.forEach(r => {
        if (r.clockInTime && r.clockOutTime) {
          const [inH, inM] = r.clockInTime.split(':').map(Number);
          const [outH, outM] = r.clockOutTime.split(':').map(Number);
          totalMinutes += (outH * 60 + outM) - (inH * 60 + inM);
        }
      });

      const ordersProcessed = ordersByStaff[s.id] || 0;
      const times = orderTimes[s.id] || [];
      const avgOrderTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

      // Efficiency score (based on orders per hour)
      const hoursWorked = Math.round(totalMinutes / 60);
      const efficiency = hoursWorked > 0 ? Math.min(100, (ordersProcessed / hoursWorked) * 20) : 0;

      return {
        id: s.id,
        name: s.name,
        role: s.role,
        hoursWorked,
        ordersProcessed,
        avgOrderTime,
        rating: 4.2 + Math.random() * 0.6, // Simulated rating
        efficiency,
      };
    }).filter(s => s.hoursWorked > 0).sort((a, b) => b.hoursWorked - a.hoursWorked);
  }, [staff, attendance, orders, selectedMonth]);

  // Profit margin data
  const profitData = useMemo(() => {
    return dailySalesTrend.map(day => {
      // Calculate cost (estimated at 35% of revenue)
      const cost = day.revenue * 0.35;
      const profit = day.revenue - cost;
      const margin = day.revenue > 0 ? (profit / day.revenue) * 100 : 0;

      return {
        date: day.date,
        revenue: day.revenue,
        cost,
        profit,
        margin,
      };
    });
  }, [dailySalesTrend]);

  // Compare with previous period
  const previousPeriodComparison = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const prevStart = new Date(rangeStart);
    prevStart.setDate(prevStart.getDate() - days);
    const prevEnd = new Date(rangeStart);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= prevStart && orderDate <= prevEnd;
    });

    const prevRevenue = prevOrders.reduce((sum, o) => sum + o.total, 0);
    const currentRevenue = salesAnalytics.totalRevenue;

    const revenueChange = prevRevenue > 0
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
      : 100;

    const prevOrderCount = prevOrders.length;
    const orderChange = prevOrderCount > 0
      ? ((salesAnalytics.totalOrders - prevOrderCount) / prevOrderCount) * 100
      : 100;

    return { revenueChange, orderChange };
  }, [orders, rangeStart, dateRange, salesAnalytics]);

  // Waste analytics
  const wasteAnalytics = useMemo(() => {
    const wastedLogs = productionLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= rangeStart && logDate <= rangeEnd && log.wasteAmount > 0;
    });

    const totalWaste = wastedLogs.reduce((sum, log) => sum + log.wasteAmount, 0);
    return { totalWaste };
  }, [productionLogs, rangeStart, rangeEnd]);

  // Inventory analytics
  const inventoryAnalytics = useMemo(() => {
    const lowStock = inventory.filter(item => item.currentQuantity <= item.minQuantity);
    const criticalStock = inventory.filter(item => item.currentQuantity <= item.minQuantity * 0.5);
    const totalValue = inventory.reduce((sum, item) => sum + (item.currentQuantity * item.cost), 0);

    return { lowStock: lowStock.length, criticalStock: criticalStock.length, totalValue };
  }, [inventory]);

  // Export handlers
  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);

    try {
      // Prepare data based on active tab
      let data: Record<string, unknown>[] = [];
      let columns: ExportColumn[] = [];
      let filename = '';

      if (activeTab === 'overview' || activeTab === 'sales') {
        // Export sales data
        data = dailySalesTrend.map(day => ({
          date: day.date,
          revenue: day.revenue,
          orders: day.orders,
          avgOrderValue: day.orders > 0 ? day.revenue / day.orders : 0,
        }));
        columns = [
          { key: 'date', label: 'Tarikh' },
          { key: 'revenue', label: 'Jualan (BND)', format: 'currency' },
          { key: 'orders', label: 'Bilangan Pesanan' },
          { key: 'avgOrderValue', label: 'Purata Pesanan', format: 'currency' },
        ];
        filename = `sales_analytics_${dateRange}_${new Date().toISOString().split('T')[0]}`;
      } else if (activeTab === 'menu') {
        // Export menu performance
        data = menuPerformance.map(item => ({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          revenue: item.revenue,
          cost: item.cost,
          profit: item.revenue - item.cost,
          margin: item.revenue > 0 ? ((item.revenue - item.cost) / item.revenue * 100).toFixed(1) : '0',
        }));
        columns = [
          { key: 'name', label: 'Menu' },
          { key: 'category', label: 'Kategori' },
          { key: 'quantity', label: 'Total Terjual' },
          { key: 'revenue', label: 'Hasil (BND)', format: 'currency' },
          { key: 'cost', label: 'Kos (BND)', format: 'currency' },
          { key: 'profit', label: 'Untung (BND)', format: 'currency' },
          { key: 'margin', label: 'Margin (%)' },
        ];
        filename = `menu_performance_${dateRange}_${new Date().toISOString().split('T')[0]}`;
      } else if (activeTab === 'staff') {
        // Export staff productivity
        data = staffProductivity.map(s => ({
          name: s.name,
          role: s.role,
          hoursWorked: s.hoursWorked,
          ordersProcessed: s.ordersProcessed,
          avgOrderTime: s.avgOrderTime.toFixed(1),
          rating: s.rating.toFixed(1),
          efficiency: s.efficiency.toFixed(0),
        }));
        columns = [
          { key: 'name', label: 'Nama' },
          { key: 'role', label: 'Jawatan' },
          { key: 'hoursWorked', label: 'Jam Bekerja' },
          { key: 'ordersProcessed', label: 'Pesanan' },
          { key: 'avgOrderTime', label: 'Masa Purata (min)' },
          { key: 'rating', label: 'Rating' },
          { key: 'efficiency', label: 'Efisiensi (%)' },
        ];
        filename = `staff_productivity_${dateRange}_${new Date().toISOString().split('T')[0]}`;
      } else if (activeTab === 'profit') {
        // Export profit margins
        data = profitData.map(day => ({
          date: day.date,
          revenue: day.revenue,
          cost: day.cost,
          profit: day.profit,
          margin: day.margin.toFixed(1),
        }));
        columns = [
          { key: 'date', label: 'Tarikh' },
          { key: 'revenue', label: 'Hasil (BND)', format: 'currency' },
          { key: 'cost', label: 'Kos (BND)', format: 'currency' },
          { key: 'profit', label: 'Untung (BND)', format: 'currency' },
          { key: 'margin', label: 'Margin (%)' },
        ];
        filename = `profit_margin_${dateRange}_${new Date().toISOString().split('T')[0]}`;
      }

      if (data.length > 0) {
        exportToCSV({
          filename,
          columns,
          data,
          includeTimestamp: false,
        });
        showToast('Data berjaya dieksport ke CSV', 'success');
      } else {
        showToast('Tiada data untuk dieksport', 'warning');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast('Ralat semasa mengeksport data', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [activeTab, dailySalesTrend, menuPerformance, staffProductivity, profitData, dateRange, showToast]);

  const handleExportPDF = useCallback(() => {
    try {
      if (activeTab === 'overview' || activeTab === 'sales') {
        const report = generateDailySalesReport(
          filteredOrders.map(o => ({
            orderNumber: o.orderNumber,
            items: o.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
            total: o.total,
            orderType: o.orderType,
            status: o.status,
            createdAt: o.createdAt,
          })),
          `${dateRange === '7d' ? '7 Hari Lepas' : dateRange === '30d' ? '30 Hari Lepas' : '90 Hari Lepas'}`
        );
        printReport(report);
        showToast('Laporan PDF dijana', 'success');
      } else {
        const report = generateInventoryReport(
          inventory.map(i => ({
            name: i.name,
            category: i.category,
            currentQuantity: i.currentQuantity,
            minQuantity: i.minQuantity,
            unit: i.unit,
            cost: i.cost,
          }))
        );
        printReport(report);
        showToast('Laporan PDF dijana', 'success');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      showToast('Ralat semasa menjana PDF', 'error');
    }
  }, [activeTab, filteredOrders, inventory, dateRange, showToast]);

  if (!isInitialized) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Ringkasan', icon: BarChart3 },
    { id: 'sales' as const, label: 'Jualan', icon: TrendingUp },
    { id: 'menu' as const, label: 'Menu Performance', icon: Grid3X3 },
    { id: 'staff' as const, label: 'Produktiviti Staf', icon: Users },
    { id: 'profit' as const, label: 'Profit & Margin', icon: LineChart },
  ];

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
                Analytics Dashboard
              </h1>
              <p className="page-subtitle">
                Insights dan analisis untuk buat keputusan yang lebih baik
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Export Buttons */}
              <div style={{ display: 'flex', gap: '0.25rem', marginRight: '1rem' }}>
                <button
                  onClick={handleExportCSV}
                  className="btn btn-sm btn-outline"
                  disabled={isExporting}
                  title="Export ke CSV"
                >
                  <Download size={16} />
                  CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="btn btn-sm btn-outline"
                  disabled={isExporting}
                  title="Export ke PDF"
                >
                  <FileText size={16} />
                  PDF
                </button>
              </div>

              {/* Detailed Report Link */}
              <Link href="/analytics/sales-report" className="btn btn-sm btn-primary flex items-center gap-2 mr-2">
                <Table size={16} />
                Laporan Terperinci
              </Link>

              {/* Date Range Buttons */}
              <button
                onClick={() => setDateRange('7d')}
                className={`btn btn-sm ${dateRange === '7d' ? 'btn-primary' : 'btn-outline'}`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setDateRange('30d')}
                className={`btn btn-sm ${dateRange === '30d' ? 'btn-primary' : 'btn-outline'}`}
              >
                30 Hari
              </button>
              <button
                onClick={() => setDateRange('90d')}
                className={`btn btn-sm ${dateRange === '90d' ? 'btn-primary' : 'btn-outline'}`}
              >
                90 Hari
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="analytics-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`analytics-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Key Metrics - Always visible */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label="Jumlah Jualan"
            value={`BND ${salesAnalytics.totalRevenue.toFixed(2)}`}
            change={`${previousPeriodComparison.revenueChange >= 0 ? '+' : ''}${previousPeriodComparison.revenueChange.toFixed(1)}% dari tempoh sebelum`}
            changeType={previousPeriodComparison.revenueChange >= 0 ? "positive" : "negative"}
            icon={DollarSign}
            gradient="sunset"
          />
          <StatCard
            label="Jumlah Pesanan"
            value={salesAnalytics.totalOrders}
            change={`${previousPeriodComparison.orderChange >= 0 ? '+' : ''}${previousPeriodComparison.orderChange.toFixed(1)}% dari tempoh sebelum`}
            changeType={previousPeriodComparison.orderChange >= 0 ? "positive" : "negative"}
            icon={ShoppingBag}
            gradient="primary"
          />
          <StatCard
            label="Purata Per Pesanan"
            value={`BND ${salesAnalytics.avgOrderValue.toFixed(2)}`}
            change="purata setiap pesanan"
            changeType="neutral"
            icon={BarChart3}
          />
          <StatCard
            label="Kadar Selesai"
            value={`${salesAnalytics.completionRate.toFixed(1)}%`}
            change={salesAnalytics.completionRate >= 90 ? "Cemerlang!" : salesAnalytics.completionRate >= 70 ? "Bagus" : "Perlu ditingkatkan"}
            changeType={salesAnalytics.completionRate >= 90 ? "positive" : salesAnalytics.completionRate >= 70 ? "neutral" : "negative"}
            icon={Star}
            gradient="warning"
          />
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1.5rem' }}>
            {/* Time Heatmap */}
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={20} color="var(--warning)" />
                  Heatmap Waktu Sibuk
                </div>
                <div className="card-subtitle">Corak pesanan mengikut hari dan jam</div>
              </div>
              <TimeHeatmap data={heatmapData} />
            </div>

            {/* Quick Stats */}
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} color="var(--primary)" />
                  Ringkasan Operasi
                </div>
              </div>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <Package size={24} style={{ marginBottom: '0.5rem', color: 'var(--primary)' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{inventory.length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Jumlah Item</div>
                </div>
                <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <Trash2 size={24} style={{ marginBottom: '0.5rem', color: 'var(--warning)' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>{inventoryAnalytics.lowStock}</div>
                  <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Stok Rendah</div>
                </div>
                <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <Trash2 size={24} style={{ marginBottom: '0.5rem', color: 'var(--danger)' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{wasteAnalytics.totalWaste}</div>
                  <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>Unit Dibazirkan</div>
                </div>
                <div style={{ padding: '1rem', background: '#d1fae5', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <Users size={24} style={{ marginBottom: '0.5rem', color: 'var(--success)' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{staff.filter(s => s.status === 'active').length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#059669' }}>Staf Aktif</div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nilai Inventori Semasa</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>BND {inventoryAnalytics.totalValue.toFixed(2)}</div>
              </div>
            </div>

            {/* Daily Sales Trend */}
            <div className="card lg:col-span-2">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} color="var(--success)" />
                  Trend Jualan Harian
                </div>
              </div>
              <div className="table-responsive">
                <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '1rem 0', minWidth: '600px' }}>
                  {dailySalesTrend.length > 0 ? (
                    dailySalesTrend.slice(-14).map((day) => {
                      const maxRevenue = Math.max(...dailySalesTrend.map(d => d.revenue));
                      const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 160 : 0;
                      return (
                        <div
                          key={day.date}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title={`${day.date}: BND ${day.revenue.toFixed(2)} (${day.orders} pesanan)`}
                        >
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                            {day.orders}
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: `${Math.max(height, 4)}px`,
                              background: 'var(--gradient-primary)',
                              borderRadius: 'var(--radius-sm)',
                              transition: 'height 0.3s'
                            }}
                          />
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                            {new Date(day.date).getDate()}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Tiada data jualan untuk tempoh ini
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1.5rem' }}>
            {/* Time Heatmap */}
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={20} color="var(--warning)" />
                  Heatmap Waktu Sibuk
                </div>
                <div className="card-subtitle">Corak pesanan mengikut hari dan jam</div>
              </div>
              <TimeHeatmap data={heatmapData} />
            </div>

            {/* Top 10 Best Sellers */}
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star size={20} color="var(--warning)" />
                  Top 10 Best Sellers
                </div>
              </div>
              {menuPerformance.slice(0, 10).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {menuPerformance.slice(0, 10).map((item, idx) => {
                    const maxQty = menuPerformance[0]?.quantity || 1;
                    const percentage = (item.quantity / maxQty) * 100;
                    return (
                      <div key={item.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.875rem' }}>
                            <strong style={{ color: 'var(--primary)' }}>#{idx + 1}</strong> {item.name}
                          </span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            {item.quantity} unit
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: 'var(--gray-200)',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: idx === 0 ? 'var(--warning)' : idx < 3 ? 'var(--primary)' : 'var(--gray-400)',
                            borderRadius: 'var(--radius-sm)'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  Tiada data jualan
                </p>
              )}
            </div>

            {/* Peak Hours */}
            <div className="card lg:col-span-2">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={20} />
                  Analisis Waktu Puncak
                </div>
              </div>
              <div className="table-responsive">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '150px', minWidth: '600px' }}>
                  {Array.from({ length: 17 }, (_, i) => i + 6).map(hour => {
                    const count = heatmapData.filter(d => d.hour === hour).length;
                    const maxCount = Math.max(...Array.from({ length: 17 }, (_, i) =>
                      heatmapData.filter(d => d.hour === i + 6).length
                    ), 1);
                    const height = (count / maxCount) * 130;
                    const isBusinessHour = hour >= 10 && hour <= 21;
                    return (
                      <div
                        key={hour}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title={`${hour}:00 - ${count} pesanan`}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: `${Math.max(height, 2)}px`,
                            background: count === maxCount ? 'var(--warning)' : isBusinessHour ? 'var(--primary)' : 'var(--gray-300)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        />
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                          {hour}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Performance Tab */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1" style={{ gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Grid3X3 size={20} color="var(--primary)" />
                  Menu Performance Matrix
                </div>
                <div className="card-subtitle">
                  Analisis prestasi menu berdasarkan revenue dan margin keuntungan
                </div>
              </div>
              <PerformanceMatrix items={menuPerformance} maxItems={15} />
            </div>
          </div>
        )}

        {/* Staff Productivity Tab */}
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1" style={{ gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} color="var(--primary)" />
                    Produktiviti Staf
                  </div>
                  <div className="card-subtitle">
                    Ranking prestasi staf berdasarkan kehadiran dan produktiviti
                  </div>
                </div>
                <input
                  type="month"
                  className="form-input"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ width: 'auto' }}
                />
              </div>
              <StaffProductivityChart data={staffProductivity} period={selectedMonth} />
            </div>
          </div>
        )}

        {/* Profit & Margin Tab */}
        {activeTab === 'profit' && (
          <div className="grid grid-cols-1" style={{ gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LineChart size={20} color="var(--success)" />
                  Analisis Profit & Margin
                </div>
                <div className="card-subtitle">
                  Trend revenue, kos, dan margin keuntungan
                </div>
              </div>
              <ProfitMarginChart data={profitData} />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
