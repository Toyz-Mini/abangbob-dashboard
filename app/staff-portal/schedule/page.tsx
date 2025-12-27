'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import StaffPortalNav from '@/components/StaffPortalNav';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Coffee,
  Calendar,
  Users,
  Sun,
  Moon
} from 'lucide-react';


export default function SchedulePage() {
  const { user } = useAuth();
  const { staff, isInitialized } = useStaff();
  const { schedules, shifts } = useStaffPortal();

  const currentStaff = useMemo(() => {
    if (!user) return null;
    return staff.find(s => s.id === user.id) || null;
  }, [user, staff]);

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
    const startStr = currentWeekStart.getFullYear() + '-' + String(currentWeekStart.getMonth() + 1).padStart(2, '0') + '-' + String(currentWeekStart.getDate()).padStart(2, '0');
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 7);
    const endStr = endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0') + '-' + String(endDate.getDate()).padStart(2, '0');

    return schedules.filter(s =>
      s.staffId === user?.id &&
      s.date >= startStr &&
      s.date < endStr
    );
  }, [schedules, currentWeekStart]);

  // Get colleagues on the same shift
  const getColleaguesOnShift = (date: string, shiftId: string) => {
    return schedules
      .filter(s => s.date === date && s.shiftId === shiftId && s.staffId !== user?.id)
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
    const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
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

  if (!isInitialized) {
    return (
      <MainLayout>
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (!currentStaff) {
    return (
      <MainLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-md">
            <h3 className="font-bold text-lg mb-2">Akses Gagal / Profil Tidak Dijumpai</h3>
            <p className="mb-4">
              Rekod staff anda tidak dapat dijumpai. Ini mungkin disebabkan oleh isu kebenaran data (RLS).
            </p>
            <div className="text-xs bg-white p-2 rounded border border-red-100 text-left font-mono">
              User ID: {user?.id}<br />
              Status: {user?.status || 'Unknown'}
            </div>
            <p className="mt-4 text-sm">
              Sila hubungi Admin untuk semakan database.
            </p>
          </div>
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

          <div className="staff-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* DEBUG INFO - Remove in production */}
            {/* <div className="text-xs font-mono bg-gray-100 p-2 mb-2 rounded overflow-auto h-24">
               DEBUG:<br/>
               User ID: {user?.id}<br/>
               Staff ID: {currentStaff?.id}<br/>
               Schedule Count (Raw): {schedules.length}<br/>
               My Schedule Count (Filtered): {myWeekSchedule.length}<br/>
               Range: {weekDates[0]?.toISOString().split('T')[0]} to {weekDates[6]?.toISOString().split('T')[0]}<br/>
            </div> */}

            {weekDates.map(date => {
              const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
              // const schedule = getScheduleForDate(date);
              // Direct find to debug if helper is issue
              const schedule = schedules.find(s =>
                s.date === dateStr &&
                s.staffId === user?.id
              );

              const shift = schedule ? shifts.find(s => s.id === schedule.shiftId) : null;
              const colleagues = schedule && shift ? getColleaguesOnShift(dateStr, shift.id) : [];
              const today = isToday(date);
              const isPast = date < new Date() && !today;

              if (!schedule) {
                // COMPACT "OFF" VIEW
                return (
                  <div
                    key={date.toISOString()}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: today ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.1), transparent)' : 'var(--gray-50)',
                      border: today ? '1px solid #6366f1' : '1px solid transparent',
                      opacity: isPast ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ fontWeight: today ? 700 : 500, color: today ? '#6366f1' : 'inherit', width: '3.5rem' }}>
                        {formatDate(date).split(' ')[0]} <span style={{ fontSize: '0.8em' }}>{date.getDate()}</span>
                      </div>
                      <div style={{ height: '1.5rem', width: '1px', background: 'var(--gray-200)' }}></div>
                      <div style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>Hari Off</div>
                    </div>
                    {today && <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">HARI INI</span>}
                  </div>
                );
              }

              // COMPACT "WORKING" VIEW
              return (
                <div
                  key={date.toISOString()}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'white',
                    border: today ? '1px solid #6366f1' : '1px solid var(--gray-200)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    opacity: isPast ? 0.8 : 1,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Left Decoration Bar */}
                  {shift && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: shift.color || '#3b82f6'
                    }} />
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                    {/* Date Column */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '3.5rem',
                      paddingRight: '0.75rem',
                      borderRight: '1px solid var(--gray-100)'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        color: today ? '#6366f1' : 'var(--text-secondary)'
                      }}>
                        {date.toLocaleDateString('ms-MY', { weekday: 'short' })}
                      </span>
                      <span style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: today ? '#6366f1' : 'var(--text-primary)'
                      }}>
                        {date.getDate()}
                      </span>
                      {today && (
                        <span className="text-[9px] font-bold text-indigo-600 mt-1">
                          HARI INI
                        </span>
                      )}
                    </div>

                    {/* Content Column */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {shift ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                              Shift {shift.name}
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{ background: `${shift.color}15`, color: shift.color }}>
                              {shift.startTime < '12:00' ? <Sun size={10} /> : <Moon size={10} />}
                              {shift.startTime} - {shift.endTime}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {Math.round(((parseInt(shift.endTime.split(':')[0]) * 60 + parseInt(shift.endTime.split(':')[1])) -
                                (parseInt(shift.startTime.split(':')[0]) * 60 + parseInt(shift.startTime.split(':')[1])) -
                                shift.breakDuration) / 60)}j kerja
                            </span>

                            {colleagues.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {colleagues.length} rakan
                              </span>
                            )}
                          </div>

                          {schedule.notes && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--gray-50)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                              Note: {schedule.notes}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-red-500 text-sm">Shift data missing</div>
                      )}
                    </div>
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
