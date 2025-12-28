'use client';

import { useState, useMemo, useEffect } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal, useStaff, useKPI } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Users,
  Sun,
  Moon,
  Coffee,
  Briefcase,
  Timer,
  Award,
  Palmtree,
  ArrowRightLeft,
  X,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleEntry, Shift } from '@/lib/types'; // Import for types

export default function SchedulePage() {
  const { user } = useAuth();
  const { staff, isInitialized } = useStaff();
  const {
    schedules,
    shifts,
    getLeaveBalance,
    addStaffRequest,
    isInitialized: staffPortalInitialized
  } = useStaffPortal();

  const { getStaffKPI, isInitialized: kpiInitialized } = useKPI();

  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedShiftForSwap, setSelectedShiftForSwap] = useState<{ schedule: ScheduleEntry, shift: Shift, date: Date } | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [isSubmittingSwap, setIsSubmittingSwap] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    type?: 'primary' | 'danger' | 'success' | 'warning' | 'info';
    showCancel?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const currentStaff = useMemo(() => {
    if (!user) return null;
    return staff.find(s => s.id === user.id) || null;
  }, [user, staff]);

  // KPI & Leave Data
  const staffKPI = useMemo(() => {
    if (!user) return null;
    return getStaffKPI(user.id);
  }, [user, getStaffKPI]);

  const leaveBalance = useMemo(() => {
    if (!user) return null;
    const balance = getLeaveBalance(user.id);
    return balance ? balance.annual.balance : 0;
  }, [user, getLeaveBalance]);

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

  // NEXT SHIFT LOGIC
  const nextShift = useMemo(() => {
    if (!user || schedules.length === 0) return null;

    const now = new Date();
    // Filter future schedules
    const futureSchedules = schedules
      .filter(s => s.staffId === user.id)
      .map(s => {
        const shift = shifts.find(sh => sh.id === s.shiftId);
        if (!shift) return null;

        const scheduleDateTime = new Date(s.date + 'T' + shift.startTime);
        return { schedule: s, shift, dateTime: scheduleDateTime };
      })
      .filter((item): item is { schedule: ScheduleEntry; shift: Shift; dateTime: Date } => item !== null && item.dateTime > now)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    return futureSchedules[0] || null;
  }, [schedules, shifts, user]);

  const [timeToNextShift, setTimeToNextShift] = useState<string>('');

  useEffect(() => {
    if (!nextShift) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = nextShift.dateTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeToNextShift('Sekarang');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeToNextShift(`${days} Hari lagi`);
      } else {
        setTimeToNextShift(`${hours}j ${minutes}m lagi`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [nextShift]);

  // Get colleagues on the same shift
  const getColleaguesOnShift = (date: string, shiftId: string) => {
    return schedules
      .filter(s => s.date === date && s.shiftId === shiftId && s.staffId !== user?.id)
      .map(s => {
        const colleague = staff.find(st => st.id === s.staffId);
        return colleague?.name || s.staffName;
      });
  };

  const handleSwapClick = (schedule: ScheduleEntry, shift: Shift, date: Date) => {
    // Only allow swapping future shifts
    if (new Date(schedule.date + 'T' + shift.startTime) < new Date()) {
      setConfirmModal({
        isOpen: true,
        title: 'Tindakan Tidak Sah',
        message: 'Anda tidak boleh menukar shift yang telah berlalu.',
        type: 'warning',
        showCancel: false,
        confirmText: 'Faham'
      });
      return;
    }

    setSelectedShiftForSwap({ schedule, shift, date });
    setSwapModalOpen(true);
  };

  const submitSwapRequest = async () => {
    if (!selectedShiftForSwap || !user || !currentStaff) return;
    if (!swapReason.trim()) {
      setConfirmModal({
        isOpen: true,
        title: 'Maklumat Diperlukan',
        message: 'Sila berikan sebab penukaran shift.',
        type: 'warning',
        showCancel: false,
        confirmText: 'Faham'
      });
      return;
    }

    setIsSubmittingSwap(true);

    try {
      addStaffRequest({
        staffId: user.id,
        staffName: currentStaff.name,
        category: 'shift_swap',
        title: `Tukar Shift: ${selectedShiftForSwap.date.toLocaleDateString('ms-MY')}`,
        description: `Request to swap shift on ${selectedShiftForSwap.date.toLocaleDateString('ms-MY')} (${selectedShiftForSwap.shift.name}). Reason: ${swapReason}`,
        priority: 'medium',
        status: 'pending'
      });

      setSwapModalOpen(false);
      setSwapReason('');
      setSelectedShiftForSwap(null);

      setConfirmModal({
        isOpen: true,
        title: 'Permohonan Dihantar',
        message: 'Permohonan tukar shift berjaya dihantar dan sedang menunggu kelulusan pengurus.',
        type: 'success',
        showCancel: false,
        confirmText: 'Selesai'
      });
    } catch (error) {
      console.error("Swap request failed", error);
      setConfirmModal({
        isOpen: true,
        title: 'Ralat Penghantaran',
        message: 'Gagal menghantar permohonan. Sila cuba lagi sebentar.',
        type: 'danger',
        showCancel: false,
        confirmText: 'Kembali'
      });
    } finally {
      setIsSubmittingSwap(false);
    }
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

  if (!isInitialized || !staffPortalInitialized) {
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
          </div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="max-w-md mx-auto sm:max-w-2xl lg:max-w-4xl animate-fade-in pb-20 pt-4 px-4 sm:px-6">

        {/* Header Section - Modern & Clean */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
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

          {/* NEW: Widgets Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* 1. Next Shift Countdown */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Clock size={48} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1 opacity-90">
                  <Timer size={14} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Shift Seterusnya</span>
                </div>
                {nextShift ? (
                  <div>
                    <div className="text-2xl font-bold mb-1">{timeToNextShift}</div>
                    <div className="text-xs text-indigo-100 font-medium">
                      {nextShift.dateTime.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'short' })}
                      {' • '}
                      {nextShift.shift.startTime}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm opacity-90 font-medium mt-1">Tiada shift akan datang</div>
                )}
              </div>
            </div>

            {/* 2 & 3. KPI & Leave (Split Column) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Mini KPI */}
              <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -right-2 -bottom-2 opacity-5">
                  <Award size={48} className="text-amber-500" />
                </div>
                <div className="flex items-center gap-1.5 mb-1 text-gray-500">
                  <Award size={14} />
                  <span className="text-[10px] font-bold uppercase">Prestasi</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-gray-900">{staffKPI?.overallScore || '-'}</span>
                  <span className="text-[10px] text-gray-400">/100</span>
                </div>
                <div className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit mt-1">
                  Rank #{staffKPI?.rank || '-'}
                </div>
              </div>

              {/* Leave Balance */}
              <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -right-2 -bottom-2 opacity-5">
                  <Palmtree size={48} className="text-emerald-500" />
                </div>
                <div className="flex items-center gap-1.5 mb-1 text-gray-500">
                  <Palmtree size={14} />
                  <span className="text-[10px] font-bold uppercase">Baki Cuti</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-gray-900">{leaveBalance}</span>
                  <span className="text-[10px] text-gray-400">Hari</span>
                </div>
                <div className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit mt-1">
                  Available
                </div>
              </div>
            </div>
          </div>

          {/* Week Navigation Pill */}
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex items-center justify-between mb-6">
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

        {/* Metrics Overview - Compact Row */}
        <div className="flex flex-row items-center justify-between gap-3 mb-8">
          <div className="flex-1 bg-white py-3 px-2 rounded-2xl border border-blue-50 shadow-sm flex flex-col items-center justify-center gap-1 group min-w-0">
            <div className="bg-blue-50 text-blue-600 p-1.5 rounded-xl mb-1 group-hover:scale-110 transition-transform">
              <Briefcase size={16} />
            </div>
            <span className="text-xl font-bold text-gray-900 leading-none">{myWeekSchedule.length}</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 truncate">Kerja</span>
          </div>

          <div className="flex-1 bg-white py-3 px-2 rounded-2xl border border-emerald-50 shadow-sm flex flex-col items-center justify-center gap-1 group min-w-0">
            <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-xl mb-1 group-hover:scale-110 transition-transform">
              <Clock size={16} />
            </div>
            <span className="text-xl font-bold text-gray-900 leading-none">{weeklyHours}h</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 truncate">Jam</span>
          </div>

          <div className="flex-1 bg-white py-3 px-2 rounded-2xl border border-amber-50 shadow-sm flex flex-col items-center justify-center gap-1 group min-w-0">
            <div className="bg-amber-50 text-amber-600 p-1.5 rounded-xl mb-1 group-hover:scale-110 transition-transform">
              <Coffee size={16} />
            </div>
            <span className="text-xl font-bold text-gray-900 leading-none">{7 - myWeekSchedule.length}</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 truncate">Cuti</span>
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
                    : "bg-white shadow-sm border border-gray-100 p-0 hover:shadow-md cursor-pointer group"
                )}
                onClick={() => {
                  if (schedule && shift) {
                    handleSwapClick(schedule, shift, date);
                  }
                }}
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
                            <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 flex items-center gap-2">
                              {shift?.name || 'Shift'}
                              {!isPast && (
                                <ArrowRightLeft size={12} className="text-gray-300 group-hover:text-primary transition-colors" />
                              )}
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

      {/* SWAP REQUEST MODAL */}
      <AnimatePresence>
        {swapModalOpen && selectedShiftForSwap && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setSwapModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[400px] bg-white rounded-t-2xl sm:rounded-2xl z-[70] p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Tukar Shift?</h3>
                <button onClick={() => setSwapModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <X size={18} />
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg h-12 w-12 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-gray-500">
                      {selectedShiftForSwap.date.toLocaleDateString('ms-MY', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-gray-900 leading-none">
                      {selectedShiftForSwap.date.getDate()}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{selectedShiftForSwap.shift.name}</div>
                    <div className="text-xs text-gray-500">
                      {selectedShiftForSwap.shift.startTime} - {selectedShiftForSwap.shift.endTime}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sebab Penukaran</label>
                <textarea
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                  placeholder="Contoh: Ada urusan kecemasan / keluarga..."
                  rows={3}
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Permohonan anda akan dihantar kepada Manager untuk kelulusan.
                </p>
              </div>

              <button
                onClick={submitSwapRequest}
                disabled={isSubmittingSwap || !swapReason.trim()}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingSwap ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Send size={18} />
                    Hantar Permohonan
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          if (confirmModal.onConfirm) confirmModal.onConfirm();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }}
        type={confirmModal.type}
        showCancel={confirmModal.showCancel}
        confirmText={confirmModal.confirmText}
      />

    </StaffLayout>
  );
}
