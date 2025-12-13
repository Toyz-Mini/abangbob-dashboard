'use client';

import MainLayout from '@/components/MainLayout';
import { useStaff, useKPI, useOrders } from '@/lib/store';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import Link from 'next/link';
import { Users, Zap, List, Clock, DollarSign, BarChart3, UserPlus, CheckCircle, Trophy, TrendingUp, Award, Crown, Timer, Gauge, Medal } from 'lucide-react';
import StatCard from '@/components/StatCard';
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {t('hr.title')} Management
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('hr.subtitle')}
            </p>
          </div>
          <Link href="/hr/staff/new" className="btn btn-primary">
            <UserPlus size={18} />
            {t('hr.registerNewStaff')}
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="content-grid cols-4 mb-lg">
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
            gradient="success"
          />
          <StatCard
            label="Sudah Clock Out"
            value={completedStaff.length}
            change="Selesai hari ini"
            changeType="neutral"
            icon={CheckCircle}
            gradient="success"
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

        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1.5rem' }}>
          {/* Live Roster */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="var(--success)" />
                Staf Bekerja Sekarang (Live Roster)
              </div>
              <div className="card-subtitle">{onDutyStaff.length} orang on duty</div>
            </div>
            {onDutyStaff.length > 0 ? (
              <div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Jawatan</th>
                      <th>Clock In</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onDutyStaff.map(staffMember => {
                      const record = getStaffAttendanceToday(staffMember.id);
                      return (
                        <tr key={staffMember.id}>
                          <td style={{ fontWeight: 600 }}>{staffMember.name}</td>
                          <td>{staffMember.role}</td>
                          <td>{record?.clockInTime || '-'}</td>
                          <td>
                            <span className="badge badge-success">On Duty</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ marginTop: '1rem' }}>
                  <Link href="/hr/timeclock" className="btn btn-outline btn-sm">
                    Clock In/Out →
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Tiada staf bekerja pada masa ini
                </p>
                <Link href="/hr/timeclock" className="btn btn-primary btn-sm">
                  <Clock size={16} />
                  Pergi ke Clock In
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={20} color="var(--warning)" />
                Quick Actions
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link href="/hr/kpi" className="btn btn-primary" style={{ justifyContent: 'flex-start', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Trophy size={18} />
                KPI & Leaderboard
              </Link>
              <Link href="/hr/staff" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                <List size={18} />
                Senarai Semua Staf ({staff.length})
              </Link>
              <Link href="/hr/timeclock" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                <Clock size={18} />
                Clock In/Out
              </Link>
              <Link href="/hr/staff/new" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                <UserPlus size={18} />
                Daftar Staf Baru
              </Link>
              <Link href="/hr/schedule" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                <BarChart3 size={18} />
                Shift Scheduler
              </Link>
              <Link href="/hr/payroll" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                <DollarSign size={18} />
                Generate Payroll
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Leaderboard Preview */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy size={20} color="var(--warning)" />
              KPI Leaderboard - {new Date().toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}
            </div>
            <Link href="/hr/kpi" className="btn btn-outline btn-sm">
              Lihat Semua →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
            {/* Top Performer */}
            <div style={{ 
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
              border: '2px solid #fbbf24'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2.5rem' }}>👑</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Top Performer
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {topPerformerInfo?.name || 'Tiada data'}
                  </div>
                  {topPerformer && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginTop: '0.25rem'
                    }}>
                      <span style={{ 
                        fontWeight: 700, 
                        color: getScoreColor(topPerformer.overallScore),
                        fontSize: '1.25rem'
                      }}>
                        {topPerformer.overallScore}%
                      </span>
                      <span style={{ 
                        padding: '0.125rem 0.5rem',
                        background: 'var(--success)',
                        color: 'white',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}>
                        +RM{topPerformer.bonusAmount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Average KPI */}
            <div style={{ 
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp size={24} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Purata KPI Staf
                  </div>
                  <div style={{ 
                    fontWeight: 700, 
                    fontSize: '1.5rem',
                    color: getScoreColor(avgKPI)
                  }}>
                    {avgKPI}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 List */}
          {leaderboard.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {leaderboard.slice(0, 3).map((kpi, idx) => {
                const staffInfo = staff.find(s => s.id === kpi.staffId);
                const tier = getRankTier(kpi.overallScore);
                const medals = ['🥇', '🥈', '🥉'];
                
                return (
                  <Link 
                    key={kpi.id}
                    href={`/hr/kpi/${kpi.staffId}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--gray-50)',
                      transition: 'all 0.2s'
                    }}
                    className="hover-lift"
                    >
                      <span style={{ fontSize: '1.25rem' }}>{medals[idx]}</span>
                      <span style={{ fontWeight: 600, flex: 1 }}>{staffInfo?.name}</span>
                      <span style={{ 
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: `${tier.color}20`,
                        color: tier.color
                      }}>
                        {tier.icon} {tier.tier}
                      </span>
                      <span style={{ 
                        fontWeight: 700, 
                        color: getScoreColor(kpi.overallScore)
                      }}>
                        {kpi.overallScore}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {leaderboard.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <Trophy size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Tiada data KPI untuk bulan ini</p>
              <Link href="/hr/kpi" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                Lihat Leaderboard
              </Link>
            </div>
          )}
        </div>

        {/* Staff Speed Analytics Section */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Timer size={20} color="var(--primary)" />
              Prestasi Kecepatan Staff
            </div>
            <div className="card-subtitle">
              Berdasarkan data dari Kitchen Display System
            </div>
          </div>

          {/* Speed Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Average Prep Time */}
            <div style={{ 
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Gauge size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Purata Masa Penyediaan
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#2563eb' }}>
                    {overallSpeedMetrics.avgPrepTime > 0 ? formatTime(overallSpeedMetrics.avgPrepTime) : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Orders Tracked */}
            <div style={{ 
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Jumlah Order Ditrack
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#059669' }}>
                    {overallSpeedMetrics.totalOrders}
                  </div>
                </div>
              </div>
            </div>

            {/* Fastest Staff */}
            <div style={{ 
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
              border: '2px solid #fbbf24'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '2rem' }}>⚡</div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Staff Terpantas
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#92400e' }}>
                    {overallSpeedMetrics.fastestStaff?.staffName || '-'}
                  </div>
                  {overallSpeedMetrics.fastestStaff && (
                    <div style={{ fontSize: '0.8rem', color: '#b45309' }}>
                      Avg: {formatTime(overallSpeedMetrics.fastestStaff.avgPrepTime)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Staff Speed Ranking Table */}
          {staffSpeedStats.length > 0 ? (
            <div>
              <h4 style={{ 
                fontWeight: 600, 
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Medal size={18} color="var(--warning)" />
                Ranking Kecepatan Staff
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Rank</th>
                      <th>Nama Staff</th>
                      <th style={{ textAlign: 'center' }}>Orders</th>
                      <th style={{ textAlign: 'center' }}>Purata Masa</th>
                      <th style={{ textAlign: 'center' }}>Terpantas</th>
                      <th style={{ textAlign: 'center' }}>Terlambat</th>
                      <th style={{ textAlign: 'center' }}>Orders/Jam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffSpeedStats.map((stat, idx) => {
                      const medals = ['🥇', '🥈', '🥉'];
                      const isTopThree = idx < 3;
                      
                      // Determine color based on avg prep time
                      let timeColor = 'var(--text-primary)';
                      if (stat.avgPrepTime <= 3) timeColor = '#059669'; // Green - very fast
                      else if (stat.avgPrepTime <= 5) timeColor = '#2563eb'; // Blue - good
                      else if (stat.avgPrepTime <= 8) timeColor = '#d97706'; // Orange - okay
                      else timeColor = '#dc2626'; // Red - slow
                      
                      return (
                        <tr key={stat.staffId} style={{ 
                          background: isTopThree ? 'rgba(251, 191, 36, 0.05)' : undefined
                        }}>
                          <td style={{ textAlign: 'center', fontSize: '1.25rem' }}>
                            {isTopThree ? medals[idx] : idx + 1}
                          </td>
                          <td style={{ fontWeight: 600 }}>{stat.staffName}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="badge badge-info">{stat.totalOrders}</span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: timeColor }}>
                            {formatTime(stat.avgPrepTime)}
                          </td>
                          <td style={{ textAlign: 'center', color: '#059669' }}>
                            {formatTime(stat.fastestTime)}
                          </td>
                          <td style={{ textAlign: 'center', color: '#dc2626' }}>
                            {formatTime(stat.slowestTime)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ 
                              padding: '0.25rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              background: stat.ordersPerHour >= 10 ? 'rgba(16, 185, 129, 0.1)' : 'var(--gray-100)',
                              color: stat.ordersPerHour >= 10 ? '#059669' : 'var(--text-secondary)',
                              fontWeight: 600,
                              fontSize: '0.875rem'
                            }}>
                              {stat.ordersPerHour > 0 ? stat.ordersPerHour : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <Timer size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p style={{ marginBottom: '0.5rem' }}>Tiada data kecepatan staff</p>
              <p style={{ fontSize: '0.875rem' }}>
                Data akan muncul apabila staff menggunakan KDS untuk track order
              </p>
            </div>
          )}
        </div>

        {/* Today's Completed Attendance */}
        {completedStaff.length > 0 && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} color="var(--primary)" />
                Selesai Bekerja Hari Ini
              </div>
              <div className="card-subtitle">{completedStaff.length} orang</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Jawatan</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Durasi</th>
                </tr>
              </thead>
              <tbody>
                {completedStaff.map(staffMember => {
                  const record = getStaffAttendanceToday(staffMember.id);
                  // Calculate duration
                  let duration = '-';
                  if (record?.clockInTime && record?.clockOutTime) {
                    const [inH, inM] = record.clockInTime.split(':').map(Number);
                    const [outH, outM] = record.clockOutTime.split(':').map(Number);
                    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    duration = `${hours}j ${minutes}m`;
                  }
                  
                  return (
                    <tr key={staffMember.id}>
                      <td style={{ fontWeight: 600 }}>{staffMember.name}</td>
                      <td>{staffMember.role}</td>
                      <td>{record?.clockInTime || '-'}</td>
                      <td>{record?.clockOutTime || '-'}</td>
                      <td>
                        <span className="badge badge-info">{duration}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
