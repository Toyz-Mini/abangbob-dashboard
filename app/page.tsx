'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore, useInventory, useStaff, useOrders } from '@/lib/store';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import Link from 'next/link';
import StatCard from '@/components/StatCard';
import ChartCard from '@/components/ChartCard';
import SalesTrendChart from '@/components/charts/SalesTrendChart';
import InventoryLevelChart from '@/components/charts/InventoryLevelChart';
import StaffAttendanceChart from '@/components/charts/StaffAttendanceChart';
import { DashboardSkeleton } from '@/components/Skeleton';
import { DollarSign, ShoppingCart, AlertTriangle, Users, Clock, ChefHat, Package, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { isInitialized } = useStore();
  const { inventory } = useInventory();
  const { staff, getStaffAttendanceToday } = useStaff();
  const { getTodayOrders } = useOrders();
  const { t, language } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayOrders = getTodayOrders();
  const salesToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const ordersToday = todayOrders.length;
  const lowStockItems = inventory.filter(item => item.currentQuantity <= item.minQuantity);

  const activeStaff = staff.filter(s => s.status === 'active');
  const onDutyStaff = activeStaff.filter(s => {
    const record = getStaffAttendanceToday(s.id);
    return record?.clockInTime && !record?.clockOutTime;
  });

  const salesTrendData = [
    { date: language === 'en' ? 'Mon' : 'Isn', sales: 120 },
    { date: language === 'en' ? 'Tue' : 'Sel', sales: 145 },
    { date: language === 'en' ? 'Wed' : 'Rab', sales: 132 },
    { date: language === 'en' ? 'Thu' : 'Kha', sales: 168 },
    { date: language === 'en' ? 'Fri' : 'Jum', sales: 189 },
    { date: language === 'en' ? 'Sat' : 'Sab', sales: 210 },
    { date: language === 'en' ? 'Sun' : 'Aha', sales: ordersToday },
  ];

  const inventoryChartData = inventory.slice(0, 6).map(item => ({
    name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
    quantity: item.currentQuantity,
    min: item.minQuantity,
  }));

  const staffAttendanceData = [
    { name: t('hr.onDuty'), value: onDutyStaff.length },
    { name: t('hr.offDuty'), value: activeStaff.length - onDutyStaff.length },
  ];

  const pendingOrders = todayOrders.filter(o => o.status === 'pending').length;
  const preparingOrders = todayOrders.filter(o => o.status === 'preparing').length;
  const dateLocale = language === 'en' ? 'en-MY' : 'ms-MY';

  if (!isInitialized) {
    return (
      <MainLayout>
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const formattedDate = currentTime.toLocaleDateString(dateLocale, dateOptions);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto animate-fade-in">

        {/* Minimal Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">{formattedDate}</div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-sm text-gray-500">Business Status</div>
            <div className={`text-sm font-semibold flex items-center gap-2 ${onDutyStaff.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${onDutyStaff.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              {onDutyStaff.length > 0 ? 'Open for Business' : 'Closed'}
            </div>
          </div>
        </div>

        {/* Action Bar - Clean Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <ActionLink href="/pos" icon={ShoppingCart} label={t('dashboard.openPOS')} primary />
          <ActionLink href="/inventory" icon={Package} label={t('dashboard.checkInventory')} />
          <ActionLink href="/hr/timeclock" icon={Clock} label={t('dashboard.clockInOut')} />
          <ActionLink href="/production" icon={ChefHat} label={t('dashboard.production')} />
        </div>

        {/* Key Metrics - Minimal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MinimalStat
            label={t('dashboard.salesToday')}
            value={`BND ${salesToday.toFixed(2)}`}
            trend={ordersToday > 0 ? "+12%" : "0%"}
            isPositive={true}
          />
          <MinimalStat
            label={t('dashboard.ordersToday')}
            value={ordersToday.toString()}
            subValue={`${pendingOrders} pending`}
          />
          <MinimalStat
            label={t('dashboard.staffOnDuty')}
            value={`${onDutyStaff.length}/${activeStaff.length}`}
            subValue="Staff active"
          />
          <MinimalStat
            label={t('dashboard.lowStock')}
            value={lowStockItems.length.toString()}
            isWarning={lowStockItems.length > 0}
            subValue="Items alert"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Charts & Data */}
          <div className="lg:col-span-2 space-y-8">
            {/* Sales Chart */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-800">{t('dashboard.salesTrend')}</h3>
                <Link href="/analytics" className="text-sm text-primary hover:underline">View details</Link>
              </div>
              <div className="h-64">
                <SalesTrendChart data={salesTrendData} />
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-800">{t('dashboard.recentOrders')}</h3>
                <Link href="/pos" className="text-sm text-primary hover:underline">Manage all</Link>
              </div>
              {todayOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="pb-3 font-medium">Order #</th>
                        <th className="pb-3 font-medium">Items</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {todayOrders.slice(0, 5).map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 font-medium text-gray-900">{order.orderNumber}</td>
                          <td className="py-3 text-gray-600 truncate max-w-[200px]">
                            {order.items.map(i => i.name).join(', ')}
                          </td>
                          <td className="py-3">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="py-3 text-right font-medium">BND {order.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">No orders yet today</div>
              )}
            </div>
          </div>

          {/* Right Column: Alerts & Quick Info */}
          <div className="space-y-6">

            {/* Order Queue Card (Only if busy) */}
            {(pendingOrders > 0 || preparingOrders > 0) && (
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <ChefHat size={20} />
                  </div>
                  <h3 className="font-semibold text-blue-900">Kitchen Status</h3>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1 bg-white p-3 rounded-xl border border-blue-100 shadow-sm text-center">
                    <div className="text-xl font-bold text-blue-600">{pendingOrders}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Pending</div>
                  </div>
                  <div className="flex-1 bg-white p-3 rounded-xl border border-blue-100 shadow-sm text-center">
                    <div className="text-xl font-bold text-orange-500">{preparingOrders}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Preparing</div>
                  </div>
                </div>
                <Link href="/kds" className="block mt-4 text-center text-sm font-medium text-blue-600 hover:text-blue-800">
                  Go to Kitchen Display →
                </Link>
              </div>
            )}

            {/* Low Stock Alert */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className={lowStockItems.length > 0 ? "text-amber-500" : "text-gray-300"} />
                {t('dashboard.lowStock')}
              </h3>
              {lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {lowStockItems.slice(0, 4).map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-amber-50 rounded-lg border border-amber-100">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <span className="text-amber-700 font-bold">{item.currentQuantity} {item.unit}</span>
                    </div>
                  ))}
                  <Link href="/inventory" className="block text-center text-xs text-gray-500 mt-2 hover:text-gray-800">
                    View all low stock items
                  </Link>
                </div>
              ) : (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Stock levels look good
                </div>
              )}
            </div>

            {/* Staff Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Team Update</h3>
              <div className="h-40 relative">
                <StaffAttendanceChart data={staffAttendanceData} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Sub-components for cleaner code
function ActionLink({ href, icon: Icon, label, primary = false }: { href: string, icon: any, label: string, primary?: boolean }) {
  return (
    <Link href={href} className={`
      flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border
      ${primary
        ? 'bg-gray-900 text-white border-gray-900 shadow-lg hover:bg-gray-800 hover:scale-[1.02]'
        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }
    `}>
      <Icon size={24} className="mb-2" strokeWidth={1.5} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function MinimalStat({ label, value, subValue, trend, isPositive, isWarning }: any) {
  return (
    <div className={`p-6 bg-white rounded-2xl border ${isWarning ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100'} shadow-sm`}>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className={`text-2xl font-bold ${isWarning ? 'text-amber-600' : 'text-gray-900'}`}>{value}</div>
        {trend && (
          <div className={`text-xs font-medium px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend}
          </div>
        )}
      </div>
      {subValue && <div className="text-xs text-gray-400 mt-1">{subValue}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    preparing: 'bg-orange-100 text-orange-700',
    ready: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-50 text-red-600'
  };

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
