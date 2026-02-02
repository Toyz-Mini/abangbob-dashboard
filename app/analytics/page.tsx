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
import GlassCard from '@/components/GlassCard';
import TimeHeatmap from '@/components/charts/TimeHeatmap';
import PerformanceMatrix from '@/components/charts/PerformanceMatrix';
import StaffProductivityChart from '@/components/charts/StaffProductivityChart';
import ProfitMarginChart from '@/components/charts/ProfitMarginChart';
import { BentoGrid, BentoCard } from '@/components/BentoGrid';
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
  Table,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';

type AnalyticsTab = 'overview' | 'sales' | 'menu' | 'staff' | 'profit' | 'customer';

import { startOfMonth, subDays, format } from 'date-fns';
import { DateRangePicker, type DateRange } from '@/components/DateRangePicker';

export default function AnalyticsPage() {
  const { orders, productionLogs, inventory, staff, attendance, deliveryOrders, menuItems, wasteLogs, isInitialized } = useStore();
  const { showToast } = useToast();
  // Default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isExporting, setIsExporting] = useState(false);

  const { from: rangeStart, to: rangeEnd } = dateRange;
  const [comparisonMode, setComparisonMode] = useState(false);

  // Calculate previous period (same duration before rangeStart)
  const previousPeriod = useMemo(() => {
    const duration = rangeEnd.getTime() - rangeStart.getTime();
    return {
      from: new Date(rangeStart.getTime() - duration),
      to: new Date(rangeStart.getTime() - 1)
    };
  }, [rangeStart, rangeEnd]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= rangeStart && orderDate <= rangeEnd;
    });
  }, [orders, rangeStart, rangeEnd]);

  // Filter orders for previous period (for comparison)
  const previousOrders = useMemo(() => {
    if (!comparisonMode) return [];
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= previousPeriod.from && orderDate <= previousPeriod.to;
    });
  }, [orders, previousPeriod, comparisonMode]);

  // Sales Analytics
  const salesAnalytics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return { totalRevenue, totalOrders, avgOrderValue, completionRate };
  }, [filteredOrders]);

  // Previous period analytics (for comparison)
  const previousAnalytics = useMemo(() => {
    if (!comparisonMode) return null;
    const totalRevenue = previousOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = previousOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = previousOrders.filter(o => o.status === 'completed').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return { totalRevenue, totalOrders, avgOrderValue, completionRate };
  }, [previousOrders, comparisonMode]);

  // Calculate change percentage
  const getChangePercent = (current: number, previous: number | undefined) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

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
    if (!rangeStart || !rangeEnd) return { revenueChange: 0, orderChange: 0 };

    // Calculate duration in days
    const duration = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));

    const prevEnd = subDays(rangeStart, 1);
    const prevStart = subDays(prevEnd, duration);

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
  }, [orders, rangeStart, rangeEnd, salesAnalytics]);

  // Waste analytics (Production + Inventory)
  const wasteAnalytics = useMemo(() => {
    // Production Waste (Kitchen)
    const activeProductionLogs = productionLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= rangeStart && logDate <= rangeEnd && log.wasteAmount > 0;
    });
    const productionWasteQty = activeProductionLogs.reduce((sum, log) => sum + log.wasteAmount, 0);

    // Inventory Waste (Stock - Financial Value)
    const activeWasteLogs = wasteLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate >= rangeStart && logDate <= rangeEnd;
    });
    const totalWasteValue = activeWasteLogs.reduce((sum, log) => sum + (log.totalLoss || 0), 0);
    const totalWasteItems = activeWasteLogs.length;

    return { productionWasteQty, totalWasteValue, totalWasteItems };
  }, [productionLogs, wasteLogs, rangeStart, rangeEnd]);

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
        filename = `sales_analytics_${format(rangeStart, 'yyyy-MM-dd')}_to_${format(rangeEnd, 'yyyy-MM-dd')}`;
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
        filename = `menu_performance_${format(rangeStart, 'yyyy-MM-dd')}_to_${format(rangeEnd, 'yyyy-MM-dd')}`;
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
        filename = `staff_productivity_${format(rangeStart, 'yyyy-MM-dd')}_to_${format(rangeEnd, 'yyyy-MM-dd')}`;
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
        filename = `profit_margin_${format(rangeStart, 'yyyy-MM-dd')}_to_${format(rangeEnd, 'yyyy-MM-dd')}`;
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
  }, [activeTab, dailySalesTrend, menuPerformance, staffProductivity, profitData, rangeStart, rangeEnd, showToast]);

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
          `${format(rangeStart, 'dd MMM')} - ${format(rangeEnd, 'dd MMM yyyy')}`
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
  }, [activeTab, filteredOrders, inventory, rangeStart, rangeEnd, showToast]);

  if (!isInitialized) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'sales' as const, label: 'Sales', icon: TrendingUp },
    { id: 'menu' as const, label: 'Menu Matrix', icon: Grid3X3 },
    { id: 'staff' as const, label: 'Productivity', icon: Users },
    { id: 'profit' as const, label: 'Profit & Margin', icon: LineChart },
    { id: 'customer' as const, label: 'Customers', icon: Activity },
  ];

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6 max-w-[1600px] mx-auto p-4">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Analytics Intelligence
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Real-time insights and decision support system
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Export Actions */}
            <div className="flex bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-1">
              <button
                onClick={handleExportCSV}
                className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors"
                disabled={isExporting}
              >
                <Download size={14} />
                CSV
              </button>
              <div className="w-[1px] bg-gray-200 dark:bg-white/10 mx-1"></div>
              <button
                onClick={handleExportPDF}
                className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors"
                disabled={isExporting}
              >
                <FileText size={14} />
                PDF
              </button>
            </div>

            {/* Comparison Toggle */}
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 border transition-all ${comparisonMode
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-white dark:bg-white/5 text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
            >
              <TrendingUp size={14} />
              {comparisonMode ? 'Compare ON' : 'Compare'}
            </button>

            {/* Date Range */}
            <div className="w-full sm:w-auto">
              <DateRangePicker
                date={dateRange}
                onSelect={setDateRange}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                  ${isActive
                    ? 'bg-gray-900 text-white shadow-lg dark:bg-white dark:text-black scale-[1.02]'
                    : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900'
                  }
                `}
              >
                <Icon size={16} strokeWidth={2.5} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Revenue"
            value={`BND ${salesAnalytics.totalRevenue.toFixed(2)}`}
            change={`${previousPeriodComparison.revenueChange >= 0 ? '+' : ''}${previousPeriodComparison.revenueChange.toFixed(1)}%`}
            changeType={previousPeriodComparison.revenueChange >= 0 ? "positive" : "negative"}
            icon={DollarSign}
            gradient="sunset"
          />
          <StatCard
            label="Total Orders"
            value={salesAnalytics.totalOrders}
            change={`${previousPeriodComparison.orderChange >= 0 ? '+' : ''}${previousPeriodComparison.orderChange.toFixed(1)}%`}
            changeType={previousPeriodComparison.orderChange >= 0 ? "positive" : "negative"}
            icon={ShoppingBag}
            gradient="primary"
          />
          <StatCard
            label="Avg. Order Value"
            value={`BND ${salesAnalytics.avgOrderValue.toFixed(2)}`}
            change="per transaction"
            changeType="neutral"
            icon={BarChart3}
          />
          <StatCard
            label="Order Completion"
            value={`${salesAnalytics.completionRate.toFixed(1)}%`}
            change={salesAnalytics.completionRate >= 90 ? "Excellent" : salesAnalytics.completionRate >= 70 ? "Good" : "Needs work"}
            changeType={salesAnalytics.completionRate >= 90 ? "positive" : salesAnalytics.completionRate >= 70 ? "neutral" : "negative"}
            icon={Star}
            gradient="warning"
          />
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <BentoGrid className="gap-6 !max-w-none">
            {/* Heatmap Section */}
            <BentoCard
              colSpan={2}
              title="Busy Time Heatmap"
              description="Peak order times by day and hour"
              icon={<Flame size={20} className="text-orange-500" />}
            >
              <div className="mt-4 overflow-x-auto pb-2">
                <div className="min-w-[600px]">
                  <TimeHeatmap data={heatmapData} />
                </div>
              </div>
            </BentoCard>

            {/* Operational Summary */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6 md:col-span-1 border border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity size={20} className="text-primary" />
                  Health Check
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{inventory.length}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Total Items</div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                  <div className="text-2xl font-bold text-amber-600">{inventoryAnalytics.lowStock}</div>
                  <div className="text-[10px] uppercase font-bold text-amber-800/60 dark:text-amber-400">Low Stock</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                  <div className="text-2xl font-bold text-red-600">${wasteAnalytics.totalWasteValue.toFixed(0)}</div>
                  <div className="text-[10px] uppercase font-bold text-red-800/60 dark:text-red-400">Waste Value</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-600">{staff.filter(s => s.status === 'active').length}</div>
                  <div className="text-[10px] uppercase font-bold text-green-800/60 dark:text-green-400">Active Staff</div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                <div className="flex justify-between items-end">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-widest">Inventory Value</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">BND {inventoryAnalytics.totalValue.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Daily Sales Chart */}
            <BentoCard
              colSpan={3}
              title="Daily Sales Performance"
              icon={<TrendingUp size={20} className="text-green-500" />}
            >
              <div className="mt-4 w-full overflow-x-auto pb-4 custom-scrollbar">
                <div className="h-[240px] flex items-end gap-3 min-w-[800px] px-2">
                  {dailySalesTrend.length > 0 ? (
                    dailySalesTrend.slice(-30).map((day, i) => {
                      const maxRevenue = Math.max(...dailySalesTrend.map(d => d.revenue));
                      const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                      return (
                        <div
                          key={`${day.date}-${i}`}
                          className="flex-1 flex flex-col items-center group cursor-pointer relative"
                        >
                          {/* Tooltip */}
                          <div className="mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                            ${day.revenue.toFixed(0)} | {day.orders} ord
                          </div>

                          <div className="w-full relative h-[200px] flex items-end">
                            <div
                              style={{ height: `${Math.max(height, 2)}%` }}
                              className={`w-full rounded-t-lg transition-all duration-300 ${day.revenue === maxRevenue
                                ? 'bg-gradient-to-t from-primary to-orange-400'
                                : 'bg-primary/20 hover:bg-primary/60'
                                }`}
                            />
                          </div>
                          <div className="mt-2 text-[10px] font-bold text-gray-400 rotate-0 truncate w-full text-center">
                            {format(new Date(day.date), 'dd MMM')}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No sales data found for this period
                    </div>
                  )}
                </div>
              </div>
            </BentoCard>
          </BentoGrid>
        )}

        {/* Other Tabs Placeholder Logic (Preserved but styled) */}
        {activeTab === 'sales' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BentoCard title="Sales Heatmap" className="min-h-[400px]"><TimeHeatmap data={heatmapData} /></BentoCard>
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Top 10 Best Sellers</h3>
              {menuPerformance.slice(0, 10).map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex items-center gap-4 bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx < 3 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.quantity} units sold</div>
                  </div>
                  <div className="font-mono font-bold text-gray-900 dark:text-white">${item.revenue.toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keeping other tabs wrapped in simple containers for now to avoid huge file bloat, 
            but layout is safely constrained by max-w container */}
        {activeTab === 'menu' && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Grid3X3 size={20} className="text-primary" />
              Menu Performance Matrix
            </h2>
            <PerformanceMatrix items={menuPerformance} maxItems={15} />
          </GlassCard>
        )}

        {activeTab === 'staff' && (
          <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users size={20} className="text-primary" />
                Staff Productivity
              </h2>
              <input type="month" className="px-3 py-1.5 rounded-lg border bg-transparent" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            </div>
            <StaffProductivityChart data={staffProductivity} period={selectedMonth} />
          </GlassCard>
        )}

        {activeTab === 'profit' && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <LineChart size={20} className="text-success" />
              Profit & Margin Trend
            </h2>
            <ProfitMarginChart data={profitData} />
          </GlassCard>
        )}

        {activeTab === 'customer' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <GlassCard className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">
                  {new Set(filteredOrders.map(o => o.customerPhone).filter(Boolean)).size}
                </div>
                <div className="text-xs text-gray-500 uppercase font-bold mt-1">Total Customers</div>
              </GlassCard>
              {/* Simplified metrics for customer tab */}
            </div>

            <GlassCard className="p-6 overflow-hidden">
              <h3 className="font-bold text-lg mb-4">Top Customers</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-white/5 text-gray-500">
                    <tr>
                      <th className="p-3 text-left">Rank</th>
                      <th className="p-3 text-left">Customer</th>
                      <th className="p-3 text-center">Orders</th>
                      <th className="p-3 text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Condensed logic for table rendering */}
                    {Object.values(filteredOrders.reduce((acc: any, o) => {
                      const p = o.customerPhone || 'Walk-in';
                      if (!acc[p]) acc[p] = { name: o.customerName || p, orders: 0, total: 0 };
                      acc[p].orders++;
                      acc[p].total += o.total;
                      return acc;
                    }, {})).sort((a: any, b: any) => b.total - a.total).slice(0, 10).map((c: any, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="p-3 font-bold text-primary">#{idx + 1}</td>
                        <td className="p-3 font-medium">{c.name}</td>
                        <td className="p-3 text-center">{c.orders}</td>
                        <td className="p-3 text-right font-mono">${c.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
