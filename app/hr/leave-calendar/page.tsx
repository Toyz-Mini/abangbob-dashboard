'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { getLeaveTypeLabel } from '@/lib/staff-portal-data';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Plane,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { fetchPublicHolidays } from '@/lib/supabase/operations';
import { usePublicHolidaysRealtime } from '@/lib/supabase/realtime-hooks';
import { PublicHoliday } from '@/lib/types';

export default function LeaveCalendarPage() {
  const { staff, isInitialized } = useStaff();
  const { leaveRequests } = useStaffPortal();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const { currentStaff } = useAuth();
  const isAdmin = currentStaff?.role === 'Admin' || currentStaff?.role === 'Manager';

  const loadHolidays = useCallback(async () => {
    const data = await fetchPublicHolidays();
    setPublicHolidays(data);
  }, []);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  usePublicHolidaysRealtime(loadHolidays);

  // Get approved leaves for the current month
  const monthLeaves = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];

    return leaveRequests.filter(l =>
      l.status === 'approved' &&
      l.startDate <= endOfMonth &&
      l.endDate >= startOfMonth
    );
  }, [leaveRequests, currentMonth]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  // Get leaves for a specific date
  const getLeavesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return monthLeaves.filter(l =>
      l.startDate <= dateStr && l.endDate >= dateStr
    );
  };

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const dayNames = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];

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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Kalendar Cuti Team
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Lihat siapa yang bercuti
            </p>
          </div>

          {isAdmin && (
            <Link href="/hr/public-holidays" className="btn btn-outline">
              <Settings size={18} />
              Tetapan Cuti Umum
            </Link>
          )}
        </div>

        {/* Month Navigation */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button className="btn btn-outline btn-sm" onClick={goToPreviousMonth}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                {currentMonth.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}
              </div>
              <button
                className="btn btn-sm btn-outline"
                onClick={goToCurrentMonth}
                style={{ marginTop: '0.5rem' }}
              >
                Bulan Ini
              </button>
            </div>
            <button className="btn btn-outline btn-sm" onClick={goToNextMonth}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={32} />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{staff.filter(s => s.status === 'active').length}</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Staf Aktif</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Plane size={32} />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{monthLeaves.length}</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Cuti Bulan Ini</div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} />
              Kalendar
            </div>
          </div>

          {/* Day Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            marginBottom: '2px'
          }}>
            {dayNames.map(day => (
              <div
                key={day}
                style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--gray-100)'
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px'
          }}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${index}`}
                    style={{
                      minHeight: '80px',
                      background: 'var(--gray-50)'
                    }}
                  />
                );
              }

              const dayLeaves = getLeavesForDate(date);
              const today = isToday(date);

              return (
                <div
                  key={date.toISOString()}
                  style={{
                    minHeight: '80px',
                    padding: '0.5rem',
                    background: today ? '#dbeafe' : 'var(--gray-50)',
                    border: today ? '2px solid var(--primary)' : 'none'
                  }}
                >
                  <div style={{
                    fontWeight: today ? 700 : 500,
                    fontSize: '0.875rem',
                    color: today ? 'var(--primary)' : 'inherit',
                    marginBottom: '0.25rem'
                  }}>
                    {date.getDate()}
                  </div>

                  {/* Public Holiday */}
                  {publicHolidays.filter(h => h.date === date.toISOString().split('T')[0]).map(holiday => (
                    <div
                      key={holiday.id}
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.125rem 0.25rem',
                        borderRadius: '2px',
                        background: '#ef4444',
                        color: 'white',
                        marginBottom: '0.125rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={holiday.name}
                    >
                      🎉 {holiday.name}
                    </div>
                  ))}

                  {dayLeaves.slice(0, 2).map(leave => (
                    <div
                      key={leave.id}
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.125rem 0.25rem',
                        borderRadius: '2px',
                        background: leave.type === 'medical' ? '#fee2e2' : leave.type === 'annual' ? '#dcfce7' : '#fef3c7',
                        color: leave.type === 'medical' ? '#991b1b' : leave.type === 'annual' ? '#166534' : '#92400e',
                        marginBottom: '0.125rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={`${leave.staffName} - ${getLeaveTypeLabel(leave.type)}`}
                    >
                      {leave.staffName.split(' ')[0]}
                    </div>
                  ))}

                  {dayLeaves.length > 2 && (
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-light)' }}>
                      +{dayLeaves.length - 2} lagi
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Petunjuk</div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '16px', height: '16px', background: '#dcfce7', borderRadius: '2px' }} />
              <span style={{ fontSize: '0.875rem' }}>Cuti Tahunan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '16px', height: '16px', background: '#fee2e2', borderRadius: '2px' }} />
              <span style={{ fontSize: '0.875rem' }}>Cuti Sakit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '16px', height: '16px', background: '#fef3c7', borderRadius: '2px' }} />
              <span style={{ fontSize: '0.875rem' }}>Cuti Lain</span>
            </div>
          </div>
        </div>

        {/* This Month's Leaves List */}
        {monthLeaves.length > 0 && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plane size={20} />
                Cuti Bulan Ini
              </div>
              <div className="card-subtitle">{monthLeaves.length} cuti diluluskan</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {monthLeaves.map(leave => (
                <div
                  key={leave.id}
                  style={{
                    padding: '0.75rem',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{leave.staffName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {getLeaveTypeLabel(leave.type)} - {leave.duration} hari
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {leave.startDate} - {leave.endDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}




