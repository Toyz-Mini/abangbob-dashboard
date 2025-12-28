'use client';

import { useState, useMemo } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Users,
  Sun,
  Moon,
  Coffee,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  }, [schedules, currentWeekStart, user?.id]);

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
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
      <StaffLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </StaffLayout>
    );
  }

  if (!currentStaff) {
    return (
      <StaffLayout>
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-red-50 text-red-600 p-8 rounded-2xl max-w-md shadow-sm border border-red-100">
            <h3 className="font-bold text-xl mb-3">Akses Gagal</h3>
            <p className="mb-6 text-red-700/80 leading-relaxed">
              Rekod staff anda tidak dapat dijumpai. Sila hubungi Admin untuk bantuan.
            </p>
            <div className="text-xs bg-white/50 p-4 rounded-xl border border-red-100 text-left font-mono text-red-500">
              User ID: {user?.id}<br />
              Status: {user?.status || 'Unknown'}
            </div>
          </div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="max-w-md mx-auto sm:max-w-2xl lg:max-w-4xl animate-fade-in pb-20 pt-4 px-4 sm:px-6">

        {/* Header Section - Modern & Clean */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Jadual Kerja</h1>
              <p className="text-sm text-gray-500 font-medium">Mingguan anda</p>
            </div>

            <button
              onClick={goToCurrentWeek}
              className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-xl text-xs font-semibold text-gray-700 active:scale-95 transition-all hover:bg-gray-50 flex items-center gap-2"
            >
              <Calendar className="w-3.5 h-3.5" />
              Minggu Ini
            </button>
          </div>

          {/* Week Navigation Pill */}
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex items-center justify-between">
            <button
              onClick={goToPreviousWeek}
              className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="text-center">
              <span className="block text-sm font-bold text-gray-900">
                {weekDates[0].toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                {' - '}
                {weekDates[6].toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
              </span>
              <span className="text-xs text-gray-400 font-medium">{weekDates[6].getFullYear()}</span>
            </div>

            <button
              onClick={goToNextWeek}
              className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        {/* Metrics Overview - Compact Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm flex flex-col items-center justify-center gap-1 group">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-xl mb-1 group-hover:scale-110 transition-transform">
              <Briefcase size={18} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{myWeekSchedule.length}</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Kerja</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-50 shadow-sm flex flex-col items-center justify-center gap-1 group">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl mb-1 group-hover:scale-110 transition-transform">
              <Clock size={18} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{weeklyHours}h</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Jam</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-50 shadow-sm flex flex-col items-center justify-center gap-1 group">
            <div className="bg-amber-50 text-amber-600 p-2 rounded-xl mb-1 group-hover:scale-110 transition-transform">
              <Coffee size={18} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{7 - myWeekSchedule.length}</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Cuti</span>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-3">
          {weekDates.map((date, index) => {
            const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
            const schedule = schedules.find(s => s.date === dateStr && s.staffId === user?.id);
            const shift = schedule ? shifts.find(s => s.id === schedule.shiftId) : null;
            const colleagues = schedule && shift ? getColleaguesOnShift(dateStr, shift.id) : [];
            const today = isToday(date);
            const isPast = date < new Date() && !today;

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isPast ? 0.6 : 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={date.toISOString()}
                className={cn(
                  "relative overflow-hidden rounded-2xl transition-all",
                  !schedule
                    ? "bg-transparent border border-transparent p-2"
                    : "bg-white shadow-sm border border-gray-100 p-0"
                )}
              >
                {!schedule ? (
                  // OFF DAY VIEW
                  <div className="flex items-center justify-between py-2 px-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn("text-sm font-semibold w-12", today ? "text-primary" : "text-gray-400")}>
                        {date.toLocaleDateString('ms-MY', { weekday: 'short' })}
                        <span className="ml-1 opacity-60 text-xs font-normal">{date.getDate()}</span>
                      </div>
                      <div className="h-8 w-[1px] bg-gray-200/60 mx-1"></div>
                      <span className="text-sm font-medium text-gray-400 italic">Cuti / Off Day</span>
                    </div>
                    {today && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">HARI INI</span>}
                  </div>
                ) : (
                  // WORKING DAY VIEW
                  <div className="flex">
                    {/* Color Bar */}
                    <div
                      className="w-1.5 shrink-0"
                      style={{ backgroundColor: shift?.color || '#cbd5e1' }}
                    />

                    <div className="flex-1 p-4 pl-4 sm:pl-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {/* Date Badge */}
                          <div className={cn(
                            "flex flex-col items-center justify-center w-12 h-12 rounded-xl border",
                            today
                              ? "bg-primary/5 border-primary/20 text-primary"
                              : "bg-gray-50 border-gray-100 text-gray-600"
                          )}>
                            <span className="text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5">
                              {date.toLocaleDateString('ms-MY', { weekday: 'short' })}
                            </span>
                            <span className="text-lg font-bold leading-none">
                              {date.getDate()}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
                              {shift?.name || 'Shift'}
                            </h3>
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
                                shift && shift.startTime < '12:00' ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"
                              )}>
                                {shift && shift.startTime < '12:00' ? <Sun size={10} /> : <Moon size={10} />}
                                {shift?.startTime} - {shift?.endTime}
                              </span>
                            </div>
                          </div>
                        </div>

                        {today && (
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full shadow-sm">
                            HARI INI
                          </span>
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 pl-[3.75rem]">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" />
                          <span>
                            {shift && Math.round(((parseInt(shift.endTime.split(':')[0]) * 60 + parseInt(shift.endTime.split(':')[1])) -
                              (parseInt(shift.startTime.split(':')[0]) * 60 + parseInt(shift.startTime.split(':')[1])) -
                              shift.breakDuration) / 60)} Jam
                          </span>
                        </div>

                        {colleagues.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users size={14} className="text-gray-400" />
                            <span>{colleagues.length} Rakan</span>
                          </div>
                        )}
                      </div>

                      {schedule.notes && (
                        <div className="mt-3 ml-[3.75rem] text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                          "{schedule.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

      </div>
    </StaffLayout>
  );
}
