'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore, useInventory, useStaff, useOrders } from '@/lib/store';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import Link from 'next/link';
import SalesTrendChart from '@/components/charts/SalesTrendChart';
import StaffAttendanceChart from '@/components/charts/StaffAttendanceChart';
import { DashboardSkeleton } from '@/components/Skeleton';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import { ChefHat, TrendingUp, Clock, AlertTriangle, Users, Box, ArrowRight, DollarSign, ShoppingCart, Activity, Package, Utensils } from 'lucide-react';
import CountUp from '@/components/CountUp';

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

  const staffAttendanceData = [
    { name: t('hr.onDuty'), value: onDutyStaff.length },
    { name: t('hr.offDuty'), value: activeStaff.length - onDutyStaff.length },
  ];

  const pendingOrders = todayOrders.filter(o => o.status === 'pending').length;
  const preparingOrders = todayOrders.filter(o => o.status === 'preparing').length;
  const dateLocale = language === 'en' ? 'en-MY' : 'ms-MY';

  // Monthly Calculations
  const { orders } = useOrders(); // Destructure all orders
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.status !== 'cancelled';
  });

  const monthlySales = monthlyOrders.reduce((sum, o) => sum + o.total, 0);
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
      <div className="max-w-[1600px] mx-auto animate-fade-in p-4 lg:p-6">

        {/* BENTO GRID CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-min">

          {/* 1. HEADER TILE (2x1) */}
          <GlassCard className="col-span-1 md:col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[180px]" gradient="primary-rich">
            {/* Texture Overlay */}
            <div className="absolute inset-0 bg-grid-white opacity-50 z-0 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white/80 mb-2">
                <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                  {formattedDate}
                </span>
                <div className={`text-xs flex items-center gap-1.5 px-2 py-0.5 rounded-full ${onDutyStaff.length > 0 ? 'bg-green-500/20 text-green-100' : 'bg-gray-500/20 text-gray-200'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${onDutyStaff.length > 0 ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                  {onDutyStaff.length > 0 ? t('dashboard.open') : t('dashboard.closed')}
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                {t('dashboard.title')}
              </h1>
              <p className="text-white/70">{t('dashboard.welcome')}</p>
            </div>

            {/* Decorative background Elements */}
            <div className="absolute -right-10 -bottom-10 opacity-10 text-white transform rotate-12">
              <ChefHat size={180} />
            </div>
          </GlassCard>

          {/* 2. SALES TODAY (1x1) */}
          {/* 2. SALES TODAY (1x1) */}
          <GlassCard className="col-span-1 flex flex-col justify-between min-h-[140px] animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">{t('dashboard.salesToday')}</span>
              <DollarSign size={18} className="text-gray-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  <CountUp end={salesToday} decimals={2} prefix="BND " />
                </span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md bg-green-100 text-green-700`}>
                  +12%
                </span>
              </div>
            </div>
          </GlassCard>

          {/* 3. OPEN POS ACTION (1x1) - Highlighted */}
          <Link href="/pos" className="col-span-1 h-full block group relative overflow-hidden rounded-2xl">
            <GlassCard className="h-full flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform duration-300 cursor-pointer border-2 border-transparent hover:border-primary/20" gradient="accent-rich">
              {/* Shimmer Effect */}
              <div className="animate-shimmer"></div>

              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner relative z-10">
                <ShoppingCart size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{t('dashboard.openPOS')}</h3>
              <p className="text-white/70 text-sm">{t('dashboard.newOrder')}</p>
            </GlassCard>
          </Link>

          {/* 4. SALES TREND CHART (2x2) */}
          <GlassCard className="col-span-1 md:col-span-2 row-span-2 min-h-[320px] flex flex-col" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-bold text-gray-800">{t('dashboard.salesTrend')}</h3>
              </div>
              <Link href="/analytics" className="text-xs font-medium text-primary hover:bg-primary/5 px-3 py-1.5 rounded-full transition-colors">
                {t('dashboard.viewReport')}
              </Link>
            </div>
            <div className="flex-1 w-full min-h-0">
              <SalesTrendChart data={salesTrendData} />
            </div>
          </GlassCard>

          {/* 5. ORDERS TODAY (1x1) */}
          <BentoTile
            title={t('dashboard.ordersToday')}
            value={ordersToday.toString()}
            subValue={`${pendingOrders} ${t('pos.pending')}`}
            icon={Box}
            delay="0.3s"
          />

          {/* 6. KITCHEN STATUS (1x1) */}
          <GlassCard className="col-span-1 flex flex-col justify-between min-h-[160px]" style={{ animationDelay: '0.4s' }}>
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-500">{t('dashboard.kitchen')}</h3>
              <Utensils size={18} className="text-orange-500" />
            </div>

            <div className="flex gap-2 mt-2">
              <div className="flex-1 p-2 bg-orange-50 rounded-xl border border-orange-100 text-center">
                <div className="text-2xl font-bold text-orange-600">{preparingOrders}</div>
                <div className="text-[10px] uppercase font-bold text-orange-400">{t('dashboard.prep')}</div>
              </div>
              <div className="flex-1 p-2 bg-blue-50 rounded-xl border border-blue-100 text-center">
                <div className="text-2xl font-bold text-blue-600">{pendingOrders}</div>
                <div className="text-[10px] uppercase font-bold text-blue-400">{t('dashboard.queued')}</div>
              </div>
            </div>

            <Link href="/kds" className="mt-3 text-xs flex items-center justify-center gap-1 text-gray-600 hover:text-primary py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <span>{t('dashboard.kitchenDisplay')}</span>
              <ArrowRight size={12} />
            </Link>
          </GlassCard>

          {/* 7. STAFF STATUS (1x1) */}
          <GlassCard className="col-span-1" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500">{t('dashboard.staffOnDuty')}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{onDutyStaff.length}<span className="text-sm text-gray-400 font-normal">/{activeStaff.length}</span></div>
              </div>
              <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                <Users size={20} />
              </div>
            </div>

            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${(onDutyStaff.length / (activeStaff.length || 1)) * 100}%` }}
              />
            </div>

            <Link href="/hr" className="text-xs text-gray-500 hover:text-gray-800 flex items-center justify-end">
              {t('dashboard.manageTeam')} <ArrowRight size={12} className="ml-1" />
            </Link>
          </GlassCard>

          {/* 8. INVENTORY ALERT (1x1) */}
          <GlassCard className={`col-span-1 ${lowStockItems.length > 0 ? 'border-amber-200 bg-amber-50/30' : ''}`} style={{ animationDelay: '0.6s' }}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${lowStockItems.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                  <AlertTriangle size={16} />
                </div>
                <h3 className={`font-semibold ${lowStockItems.length > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
                  {lowStockItems.length > 0 ? t('dashboard.restockNeeded') : t('dashboard.inventoryTypes')}
                </h3>
              </div>
            </div>

            {lowStockItems.length > 0 ? (
              <div className="space-y-2">
                {lowStockItems.slice(0, 2).map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs p-2 bg-white/60 rounded-lg border border-amber-100/50">
                    <span className="font-medium text-gray-800 truncate max-w-[100px]">{item.name}</span>
                    <span className="text-amber-600 font-bold">{item.currentQuantity} {item.unit}</span>
                  </div>
                ))}
                {lowStockItems.length > 2 && (
                  <div className="text-[10px] text-center text-amber-600 font-medium">
                    +{lowStockItems.length - 2} {t('dashboard.moreItems')}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-20 text-gray-400 text-xs">
                <Package size={24} className="mb-2 opacity-50" />
                <span>{t('dashboard.allStockHealthy')}</span>
              </div>
            )}

            <Link href="/inventory" className="mt-3 block text-center text-xs font-semibold text-primary hover:underline">
              {t('dashboard.checkInventory')}
            </Link>
          </GlassCard>

          {/* 9. KEY FINANCIAL METRICS (Replaces Quick Actions) */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
            <GlassCard className="col-span-1 flex flex-col justify-between min-h-[140px]" gradient="primary-rich">
              <div>
                <div className="flex items-center gap-2 mb-1 text-white/80">
                  <TrendingUp size={16} />
                  <span className="text-sm font-medium">{t('dashboard.monthlyRevenue')}</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  <CountUp end={monthlySales} decimals={2} prefix="BND " />
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {monthlyOrdersCount} {t('dashboard.ordersThisMonth')}
                </div>
              </div>
              <div className="mt-3">
                <Link href="/analytics" className="flex items-center gap-1 text-xs text-white/90 font-medium px-2 py-1 rounded-lg bg-white/20 w-fit backdrop-blur-md border border-white/10">
                  <ArrowRight size={12} />
                  <span>{t('dashboard.viewPerformance')}</span>
                </Link>
              </div>
            </GlassCard>

            <GlassCard className="col-span-1 flex flex-col justify-between min-h-[140px]" gradient="subtle">
              <div>
                <div className="flex items-center gap-2 mb-1 text-gray-500">
                  <DollarSign size={16} />
                  <span className="text-sm font-medium">{t('dashboard.avgOrderValue')}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  <CountUp end={avgOrderValue} decimals={2} prefix="BND " />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {t('dashboard.customerSpend')}
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </GlassCard>
          </div>

          {/* 10. RECENT ORDERS LIST (2x2 or 4x1 depending on layout, here spans 2 cols wide on large) */}
          <GlassCard className="col-span-1 md:col-span-2 lg:col-span-2 min-h-[300px]" style={{ animationDelay: '0.7s' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">{t('dashboard.recentOrders')}</h3>
              <Link href="/order-history" className="text-sm text-primary hover:underline">{t('dashboard.seeAll')}</Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-gray-400 border-b border-gray-100 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="pb-2 font-medium">{t('dashboard.order')}</th>
                    <th className="pb-2 font-medium">{t('common.status')}</th>
                    <th className="pb-2 font-medium text-right">{t('dashboard.amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {todayOrders.slice(0, 4).map(order => (
                    <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-3">
                        <div className="font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[120px]">
                          {order.items.map(i => i.name).join(', ')}
                        </div>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {order.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {todayOrders.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-400">
                        {t('dashboard.noOrdersYet')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

        </div>
      </div>
    </MainLayout>
  );
}

function BentoTile({ title, value, subValue, icon: Icon, trend, isPositive, delay = '0s' }: any) {
  return (
    <GlassCard className="col-span-1 flex flex-col justify-between min-h-[140px] animate-slide-up" style={{ animationDelay: delay }}>
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        {Icon && <Icon size={18} className="text-gray-400" />}
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {trend && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend}
            </span>
          )}
        </div>
        {subValue && <div className="text-xs text-gray-400 mt-1">{subValue}</div>}
      </div>
    </GlassCard>
  );
}

function QuickActionTile({ href, icon: Icon, label }: any) {
  return (
    <Link href={href}>
      <GlassCard className="h-full flex flex-col items-center justify-center p-4 hover:scale-[1.03] transition-transform cursor-pointer group" hoverEffect>
        <div className="p-3 rounded-full bg-gray-50 text-gray-600 mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
          <Icon size={20} />
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </GlassCard>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    preparing: 'bg-orange-100 text-orange-700',
    ready: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-50 text-red-600'
  };

  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${styles[status] || styles.pending}`}>
      {t(`pos.${status}`) || status}
    </span>
  );
}
