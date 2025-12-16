'use client';

import MainLayout from '@/components/MainLayout';
import { useStaff, useKPI, useOrders } from '@/lib/store';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import Link from 'next/link';
import { Users, Zap, List, Clock, DollarSign, BarChart3, UserPlus, CheckCircle, Trophy, TrendingUp, Award, Crown, Timer, Gauge, Medal, Calendar } from 'lucide-react';
import StatCard from '@/components/StatCard';
import LivePageHeader from '@/components/LivePageHeader';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getRankTier, getScoreColor } from '@/lib/kpi-data';
import { Order } from '@/lib/types';
import { useMemo } from 'react';

// Helper function to calculate preparation time in minutes
function calculatePrepTime(order: Order): number | null {
  if (!order.preparingStartedAt || !order.readyAt) return null;
  const start = new Date(order.preparingStartedAt).getTime();
  const end = new Date(order.readyAt).getTime();
  return Math.round((end - start) / 60000); // Convert to minutes
}

// Helper to format time in minutes/seconds
function formatTime(minutes: number): string {
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}j ${mins}m`;
}

interface StaffSpeedStats {
  staffId: string;
  staffName: string;
  totalOrders: number;
  avgPrepTime: number;
  ordersPerHour: number;
  fastestTime: number;
  slowestTime: number;
}

export default function HRDashboardPage() {
  const { staff, attendance, getStaffAttendanceToday, isInitialized } = useStaff();
  const { getKPILeaderboard, staffKPI } = useKPI();
  const { orders } = useOrders();
  const { t, language } = useTranslation();

  const activeStaff = staff.filter(s => s.status === 'active');
  const today = new Date().toISOString().split('T')[0];

  // Calculate staff speed statistics
  const staffSpeedStats = useMemo(() => {
    // Get orders from today with prep time data
    const ordersWithPrepTime = orders.filter(o =>
      o.preparedByStaffId &&
      o.preparingStartedAt &&
      o.readyAt
    );

    // Group orders by staff
    const staffOrders: Record<string, Order[]> = {};
    ordersWithPrepTime.forEach(order => {
      const staffId = order.preparedByStaffId!;
      if (!staffOrders[staffId]) staffOrders[staffId] = [];
      staffOrders[staffId].push(order);
    });

    // Calculate stats for each staff
    const stats: StaffSpeedStats[] = [];
    Object.entries(staffOrders).forEach(([staffId, staffOrderList]) => {
      const staffInfo = staff.find(s => s.id === staffId);
      if (!staffInfo) return;

      const prepTimes = staffOrderList
        .map(o => calculatePrepTime(o))
        .filter((t): t is number => t !== null);

      if (prepTimes.length === 0) return;

      const avgPrepTime = prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length;
      const fastestTime = Math.min(...prepTimes);
      const slowestTime = Math.max(...prepTimes);

      // Calculate orders per hour (based on first and last order timestamps)
      let ordersPerHour = 0;
      if (staffOrderList.length >= 2) {
        const times = staffOrderList.map(o => new Date(o.readyAt!).getTime());
        const firstOrder = Math.min(...times);
        const lastOrder = Math.max(...times);
        const hoursDiff = (lastOrder - firstOrder) / (1000 * 60 * 60);
        if (hoursDiff > 0) {
          ordersPerHour = Math.round((staffOrderList.length / hoursDiff) * 10) / 10;
        }
      }

      stats.push({
        staffId,
        staffName: staffInfo.name,
        totalOrders: staffOrderList.length,
        avgPrepTime,
        ordersPerHour,
        fastestTime,
        slowestTime
      });
    });

    // Sort by average prep time (fastest first)
    return stats.sort((a, b) => a.avgPrepTime - b.avgPrepTime);
  }, [orders, staff]);

  // Calculate overall speed metrics
  const overallSpeedMetrics = useMemo(() => {
    if (staffSpeedStats.length === 0) {
      return { avgPrepTime: 0, totalOrders: 0, fastestStaff: null };
    }

    const totalOrders = staffSpeedStats.reduce((sum, s) => sum + s.totalOrders, 0);
    const weightedAvg = staffSpeedStats.reduce((sum, s) => sum + (s.avgPrepTime * s.totalOrders), 0) / totalOrders;
    const fastestStaff = staffSpeedStats[0];

    return {
      avgPrepTime: Math.round(weightedAvg * 10) / 10,
      totalOrders,
      fastestStaff
    };
  }, [staffSpeedStats]);

  // Get on-duty staff (clocked in but not clocked out)
  const onDutyStaff = activeStaff.filter(s => {
    const record = getStaffAttendanceToday(s.id);
    return record?.clockInTime && !record?.clockOutTime;
  });

  // Get completed staff (clocked in and out)
  const completedStaff = activeStaff.filter(s => {
    const record = getStaffAttendanceToday(s.id);
    return record?.clockInTime && record?.clockOutTime;
  });

  // Get today's attendance records
  const todayAttendance = attendance.filter(a => a.date === today);

  // KPI data
  const currentMonth = new Date().toISOString().slice(0, 7);
  const leaderboard = getKPILeaderboard(currentMonth);
  const topPerformer = leaderboard[0];
  const topPerformerInfo = topPerformer ? staff.find(s => s.id === topPerformer.staffId) : null;
  const avgKPI = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((sum, k) => sum + k.overallScore, 0) / leaderboard.length)
    : 0;

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
        <LivePageHeader
          title={`${t('hr.title')}`}
          subtitle={t('hr.subtitle')}
          rightContent={
            <Link href="/hr/staff/new">
              <PremiumButton icon={UserPlus} variant="primary">
                {t('hr.registerNewStaff')}
              </PremiumButton>
            </Link>
          }
        />

        {/* Stats Grid */}
        <div className="content-grid cols-4 mb-lg animate-slide-up-stagger">
          <StatCard
            label="Jumlah Staf"
            value={staff.length}
            change={`${activeStaff.length} aktif`}
            changeType="neutral"
            icon={Users}
            gradient="primary"
          />
          <StatCard
            label="Sedang Bekerja"
            value={onDutyStaff.length}
            change="On duty sekarang"
            changeType="positive"
            icon={Clock}
            gradient="accent"
          />
          <StatCard
            label="Sudah Clock Out"
            value={completedStaff.length}
            change="Selesai hari ini"
            changeType="neutral"
            icon={CheckCircle}
            gradient="subtle"
          />
          <StatCard
            label="Belum Clock In"
            value={activeStaff.length - onDutyStaff.length - completedStaff.length}
            change="Belum mula kerja"
            changeType={activeStaff.length - onDutyStaff.length - completedStaff.length > 0 ? "negative" : "neutral"}
            icon={Users}
            gradient="warning"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Live Roster (ID Card Style) */}
            <GlassCard className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Roster</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{onDutyStaff.length} staf sedang bertugas</div>
                  </div>
                </div>
                <Link href="/hr/timeclock">
                  <PremiumButton size="sm" variant="outline">Clock In/Out</PremiumButton>
                </Link>
              </div>

              {onDutyStaff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {onDutyStaff.map(staffMember => {
                    const record = getStaffAttendanceToday(staffMember.id);
                    return (
                      <div key={staffMember.id} className="hover-lift" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderLeft: '4px solid var(--success)'
                      }}>
                        <div style={{
                          width: '48px', height: '48px',
                          borderRadius: '50%',
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '1.1rem'
                        }}>
                          {staffMember.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{staffMember.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{staffMember.role}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--success)' }}>
                            <Clock size={12} /> Live sejak {record?.clockInTime || '-'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Tiada staf bekerja pada masa ini</p>
                  <Link href="/hr/timeclock">
                    <PremiumButton size="sm" icon={Clock}>Pergi ke Clock In</PremiumButton>
                  </Link>
                </div>
              )}
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={20} color="var(--warning)" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link href="/hr/kpi">
                  <PremiumButton variant="glass" style={{ width: '100%', justifyContent: 'flex-start' }} icon={Trophy}>KPI & Leaderboard</PremiumButton>
                </Link>
                <Link href="/hr/staff">
                  <PremiumButton variant="glass" style={{ width: '100%', justifyContent: 'flex-start' }} icon={List}>Senarai Staf</PremiumButton>
                </Link>
                <Link href="/hr/timeclock">
                  <PremiumButton variant="glass" style={{ width: '100%', justifyContent: 'flex-start' }} icon={Clock}>Timeclock</PremiumButton>
                </Link>
                <Link href="/hr/schedule">
                  <PremiumButton variant="glass" style={{ width: '100%', justifyContent: 'flex-start' }} icon={Calendar}>Jadual Shift</PremiumButton>
                </Link>
                <Link href="/hr/payroll">
                  <PremiumButton variant="glass" style={{ width: '100%', justifyContent: 'flex-start' }} icon={DollarSign}>Payroll</PremiumButton>
                </Link>
              </div>
            </GlassCard>

            {/* Staff Speed Analytics */}
            <GlassCard className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Timer size={22} color="var(--primary)" />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Prestasi Kecepatan</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Analitik KDS Live</div>
                </div>
              </div>

              {/* Speed Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Purata Masa</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{overallSpeedMetrics.avgPrepTime > 0 ? formatTime(overallSpeedMetrics.avgPrepTime) : '-'}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Orders</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{overallSpeedMetrics.totalOrders}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Terpantas</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--warning)' }}>{overallSpeedMetrics.fastestStaff?.staffName || '-'}</div>
                </div>
              </div>

              {/* Table */}
              {staffSpeedStats.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Nama</th>
                        <th className="text-center">Avg</th>
                        <th className="text-center">Speed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffSpeedStats.slice(0, 5).map((stat, idx) => (
                        <tr key={stat.staffId}>
                          <td>#{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{stat.staffName}</td>
                          <td className="text-center font-mono">{formatTime(stat.avgPrepTime)}</td>
                          <td className="text-center">
                            <span className="badge badge-neutral">{stat.ordersPerHour}/j</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-secondary py-4">Tiada data KDS hari ini</div>
              )}
            </GlassCard>
          </div>

          {/* Sidebar Column */}
          <div className="flex flex-col gap-6">
            {/* KPI Widget */}
            <GlassCard gradient="accent" className="animate-slide-up" style={{ animationDelay: '0.2s', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trophy size={18} /> <span style={{ fontWeight: 700 }}>KPI Leaderboard</span>
                </div>
                <Link href="/hr/kpi" style={{ fontSize: '0.85rem', textDecoration: 'underline', opacity: 0.9 }}>Lihat Semua</Link>
              </div>

              {leaderboard.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {leaderboard.slice(0, 3).map((kpi, idx) => {
                    const staffInfo = staff.find(s => s.id === kpi.staffId);
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div key={kpi.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem', background: 'rgba(255,255,255,0.15)',
                        borderRadius: 'var(--radius-md)', backdropFilter: 'blur(4px)'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>{medals[idx]}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{staffInfo?.name}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Score: {kpi.overallScore}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.8 }}>Tiada data KPI bulan ini</div>
              )}
            </GlassCard>

            {/* Completed Attendance */}
            {completedStaff.length > 0 && (
              <GlassCard className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="card-header border-b border-gray-100 pb-2 mb-2">
                  <div className="card-title text-base flex items-center gap-2">
                    <CheckCircle size={16} /> Selesai Hari Ini
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {completedStaff.map(staffMember => {
                    const record = getStaffAttendanceToday(staffMember.id);
                    return (
                      <div key={staffMember.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <span>{staffMember.name}</span>
                        <span className="text-secondary">{record?.clockOutTime}</span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
