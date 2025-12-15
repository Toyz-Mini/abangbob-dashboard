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
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="page-subtitle">
            {currentTime.toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} •
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="content-grid cols-4 mb-lg">
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
        <div className="mb-lg">
          <AIInsightsWidget />
        </div>

        {/* Quick Actions */}
        <div className="card mb-lg">
          <div className="card-header">
            <div className="card-title">{t('dashboard.quickActions')}</div>
          </div>
          <div className="quick-actions">
            <Link href="/pos" className="btn btn-primary">
              <ShoppingCart size={18} />
              {t('dashboard.openPOS')}
            </Link>
            <Link href="/inventory" className="btn btn-outline">
              <Package size={18} />
              {t('dashboard.checkInventory')}
            </Link>
            <Link href="/hr/timeclock" className="btn btn-outline">
              <Clock size={18} />
              {t('dashboard.clockInOut')}
            </Link>
            <Link href="/delivery" className="btn btn-outline">
              <TrendingUp size={18} />
              {t('dashboard.deliveryHub')}
            </Link>
            <Link href="/production" className="btn btn-outline">
              <ChefHat size={18} />
              {t('dashboard.production')}
            </Link>
          </div>
        </div>

        {/* Order Queue Alert */}
        {(pendingOrders > 0 || preparingOrders > 0) && (
          <div className="alert alert-warning alert-flex mb-lg">
            <div className="alert-content">
              <ChefHat size={20} />
              <span>
                <strong>{pendingOrders + preparingOrders} {language === 'en' ? 'orders' : 'pesanan'}</strong> {t('dashboard.ordersInQueue')}
                ({pendingOrders} {t('dashboard.pending')}, {preparingOrders} {t('dashboard.preparing')})
              </span>
            </div>
            <Link href="/pos" className="btn btn-sm btn-warning">
              {t('dashboard.viewQueue')}
            </Link>
          </div>
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
          <div className="card">
            <div className="card-header">
              <div className="section-title">
                <AlertTriangle size={20} className="text-warning" />
                {t('dashboard.lowStockAlert')}
              </div>
              <div className="card-subtitle">{t('dashboard.needRestock')}</div>
            </div>
            {lowStockItems.length > 0 ? (
              <div>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{language === 'en' ? 'Item' : 'Item'}</th>
                        <th>{t('common.quantity')}</th>
                        <th className="hidden-mobile">{language === 'en' ? 'Minimum' : 'Minimum'}</th>
                        <th>{t('common.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.slice(0, 5).map((item) => (
                        <tr key={item.id}>
                          <td className="font-semibold">{item.name}</td>
                          <td>{item.currentQuantity} {item.unit}</td>
                          <td className="hidden-mobile">{item.minQuantity} {item.unit}</td>
                          <td>
                            <span className="badge badge-danger">{t('inventory.lowStock')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-md">
                  <Link href="/inventory" className="btn btn-outline btn-sm">
                    {t('common.viewAll')} {t('nav.inventory')}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                {t('dashboard.stockSufficient')}!
              </div>
            )}
          </div>

          {/* Staff On Duty */}
          <div className="card">
            <div className="card-header">
              <div className="section-title">
                <Users size={20} className="text-success" />
                {t('dashboard.staffWorking')}
              </div>
              <div className="card-subtitle">{t('dashboard.currentAttendance')}</div>
            </div>
            {onDutyStaff.length > 0 ? (
              <div>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('common.name')}</th>
                        <th>{t('hr.role')}</th>
                        <th className="hidden-mobile">{t('hr.clockIn')}</th>
                        <th>{t('common.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {onDutyStaff.map((staffMember) => {
                        const record = getStaffAttendanceToday(staffMember.id);
                        return (
                          <tr key={staffMember.id}>
                            <td className="font-semibold">{staffMember.name}</td>
                            <td>{staffMember.role}</td>
                            <td className="hidden-mobile">{record?.clockInTime || '-'}</td>
                            <td>
                              <span className="badge badge-success">{t('hr.onDuty')}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-md">
                  <Link href="/hr" className="btn btn-outline btn-sm">
                    {language === 'en' ? 'Manage HR' : 'Kelola HR'}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>{t('dashboard.noStaffOnDuty')}</p>
                <Link href="/hr/timeclock" className="btn btn-primary btn-sm mt-md">
                  <Clock size={16} />
                  {t('hr.clockIn')} {language === 'en' ? 'Now' : 'Sekarang'}
                </Link>
              </div>
            )}
          </div>
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
