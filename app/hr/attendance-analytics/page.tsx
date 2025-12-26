'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useStaff } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase/client';
import { formatMinutesAsTime, getBruneiToday, getDayNameMalay } from '@/lib/timezone-utils';
import {
    Users,
    Clock,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    TrendingDown,
    Calendar,
    Timer,
    UserCheck,
    UserX,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface AttendanceSummary {
    totalStaff: number;
    presentToday: number;
    lateToday: number;
    absentToday: number;
    avgLateMinutes: number;
    totalOvertimeMinutes: number;
}

interface StaffAttendanceStats {
    staffId: string;
    staffName: string;
    totalDays: number;
    presentDays: number;
    lateDays: number;
    totalLateMinutes: number;
    totalOtMinutes: number;
    attendanceRate: number;
}

interface DailyStats {
    date: string;
    present: number;
    late: number;
    absent: number;
}

export default function AttendanceAnalyticsPage() {
    const { currentStaff } = useAuth();
    const { staff } = useStaff();
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const [summary, setSummary] = useState<AttendanceSummary>({
        totalStaff: 0,
        presentToday: 0,
        lateToday: 0,
        absentToday: 0,
        avgLateMinutes: 0,
        totalOvertimeMinutes: 0,
    });
    const [staffStats, setStaffStats] = useState<StaffAttendanceStats[]>([]);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [lateReasonBreakdown, setLateReasonBreakdown] = useState<{ reason: string; count: number }[]>([]);

    // Parse month for filtering
    const [year, month] = selectedMonth.split('-').map(Number);

    useEffect(() => {
        loadAnalytics();
    }, [selectedMonth, staff]);

    async function loadAnalytics() {
        setLoading(true);
        const supabase = getSupabaseClient();
        if (!supabase) {
            setLoading(false);
            return;
        }

        const today = getBruneiToday();
        const monthStart = `${selectedMonth}-01`;
        const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];

        try {
            // Fetch attendance records for the month
            const { data: attendance, error } = await supabase
                .from('attendance')
                .select('*')
                .gte('date', monthStart)
                .lte('date', monthEnd);

            if (error) throw error;

            // Calculate today's summary
            const todayRecords = (attendance || []).filter((a: any) => a.date === today);
            const presentToday = todayRecords.length;
            const lateToday = todayRecords.filter((a: any) => a.is_late).length;
            const absentToday = Math.max(0, staff.length - presentToday);

            // Calculate averages
            const lateRecords = (attendance || []).filter((a: any) => a.is_late);
            const avgLateMinutes = lateRecords.length > 0
                ? Math.round(lateRecords.reduce((sum: number, a: any) => sum + (a.late_minutes || 0), 0) / lateRecords.length)
                : 0;

            const totalOt = (attendance || []).reduce((sum: number, a: any) => sum + (a.overtime_minutes || 0), 0);

            setSummary({
                totalStaff: staff.length,
                presentToday,
                lateToday,
                absentToday,
                avgLateMinutes,
                totalOvertimeMinutes: totalOt,
            });

            // Calculate per-staff stats
            const staffMap: Record<string, StaffAttendanceStats> = {};
            staff.forEach(s => {
                staffMap[s.id] = {
                    staffId: s.id,
                    staffName: s.name,
                    totalDays: 0,
                    presentDays: 0,
                    lateDays: 0,
                    totalLateMinutes: 0,
                    totalOtMinutes: 0,
                    attendanceRate: 0,
                };
            });

            (attendance || []).forEach((a: any) => {
                if (staffMap[a.staff_id]) {
                    staffMap[a.staff_id].presentDays++;
                    if (a.is_late) {
                        staffMap[a.staff_id].lateDays++;
                        staffMap[a.staff_id].totalLateMinutes += a.late_minutes || 0;
                    }
                    staffMap[a.staff_id].totalOtMinutes += a.overtime_minutes || 0;
                }
            });

            // Calculate working days in month (exclude Sundays)
            const workingDays = getWorkingDaysInMonth(year, month);
            Object.values(staffMap).forEach(s => {
                s.totalDays = workingDays;
                s.attendanceRate = s.totalDays > 0 ? Math.round((s.presentDays / s.totalDays) * 100) : 0;
            });

            setStaffStats(Object.values(staffMap).sort((a, b) => b.attendanceRate - a.attendanceRate));

            // Daily stats for chart
            const dailyMap: Record<string, DailyStats> = {};
            (attendance || []).forEach((a: any) => {
                if (!dailyMap[a.date]) {
                    dailyMap[a.date] = { date: a.date, present: 0, late: 0, absent: 0 };
                }
                dailyMap[a.date].present++;
                if (a.is_late) dailyMap[a.date].late++;
            });
            setDailyStats(Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)));

            // Late reason breakdown
            const reasonMap: Record<string, number> = {};
            lateRecords.forEach((a: any) => {
                const reason = a.late_reason_code || 'UNKNOWN';
                reasonMap[reason] = (reasonMap[reason] || 0) + 1;
            });
            setLateReasonBreakdown(
                Object.entries(reasonMap)
                    .map(([reason, count]) => ({ reason, count }))
                    .sort((a, b) => b.count - a.count)
            );

        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    }

    function getWorkingDaysInMonth(year: number, month: number): number {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        let count = 0;
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            if (d.getDay() !== 0) count++; // Exclude Sundays
        }
        return count;
    }

    function changeMonth(delta: number) {
        const d = new Date(year, month - 1 + delta, 1);
        setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const reasonLabels: Record<string, string> = {
        TRAFFIC: '🚗 Traffic',
        MEDICAL: '🏥 Medical',
        FAMILY: '🏠 Family',
        TRANSPORT: '🚌 Transport',
        WEATHER: '🌧️ Weather',
        VEHICLE: '🔧 Vehicle',
        OTHER: '📝 Other',
        UNKNOWN: '❓ Unknown',
    };

    if (!currentStaff || currentStaff.role !== 'Manager') {
        return (
            <MainLayout>
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                    <AlertTriangle size={48} style={{ color: 'var(--warning)', marginBottom: '1rem' }} />
                    <h2>Akses Terhad</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Hanya Manager boleh melihat analytics.</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="animate-fade-in">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            Analitik Kehadiran
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Pantau kehadiran, kelewatan, dan overtime staff
                        </p>
                    </div>

                    {/* Month Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => changeMonth(-1)}>
                            <ChevronLeft size={16} />
                        </button>
                        <div style={{ minWidth: '150px', textAlign: 'center', fontWeight: 600 }}>
                            {new Date(year, month - 1).toLocaleDateString('ms-MY', { year: 'numeric', month: 'long' })}
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => changeMonth(1)}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
                            <div className="card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ padding: '0.75rem', background: 'var(--success-light)', borderRadius: 'var(--radius-md)' }}>
                                        <UserCheck size={24} style={{ color: 'var(--success)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hadir Hari Ini</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary.presentToday}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ padding: '0.75rem', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)' }}>
                                        <Clock size={24} style={{ color: 'var(--warning)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lewat Hari Ini</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary.lateToday}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ padding: '0.75rem', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)' }}>
                                        <UserX size={24} style={{ color: 'var(--danger)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tidak Hadir</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary.absentToday}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ padding: '0.75rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
                                        <Timer size={24} style={{ color: 'var(--primary)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Jumlah OT</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                            {formatMinutesAsTime(summary.totalOvertimeMinutes)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1.5rem' }}>
                            {/* Staff Ranking */}
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <TrendingUp size={20} />
                                        Ranking Kehadiran
                                    </div>
                                    <div className="card-subtitle">Berdasarkan kadar kehadiran bulan ini</div>
                                </div>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {staffStats.map((stat, idx) => (
                                        <div
                                            key={stat.staffId}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '0.75rem 1rem',
                                                borderBottom: '1px solid var(--gray-100)',
                                            }}
                                        >
                                            <div style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: idx < 3 ? 'var(--success)' : 'var(--gray-200)',
                                                color: idx < 3 ? 'white' : 'var(--text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                            }}>
                                                {idx + 1}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500 }}>{stat.staffName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {stat.presentDays}/{stat.totalDays} hari • {stat.lateDays} lewat
                                                </div>
                                            </div>
                                            <div style={{
                                                fontWeight: 700,
                                                color: stat.attendanceRate >= 90 ? 'var(--success)' :
                                                    stat.attendanceRate >= 70 ? 'var(--warning)' : 'var(--danger)'
                                            }}>
                                                {stat.attendanceRate}%
                                            </div>
                                        </div>
                                    ))}
                                    {staffStats.length === 0 && (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            Tiada data kehadiran
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Late Reason Breakdown */}
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <AlertTriangle size={20} />
                                        Sebab Kelewatan
                                    </div>
                                    <div className="card-subtitle">Breakdown kategori kelewatan</div>
                                </div>
                                <div>
                                    {lateReasonBreakdown.length > 0 ? (
                                        lateReasonBreakdown.map((item) => {
                                            const totalLate = lateReasonBreakdown.reduce((sum, i) => sum + i.count, 0);
                                            const percent = Math.round((item.count / totalLate) * 100);
                                            return (
                                                <div key={item.reason} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--gray-100)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <span>{reasonLabels[item.reason] || item.reason}</span>
                                                        <span style={{ fontWeight: 600 }}>{item.count} ({percent}%)</span>
                                                    </div>
                                                    <div style={{ height: '6px', background: 'var(--gray-100)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${percent}%`,
                                                            height: '100%',
                                                            background: 'var(--warning)',
                                                            transition: 'width 0.3s ease',
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            <CheckCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                            <p>Tiada rekod kelewatan bulan ini 🎉</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Monthly Stats Summary */}
                        <div className="card" style={{ marginTop: '1.5rem' }}>
                            <div className="card-header">
                                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={20} />
                                    Ringkasan Bulanan
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{staff.length}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Jumlah Staff</div>
                                </div>
                                <div style={{ padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{dailyStats.reduce((sum, d) => sum + d.present, 0)}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Kehadiran</div>
                                </div>
                                <div style={{ padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{dailyStats.reduce((sum, d) => sum + d.late, 0)}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Lewat</div>
                                </div>
                                <div style={{ padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{summary.avgLateMinutes}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Purata Lewat (min)</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
}
