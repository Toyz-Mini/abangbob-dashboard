'use client';

import MainLayout from '@/components/MainLayout';
import { useStaff, useKPI, useOrders } from '@/lib/store';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import Link from 'next/link';
import { Users, Zap, List, Clock, DollarSign, BarChart3, UserPlus, CheckCircle, Trophy, TrendingUp, Award, Crown, Timer, Gauge, Medal, Calendar, ClipboardList } from 'lucide-react';
import StatCard from '@/components/StatCard';
import LivePageHeader from '@/components/LivePageHeader';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getRankTier, getScoreColor } from '@/lib/kpi-data';
import { Order } from '@/lib/types';
import { useMemo, useCallback } from 'react';
import { useStaffRealtime, useAttendanceRealtime } from '@/lib/supabase/realtime-hooks';

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
  const { staff, attendance, getStaffAttendanceToday, isInitialized, refreshStaff, refreshAttendance } = useStaff();
  const { getKPILeaderboard, staffKPI } = useKPI();
  const { orders } = useOrders();
  const { t, language } = useTranslation();

  // Realtime Subscriptions
  useStaffRealtime(useCallback(() => {
    console.log('Staff Sync');
    refreshStaff();
  }, [refreshStaff]));

  useAttendanceRealtime(useCallback(() => {
    console.log('Attendance Sync');
    refreshAttendance();
  }, [refreshAttendance]));

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
        <div className="flex justify-center items-center min-h-[50vh]">
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
             <GlassCard className="animate-slide-up">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-green-500/10 rounded-lg text-success">
                     <Users size={20} />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold">Live Roster</h3>
                     <div className="text-sm text-gray-500">{onDutyStaff.length} staf sedang bertugas</div>
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
                       <div key={staffMember.id} className="hover-lift flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 border-l-4 border-l-success">
                         <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xl">
                           {staffMember.name.substring(0, 2).toUpperCase()}
                         </div>
                         <div className="flex-1">
                           <div className="font-bold text-base">{staffMember.name}</div>
                           <div className="text-sm text-gray-500">{staffMember.role}</div>
                           <div className="flex items-center gap-1.5 mt-1 text-xs text-success">
                             <Clock size={12} /> Live sejak {record?.clockInTime || '-'}
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="text-center p-12 bg-gray-100 dark:bg-white/5 rounded-lg">
                   <p className="text-gray-500 mb-4">Tiada staf bekerja pada masa ini</p>
                   <Link href="/hr/timeclock">
                     <PremiumButton size="sm" icon={Clock}>Pergi ke Clock In</PremiumButton>
                   </Link>
                 </div>
               )}
             </GlassCard>

             {/* HR Hub - All Features */}
             <GlassCard className="animate-slide-up">
               <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                 <Zap size={20} color="var(--warning)" /> Modul HR & Staf
               </h3>

              {/* Pengurusan Staf */}
               <div className="mb-6">
                 <div className="section-header">
                   👥 Pengurusan Staf
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                   <Link href="/hr/staff">
                     <div className="feature-card hover-lift">
                       <div className="feature-icon">
                         <List size={20} />
                       </div>
                       <div className="feature-card-label">Senarai Staf</div>
                     </div>
                   </Link>
                   <Link href="/hr/timeclock">
                     <div className="feature-card hover-lift">
                       <div className="feature-icon">
                         <Clock size={20} />
                       </div>
                       <div className="feature-card-label">Timeclock</div>
                     </div>
                   </Link>
                   <Link href="/hr/schedule">
                     <div className="feature-card hover-lift">
                       <div className="feature-icon">
                         <Calendar size={20} />
                       </div>
                       <div className="feature-card-label">Jadual Shift</div>
                     </div>
                   </Link>
                   <Link href="/hr/kpi">
                     <div className="feature-card hover-lift">
                       <div className="feature-icon">
                         <Trophy size={20} />
                       </div>
                       <div className="feature-card-label">KPI</div>
                     </div>
                   </Link>
                   <Link href="/hr/attendance-log">
                     <div className="feature-card feature-card-highlight hover-lift">
                       <div className="feature-icon feature-icon-success">
                         <ClipboardList size={20} />
                       </div>
                       <div className="feature-card-label">Log Kehadiran</div>
                     </div>
                   </Link>
                </div>
              </div>

              {/* Kelulusan */}
              <div className="mb-6">
                <div className="section-header">
                  ✅ Kelulusan & Permohonan
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Link href="/hr/pending-users">
                    <div className="feature-card feature-card-warning hover-lift">
                      <div className="feature-icon feature-icon-warning">
                        <UserPlus size={20} />
                      </div>
                      <div className="feature-card-label">Pending Users</div>
                    </div>
                  </Link>
                  <Link href="/hr/approvals?tab=leave">
                    <div className="feature-card hover-lift">
                      <div className="feature-icon feature-icon-success">
                        <Calendar size={20} />
                      </div>
                      <div className="feature-card-label">Cuti</div>
                    </div>
                  </Link>
                  <Link href="/hr/approvals?tab=claims">
                    <div className="feature-card hover-lift">
                      <div className="feature-icon feature-icon-success">
                        <CheckCircle size={20} />
                      </div>
                      <div className="feature-card-label">Approval</div>
                    </div>
                  </Link>
                  <Link href="/hr/approvals?tab=ot">
                    <div className="feature-card hover-lift">
                      <div className="feature-icon feature-icon-success">
                        <Clock size={20} />
                      </div>
                      <div className="feature-card-label">OT</div>
                    </div>
                  </Link>
                  <Link href="/hr/refund-approvals">
                    <div className="feature-card hover-lift">
                      <div className="feature-icon feature-icon-success">
                        <BarChart3 size={20} />
                      </div>
                      <div className="feature-card-label">Void/Refund</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Cuti & Gaji */}
              <div className="mb-6">
                <div className="section-header">
                  💰 Cuti & Kewangan
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Link href="/hr/leave-calendar">
                    <div className="feature-card hover-lift">
                      <div className="feature-icon feature-icon-warning">
                        <Calendar size={20} />
                      </div>
                      <div className="feature-card-label">Kalendar Cuti</div>
                    </div>
                  </Link>
                  <Link href="/hr/leave-settings">
                    <div className="feature-card hover-lift">
                      <div className="feature-icon feature-icon-warning">
                        <List size={20} />
                      </div>
                      <div className="feature-card-label">Tetapan Cuti</div>
                    </div>
                  </Link>
                  <Link href="/finance/payroll">
                    <div className="feature-card hover-lift">
                      <div className="feature-icon feature-icon-warning">
                        <DollarSign size={20} />
                      </div>
                      <div className="feature-card-label">Payroll</div>
                    </div>
                  </Link>
                  <Link href="/hr/ot-report">
                    <div className="feature-card hover-lift">
                      <div className="feature-icon feature-icon-warning">
                        <Clock size={20} />
                      </div>
                      <div className="feature-card-label">Laporan OT</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Rekod & Dokumen */}
              <div>
                <div className="section-header">
                  📋 Rekod & Dokumen
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Link href="/hr/performance">
                    <div className="feature-card hover-lift">
                      <div className="feature-icon feature-icon-neutral">
                        <TrendingUp size={20} />
                      </div>
                      <div className="feature-card-label">Prestasi</div>
                    </div>
                  </Link>
                  <Link href="/hr/training">
                    <div className="feature-card hover-lift">
                      <div className="feature-icon feature-icon-neutral">
                        <Award size={20} />
                      </div>
                      <div className="feature-card-label">Training</div>
                    </div>
                  </Link>
                  <Link href="/hr/documents">
                    <div className="feature-card hover-lift">
                      <div className="feature-icon feature-icon-neutral">
                        <List size={20} />
                      </div>
                      <div className="feature-card-label">Dokumen</div>
                    </div>
                  </Link>
                  <Link href="/hr/disciplinary">
                    <div className="feature-card hover-lift">
                      <div className="feature-icon feature-icon-neutral">
                        <Users size={20} />
                      </div>
                      <div className="feature-card-label">Disiplin</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* More Features Row */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  <Link href="/hr/onboarding" className="text-xs text-gray-500 text-center p-2">
                    Onboarding
                  </Link>
                  <Link href="/hr/exit-interview" className="text-xs text-gray-500 text-center p-2">
                    Exit Interview
                  </Link>
                  <Link href="/hr/complaints" className="text-xs text-gray-500 text-center p-2">
                    Aduan
                  </Link>
                  <Link href="/hr/checklist-config" className="text-xs text-gray-500 text-center p-2">
                    Checklist
                  </Link>
                  <Link href="/hr/approvals?tab=advance" className="text-xs text-gray-500 text-center p-2">
                    Salary Advance
                  </Link>
                  <Link href="/hr/staff/new" className="text-xs text-primary text-center p-2 font-semibold">
                    + Tambah Staf
                  </Link>
                </div>
              </div>
            </GlassCard>

             {/* Staff Speed Analytics */}
             <GlassCard className="animate-slide-up">
               <div className="flex items-center gap-3 mb-6">
                 <Timer size={22} color="var(--primary)" />
                 <div>
                   <h3 className="text-lg font-bold">Prestasi Kecepatan</h3>
                   <div className="text-sm text-gray-500">Analitik KDS Live</div>
                 </div>
               </div>

               {/* Speed Metrics */}
               <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="text-center p-4 bg-gray-100 dark:bg-white/5 rounded-md">
                   <div className="text-xs text-gray-500">Purata Masa</div>
                   <div className="text-xl font-bold text-primary">{overallSpeedMetrics.avgPrepTime > 0 ? formatTime(overallSpeedMetrics.avgPrepTime) : '-'}</div>
                 </div>
                 <div className="text-center p-4 bg-gray-100 dark:bg-white/5 rounded-md">
                   <div className="text-xs text-gray-500">Orders</div>
                   <div className="text-xl font-bold text-success">{overallSpeedMetrics.totalOrders}</div>
                 </div>
                 <div className="text-center p-4 bg-gray-100 dark:bg-white/5 rounded-md">
                   <div className="text-xs text-gray-500">Terpantas</div>
                   <div className="text-xl font-bold text-warning">{overallSpeedMetrics.fastestStaff?.staffName || '-'}</div>
                 </div>
               </div>

               {/* Table */}
               {staffSpeedStats.length > 0 ? (
                 <div className="overflow-x-auto">
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
                           <td className="font-semibold">{stat.staffName}</td>
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
             <GlassCard gradient="primary" className="animate-slide-up">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                   <Trophy size={18} color="var(--primary)" /> <span className="font-bold">KPI Leaderboard</span>
                 </div>
                 <Link href="/hr/kpi" className="text-sm text-primary underline">Lihat Semua</Link>
               </div>

               {leaderboard.length > 0 ? (
                 <div className="flex flex-col gap-3">
                   {leaderboard.slice(0, 3).map((kpi, idx) => {
                     const staffInfo = staff.find(s => s.id === kpi.staffId);
                     const medals = ['🥇', '🥈', '🥉'];
                     return (
                       <div key={kpi.id} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-white/5 rounded-md border border-gray-200 dark:border-white/10">
                         <span className="text-xl">{medals[idx]}</span>
                         <div className="flex-1">
                           <div className="font-semibold text-sm text-gray-900 dark:text-white">{staffInfo?.name}</div>
                           <div className="text-xs text-gray-500">Score: {kpi.overallScore}%</div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="text-center p-4 text-gray-500">Tiada data KPI bulan ini</div>
               )}
            </GlassCard>

             {/* Completed Attendance */}
             {completedStaff.length > 0 && (
               <GlassCard className="animate-slide-up">
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

             {/* Overtime Report */}
             <GlassCard className="animate-slide-up">
               <div className="card-header border-b border-gray-100 pb-2 mb-2">
                 <div className="card-title text-base flex items-center gap-2">
                   <Clock size={16} color="var(--warning)" /> Overtime Report
                 </div>
               </div>
               <div className="flex flex-col gap-2">
                 {/* Calculate overtime for completed staff */}
                 {(() => {
                   const overtimeData = completedStaff.map(staffMember => {
                     const record = getStaffAttendanceToday(staffMember.id);
                     if (!record?.clockInTime || !record?.clockOutTime) return null;
 
                     // Parse times (assume HH:MM format)
                     const parseTime = (timeStr: string) => {
                       const [hours, minutes] = timeStr.split(':').map(Number);
                       return hours * 60 + minutes;
                     };
 
                     const clockIn = parseTime(record.clockInTime);
                     const clockOut = parseTime(record.clockOutTime);
                     const totalMinutes = clockOut - clockIn;
                     const regularMinutes = 8 * 60; // 8 hours regular
                     const overtimeMinutes = Math.max(0, totalMinutes - regularMinutes);
 
                     return {
                       name: staffMember.name,
                       totalHours: (totalMinutes / 60).toFixed(1),
                       overtimeHours: (overtimeMinutes / 60).toFixed(1),
                       overtimeMinutes,
                       rate: staffMember.overtimeRate || 1.5
                     };
                   }).filter(Boolean).filter((d: any) => d.overtimeMinutes > 0) as any[];

                   if (overtimeData.length === 0) {
                     return (
                       <div className="text-center text-secondary py-4 text-sm">
                         Tiada overtime hari ini
                       </div>
                     );
                   }

                   const totalOvertimeHours = overtimeData.reduce((sum: number, d: any) => sum + parseFloat(d.overtimeHours), 0);

                   return (
                     <>
                       {overtimeData.slice(0, 5).map((data: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-center text-sm p-2 rounded bg-warning-light">
                           <span className="font-medium">{data.name}</span>
                           <div className="text-right">
                             <div className="font-semibold text-warning">
                               +{data.overtimeHours}j OT
                             </div>
                             <div className="text-xs text-gray-500">
                               Total: {data.totalHours}j @ {data.rate}x
                             </div>
                           </div>
                         </div>
                       ))}
                       <div className="mt-2 p-3 bg-gray-100 dark:bg-white/5 rounded-md flex justify-between items-center">
                         <span className="font-semibold text-sm">Total OT Hari Ini</span>
                         <span className="font-bold text-warning text-xl">
                           {totalOvertimeHours.toFixed(1)} jam
                         </span>
                       </div>
                     </>
                   );
                 })()}
               </div>
             </GlassCard>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
