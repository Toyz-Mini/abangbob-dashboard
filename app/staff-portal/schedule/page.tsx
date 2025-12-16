'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import StaffPortalNav from '@/components/StaffPortalNav';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Sun,
  Moon,
  ArrowLeft,
  Coffee
} from 'lucide-react';

// Demo: Using staff ID 2 (Siti Nurhaliza) as the logged-in user
const CURRENT_STAFF_ID = '2';

export default function MySchedulePage() {
  const { staff, isInitialized } = useStaff();
  const { schedules, shifts } = useStaffPortal();

  const currentStaff = staff.find(s => s.id === CURRENT_STAFF_ID);

  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Get week dates
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeekStart]);

  // Get my schedule for the week
  const myWeekSchedule = useMemo(() => {
    const startStr = currentWeekStart.toISOString().split('T')[0];
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 7);
    const endStr = endDate.toISOString().split('T')[0];

    return schedules.filter(s =>
      s.staffId === CURRENT_STAFF_ID &&
      s.date >= startStr &&
      s.date < endStr
    );
  }, [schedules, currentWeekStart]);

  // Get colleagues on the same shift
  const getColleaguesOnShift = (date: string, shiftId: string) => {
    return schedules
      .filter(s => s.date === date && s.shiftId === shiftId && s.staffId !== CURRENT_STAFF_ID)
      .map(s => {
        const colleague = staff.find(st => st.id === s.staffId);
        return colleague?.name || s.staffName;
      });
  };

  // Navigation
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getScheduleForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return myWeekSchedule.find(s => s.date === dateStr);
  };

  // Calculate total hours for the week
  const weeklyHours = useMemo(() => {
    let totalMinutes = 0;
    myWeekSchedule.forEach(entry => {
      const shift = shifts.find(s => s.id === entry.shiftId);
      if (shift) {
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        totalMinutes += (endH * 60 + endM) - (startH * 60 + startM) - shift.breakDuration;
      }
    });
    return Math.round(totalMinutes / 60 * 10) / 10;
  }, [myWeekSchedule, shifts]);

  if (!isInitialized || !currentStaff) {
    return (
      <MainLayout>
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="staff-portal animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/staff-portal" className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-2" style={{ marginBottom: '0.5rem', transition: 'color 0.2s' }}>
              <ArrowLeft size={18} />
              Kembali ke Portal
            </Link>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>
              Jadual Kerja Saya
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Lihat jadual shift mingguan anda
            </p>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={goToPreviousWeek}>
              <ChevronLeft size={18} />
              <span className="hide-mobile">Minggu Lepas</span>
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {weekDates[0].toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })} - {' '}
                {weekDates[6].toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <button
                className="btn btn-sm btn-outline"
                onClick={goToCurrentWeek}
                style={{ marginTop: '0.5rem' }}
              >
                Minggu Ini
              </button>
            </div>
            <button className="btn btn-outline btn-sm" onClick={goToNextWeek}>
              <span className="hide-mobile">Minggu Depan</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 staff-stagger" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="staff-stat-card primary">
            <div className="staff-stat-icon primary">
              <Calendar size={24} />
            </div>
            <div className="staff-stat-value">{myWeekSchedule.length}</div>
            <div className="staff-stat-label">Hari Bekerja</div>
          </div>

          <div className="staff-stat-card success">
            <div className="staff-stat-icon success">
              <Clock size={24} />
            </div>
            <div className="staff-stat-value">{weeklyHours}h</div>
            <div className="staff-stat-label">Jumlah Jam</div>
          </div>

          <div className="staff-stat-card cool">
            <div className="staff-stat-icon cool">
              <Coffee size={24} />
            </div>
            <div className="staff-stat-value">{7 - myWeekSchedule.length}</div>
            <div className="staff-stat-label">Hari Off</div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} />
              Jadual Minggu Ini
            </div>
          </div>

          <div className="staff-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {weekDates.map(date => {
              const schedule = getScheduleForDate(date);
              const shift = schedule ? shifts.find(s => s.id === schedule.shiftId) : null;
              const colleagues = schedule && shift ? getColleaguesOnShift(date.toISOString().split('T')[0], shift.id) : [];
              const today = isToday(date);
              const isPast = date < new Date() && !today;

              return (
                <div
                  key={date.toISOString()}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    background: today
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                      : schedule ? 'var(--gray-50)' : 'transparent',
                    border: today ? '2px solid #6366f1' : '1px solid var(--gray-200)',
                    opacity: isPast ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: '100px' }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: today ? '1.1rem' : '1rem',
                        color: today ? '#6366f1' : 'inherit'
                      }}>
                        {formatDate(date)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {date.toLocaleDateString('ms-MY', { month: 'short' })}
                      </div>
                      {today && (
                        <span className="badge badge-info" style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>
                          HARI INI
                        </span>
                      )}
                    </div>

                    {schedule && shift ? (
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          background: `${shift.color}15`,
                          borderLeft: `4px solid ${shift.color}`,
                          borderRadius: 'var(--radius-md)'
                        }}>
                          {shift.startTime < '12:00' ? (
                            <Sun size={20} color={shift.color} />
                          ) : (
                            <Moon size={20} color={shift.color} />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: shift.color }}>
                              Shift {shift.name}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {shift.startTime} - {shift.endTime}
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                                ({Math.round(((parseInt(shift.endTime.split(':')[0]) * 60 + parseInt(shift.endTime.split(':')[1])) -
                                  (parseInt(shift.startTime.split(':')[0]) * 60 + parseInt(shift.startTime.split(':')[1])) -
                                  shift.breakDuration) / 60)}j kerja)
                              </span>
                            </div>
                          </div>
                        </div>

                        {colleagues.length > 0 && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={14} color="var(--text-secondary)" />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Bersama: {colleagues.slice(0, 3).join(', ')}{colleagues.length > 3 ? ` +${colleagues.length - 3}` : ''}
                            </span>
                          </div>
                        )}

                        {schedule.notes && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Nota: {schedule.notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        flex: 1,
                        padding: '1rem',
                        textAlign: 'center',
                        color: 'var(--text-light)',
                        background: 'var(--gray-100)',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <Coffee size={24} color="var(--gray-400)" style={{ marginBottom: '0.25rem' }} />
                        <div style={{ fontWeight: 500 }}>Hari Off</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        {shifts.length > 0 && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title">Shift Templates</div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {shifts.map(shift => (
                <div
                  key={shift.id}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: `${shift.color}15`,
                    borderLeft: `4px solid ${shift.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {shift.startTime < '12:00' ? (
                    <Sun size={16} color={shift.color} />
                  ) : (
                    <Moon size={16} color={shift.color} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: shift.color }}>
                      {shift.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {shift.startTime} - {shift.endTime}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <StaffPortalNav currentPage="schedule" />
      </div>
    </MainLayout>
  );
}
