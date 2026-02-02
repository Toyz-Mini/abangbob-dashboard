'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore, useInventory, useStaff, useOrders } from '@/lib/store';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import Link from 'next/link';
import SalesTrendChart from '@/components/charts/SalesTrendChart';
import { DashboardSkeleton } from '@/components/Skeleton';
import { BentoGrid, BentoCard } from '@/components/BentoGrid';
import CountUp from '@/components/CountUp';
import { useAuth } from '@/lib/contexts/AuthContext';
import dynamic from 'next/dynamic';
import {
  ChefHat,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  Box,
  ArrowRight,
  DollarSign,
  ShoppingCart,
  Activity,
  Package,
  Utensils,
  LayoutDashboard,
  Calendar
} from 'lucide-react';

const MultiOutletOverview = dynamic(() => import('@/components/dashboard/MultiOutletOverview'), { ssr: false });

export default function DashboardPage() {
  const { isInitialized } = useStore();
  const { inventory } = useInventory();
  const { staff, getStaffAttendanceToday } = useStaff();
  const { getTodayOrders } = useOrders();
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardView, setDashboardView] = useState<'local' | 'hq'>('local');

  useEffect(() => {
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      setDashboardView('hq');
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayOrders = getTodayOrders();
  const salesToday = todayOrders.reduce((sum, o) => sum + (o.total - (o.refundAmount || 0)), 0);
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

  const pendingOrders = todayOrders.filter(o => o.status === 'pending').length;
  const preparingOrders = todayOrders.filter(o => o.status === 'preparing').length;
  const dateLocale = language === 'en' ? 'en-MY' : 'ms-MY';

  // Monthly Calculations
  const { orders } = useOrders();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.status !== 'cancelled';
  });

  const monthlySales = monthlyOrders.reduce((sum, o) => sum + (o.total - (o.refundAmount || 0)), 0);
  const monthlyOrdersCount = monthlyOrders.length;
  const avgOrderValue = monthlyOrdersCount > 0 ? monthlySales / monthlyOrdersCount : 0;

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
      <div className="max-w-7xl mx-auto animate-fade-in p-4">
        {/* View Switcher */}
        {(user?.role === 'Admin' || user?.role === 'Manager') && (
          <div className="flex justify-end mb-6">
            <div className="glass-panel p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setDashboardView('local')}
                className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${dashboardView === 'local' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <ChefHat size={14} />
                Outlet
              </button>
              <button
                onClick={() => setDashboardView('hq')}
                className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${dashboardView === 'hq' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutDashboard size={14} />
                HQ
              </button>
            </div>
          </div>
        )}

        {dashboardView === 'hq' ? (
          <MultiOutletOverview />
        ) : (
          <BentoGrid>
            {/* Header Tile (Wide) */}
            <BentoCard
              colSpan={2}
              title={t('dashboard.title')}
              description={t('dashboard.welcome')}
              header={
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/10">
                    {formattedDate}
                  </span>
                  <div className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-full ${onDutyStaff.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${onDutyStaff.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    {onDutyStaff.length > 0 ? t('dashboard.open') : t('dashboard.closed')}
                  </div>
                </div>
              }
            >
              <div className="mt-4 flex gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    <CountUp end={salesToday} decimals={2} prefix="BND " />
                  </span>
                  <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-md">
                    +12%
                  </span>
                </div>
              </div>
            </BentoCard>

            {/* Quick POS Action */}
            <Link href="/pos" className="md:col-span-1 group">
              <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-primary to-orange-600 text-white hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden flex flex-col justify-center items-center text-center shadow-lg">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <ShoppingCart size={48} className="mb-4 text-white/90" />
                <h3 className="text-2xl font-bold mb-1">{t('dashboard.openPOS')}</h3>
                <p className="text-white/80 text-sm">{t('dashboard.newOrder')}</p>
              </div>
            </Link>

            {/* Sales Chart */}
            <BentoCard
              colSpan={2}
              title={t('dashboard.salesTrend')}
              icon={<TrendingUp size={20} className="text-primary" />}
            >
              <div className="h-[200px] w-full mt-4">
                <SalesTrendChart data={salesTrendData} />
              </div>
            </BentoCard>

            {/* Stats Grid - Kitchen */}
            <BentoCard
              title={t('dashboard.kitchen')}
              icon={<Utensils size={20} className="text-orange-500" />}
            >
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{preparingOrders}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">{t('dashboard.prep')}</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pendingOrders}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">{t('dashboard.queued')}</div>
                </div>
                <Link href="/kds" className="col-span-2 text-center text-xs font-semibold text-gray-500 hover:text-primary py-2 bg-gray-50 dark:bg-white/5 rounded-lg transition-colors">
                  {t('dashboard.kitchenDisplay')} →
                </Link>
              </div>
            </BentoCard>

            {/* Stats - Inventory */}
            <BentoCard
              title={t('dashboard.inventoryTypes')}
              icon={<Package size={20} className={lowStockItems.length > 0 ? "text-red-500" : "text-green-500"} />}
              className={lowStockItems.length > 0 ? "border-red-500/20 bg-red-50/10" : ""}
            >
              <div className="mt-4 space-y-3">
                {lowStockItems.length > 0 ? (
                  lowStockItems.slice(0, 2).map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300">
                      <span className="font-bold truncate max-w-[120px]">{item.name}</span>
                      <span>{item.currentQuantity} {item.unit}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    All Items Stocked
                  </div>
                )}
                <Link href="/inventory" className="block text-center text-xs font-bold text-gray-500 hover:text-primary">
                  {t('dashboard.checkInventory')}
                </Link>
              </div>
            </BentoCard>

            {/* Stats - Staff */}
            <BentoCard
              title={t('dashboard.staffOnDuty')}
              icon={<Users size={20} className="text-blue-500" />}
            >
              <div className="mt-4">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white leading-none">
                    {onDutyStaff.length}
                    <span className="text-sm text-gray-400 font-medium ml-1">/ {activeStaff.length}</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(onDutyStaff.length / (activeStaff.length || 1)) * 100}%` }}
                  />
                </div>
                <Link href="/hr" className="mt-4 block text-center text-xs font-semibold text-gray-500 hover:text-primary">
                  {t('dashboard.manageTeam')}
                </Link>
              </div>
            </BentoCard>

          </BentoGrid>
        )}
      </div>
    </MainLayout>
  );
}

