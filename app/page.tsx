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
import { DollarSign, ShoppingCart, AlertTriangle, Users, TrendingUp, Clock, ChefHat, Package } from 'lucide-react';
import AIInsightsWidget from '@/components/AIInsightsWidget';
import LivePageHeader from '@/components/LivePageHeader';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';

export default function DashboardPage() {
  const { isInitialized } = useStore();
  const { inventory } = useInventory();
  const { staff, getStaffAttendanceToday } = useStaff();
  const { getTodayOrders } = useOrders();
  const { t, language } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayOrders = getTodayOrders();
  const salesToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const ordersToday = todayOrders.length;

  // Low stock items
  const lowStockItems = inventory.filter(item => item.currentQuantity <= item.minQuantity);

  // Active staff
  const activeStaff = staff.filter(s => s.status === 'active');
  const onDutyStaff = activeStaff.filter(s => {
    const record = getStaffAttendanceToday(s.id);
    return record?.clockInTime && !record?.clockOutTime;
  });

  // Generate sales trend data (last 7 days mock + today's real data)
  const salesTrendData = [
    { date: language === 'en' ? 'Mon' : 'Isn', sales: 120 },
    { date: language === 'en' ? 'Tue' : 'Sel', sales: 145 },
    { date: language === 'en' ? 'Wed' : 'Rab', sales: 132 },
    { date: language === 'en' ? 'Thu' : 'Kha', sales: 168 },
    { date: language === 'en' ? 'Fri' : 'Jum', sales: 189 },
    { date: language === 'en' ? 'Sat' : 'Sab', sales: 210 },
    { date: language === 'en' ? 'Sun' : 'Aha', sales: ordersToday },
  ];

  // Generate inventory chart data
  const inventoryChartData = inventory.slice(0, 6).map(item => ({
    name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
    quantity: item.currentQuantity,
    min: item.minQuantity,
  }));

  // Generate staff attendance data
  const staffAttendanceData = [
    { name: t('hr.onDuty'), value: onDutyStaff.length },
    { name: t('hr.offDuty'), value: activeStaff.length - onDutyStaff.length },
  ];

  // Order stats
  const pendingOrders = todayOrders.filter(o => o.status === 'pending').length;
  const preparingOrders = todayOrders.filter(o => o.status === 'preparing').length;

  // Locale for date formatting
  const dateLocale = language === 'en' ? 'en-MY' : 'ms-MY';

  if (!isInitialized) {
    return (
      <MainLayout>
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Live Header */}
        <LivePageHeader
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
          showWeather={true}
        />

        {/* Stats Grid with Staggered Animation */}
        <div className="content-grid cols-4 mb-lg animate-slide-up-stagger">
          <StatCard
            label={t('dashboard.salesToday')}
            value={`BND ${salesToday.toFixed(2)}`}
            change={ordersToday > 0 ? `${ordersToday} ${language === 'en' ? 'orders' : 'pesanan'}` : t('dashboard.noOrders')}
            changeType={ordersToday > 0 ? "positive" : "neutral"}
            icon={DollarSign}
            gradient="primary"
            sparkline={salesTrendData.map(d => d.sales)}
          />

          <StatCard
            label={t('dashboard.ordersToday')}
            value={ordersToday}
            change={pendingOrders > 0 ? `${pendingOrders} ${t('dashboard.pending')}` : t('dashboard.allCompleted')}
            changeType={pendingOrders > 0 ? "neutral" : "positive"}
            icon={ShoppingCart}
            gradient="coral"
            sparkline={[8, 10, 9, 12, 11, 13, ordersToday]}
          />

          <StatCard
            label={t('dashboard.lowStock')}
            value={lowStockItems.length}
            change={lowStockItems.length > 0 ? t('dashboard.needRestock') : t('dashboard.stockSufficient')}
            changeType={lowStockItems.length > 0 ? "negative" : "positive"}
            icon={AlertTriangle}
            gradient="warning"
          />

          <StatCard
            label={t('dashboard.staffOnDuty')}
            value={onDutyStaff.length}
            change={`${language === 'en' ? 'from' : 'dari'} ${activeStaff.length} ${language === 'en' ? 'active' : 'aktif'}`}
            changeType="neutral"
            icon={Users}
            gradient="sunset"
          />
        </div>

        {/* AI Insights Widget */}
        <div className="mb-lg hover-lift">
          <AIInsightsWidget />
        </div>

        {/* Quick Actions */}
        <div className="mb-lg">
          <GlassCard className="animate-slide-up-stagger" style={{ animationDelay: '0.2s' }}>
            <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div className="card-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('dashboard.quickActions')}</div>
            </div>
            <div className="quick-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <Link href="/pos" style={{ textDecoration: 'none' }}>
                <PremiumButton variant="primary" icon={ShoppingCart} style={{ width: '100%' }}>
                  {t('dashboard.openPOS')}
                </PremiumButton>
              </Link>
              <Link href="/inventory" style={{ textDecoration: 'none' }}>
                <PremiumButton variant="secondary" icon={Package} style={{ width: '100%' }}>
                  {t('dashboard.checkInventory')}
                </PremiumButton>
              </Link>
              <Link href="/hr/timeclock" style={{ textDecoration: 'none' }}>
                <PremiumButton variant="secondary" icon={Clock} style={{ width: '100%' }}>
                  {t('dashboard.clockInOut')}
                </PremiumButton>
              </Link>
              <Link href="/production" style={{ textDecoration: 'none' }}>
                <PremiumButton variant="secondary" icon={ChefHat} style={{ width: '100%' }}>
                  {t('dashboard.production')}
                </PremiumButton>
              </Link>
            </div>
          </GlassCard>
        </div>

        {/* Order Queue Alert */}
        {(pendingOrders > 0 || preparingOrders > 0) && (
          <GlassCard gradient="accent" className="mb-lg animate-slide-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '50%' }}>
                <ChefHat size={24} color="white" />
              </div>
              <div style={{ color: 'var(--text-primary)' }}>
                <strong style={{ fontSize: '1.1rem' }}>{pendingOrders + preparingOrders} {language === 'en' ? 'orders' : 'pesanan'}</strong> {t('dashboard.ordersInQueue')}
                <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                  ({pendingOrders} {t('dashboard.pending')}, {preparingOrders} {t('dashboard.preparing')})
                </div>
              </div>
            </div>
            <Link href="/pos">
              <PremiumButton variant="glass" size="sm">
                {t('dashboard.viewQueue')} →
              </PremiumButton>
            </Link>
          </GlassCard>
        )}

        {/* Charts Section */}
        <div className="content-grid cols-3 mb-lg">
          <ChartCard title={t('dashboard.salesTrend')} subtitle={t('dashboard.last7Days')}>
            <SalesTrendChart data={salesTrendData} />
          </ChartCard>

          <ChartCard title={t('dashboard.inventoryLevels')} subtitle={t('dashboard.topItems')}>
            <InventoryLevelChart data={inventoryChartData} />
          </ChartCard>

          <ChartCard title={t('dashboard.staffAttendance')} subtitle={t('dashboard.attendanceToday')}>
            <StaffAttendanceChart data={staffAttendanceData} />
          </ChartCard>
        </div>

        <div className="content-grid cols-2">
          {/* Low Stock Alert */}
          <GlassCard>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <AlertTriangle size={20} className="text-warning" />
                {t('dashboard.lowStockAlert')}
              </div>
              <div className="card-subtitle">{t('dashboard.needRestock')}</div>
            </div>
            {lowStockItems.length > 0 ? (
              <div>
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>{language === 'en' ? 'Item' : 'Item'}</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>{t('common.quantity')}</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>{t('common.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.slice(0, 5).map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '0.75rem' }}>{item.currentQuantity} {item.unit}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span className="badge badge-danger">{t('inventory.lowStock')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-md" style={{ marginTop: '1rem' }}>
                  <Link href="/inventory" style={{ textDecoration: 'none' }}>
                    <PremiumButton variant="outline" size="sm" style={{ width: '100%' }}>
                      {t('common.viewAll')} {t('nav.inventory')}
                    </PremiumButton>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                {t('dashboard.stockSufficient')}!
              </div>
            )}
          </GlassCard>

          {/* Staff On Duty */}
          <GlassCard>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <Users size={20} className="text-success" />
                {t('dashboard.staffWorking')}
              </div>
              <div className="card-subtitle">{t('dashboard.currentAttendance')}</div>
            </div>
            {onDutyStaff.length > 0 ? (
              <div>
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>{t('common.name')}</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>{t('hr.role')}</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>{t('common.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {onDutyStaff.map((staffMember) => {
                        return (
                          <tr key={staffMember.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{staffMember.name}</td>
                            <td style={{ padding: '0.75rem' }}>{staffMember.role}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span className="badge badge-success">{t('hr.onDuty')}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-md" style={{ marginTop: '1rem' }}>
                  <Link href="/hr" style={{ textDecoration: 'none' }}>
                    <PremiumButton variant="outline" size="sm" style={{ width: '100%' }}>
                      {language === 'en' ? 'Manage HR' : 'Kelola HR'}
                    </PremiumButton>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>{t('dashboard.noStaffOnDuty')}</p>
                <Link href="/hr/timeclock">
                  <PremiumButton variant="primary" size="sm" icon={Clock}>
                    {t('hr.clockIn')} {language === 'en' ? 'Now' : 'Sekarang'}
                  </PremiumButton>
                </Link>
              </div>
            )}
          </GlassCard>
        </div>
        {/* Recent Orders */}
        {todayOrders.length > 0 && (
          <div className="card mt-lg">
            <div className="card-header">
              <div className="section-title">
                <ShoppingCart size={20} className="text-primary" />
                {t('dashboard.recentOrders')}
              </div>
              <div className="card-subtitle">{t('dashboard.last5Orders')}</div>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>{language === 'en' ? 'Order No.' : 'No. Pesanan'}</th>
                    <th>{language === 'en' ? 'Items' : 'Item'}</th>
                    <th>{t('common.total')}</th>
                    <th className="hidden-mobile">{language === 'en' ? 'Type' : 'Jenis'}</th>
                    <th>{t('common.status')}</th>
                    <th className="hidden-mobile">{t('common.time')}</th>
                  </tr>
                </thead>
                <tbody>
                  {todayOrders.slice(0, 5).map(order => (
                    <tr key={order.id}>
                      <td className="font-semibold">{order.orderNumber}</td>
                      <td className="text-sm">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ').substring(0, 30)}...
                      </td>
                      <td className="font-semibold">BND {order.total.toFixed(2)}</td>
                      <td className="hidden-mobile">
                        <span className="badge badge-info badge-sm">{order.orderType}</span>
                      </td>
                      <td>
                        <span className={`badge badge-sm ${order.status === 'completed' ? 'badge-success' :
                          order.status === 'ready' ? 'badge-success' :
                            order.status === 'preparing' ? 'badge-info' : 'badge-warning'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="text-sm text-secondary hidden-mobile">
                        {new Date(order.createdAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-md">
              <Link href="/pos" className="btn btn-outline btn-sm">
                {t('common.viewAll')} {language === 'en' ? 'Orders' : 'Pesanan'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
