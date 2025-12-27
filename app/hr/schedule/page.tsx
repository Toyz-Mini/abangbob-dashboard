'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useSchedules } from '@/lib/store';
import {
  useSchedulesRealtime,
  useStaffRealtime,
  usePublicHolidaysRealtime,
  useHolidayPoliciesRealtime
} from '@/lib/supabase/realtime-hooks';
import {
  Shift,
  ScheduleEntry,
  PublicHoliday,
  HolidayPolicy
} from '@/lib/types';
import {
  fetchPublicHolidays,
  fetchHolidayPolicies,
  getHolidayPolicyForDate
} from '@/lib/supabase/operations';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  AlertTriangle,
  Settings
} from 'lucide-react';

type ModalType = 'add-shift' | 'edit-shift' | 'add-schedule' | 'edit-schedule' | null;

const DEFAULT_SHIFTS: Omit<Shift, 'id'>[] = [
  { name: 'Pagi', startTime: '07:00', endTime: '15:00', breakDuration: 60, color: '#3b82f6' },
  { name: 'Petang', startTime: '14:00', endTime: '22:00', breakDuration: 60, color: '#8b5cf6' },
  { name: 'Full Day', startTime: '08:00', endTime: '20:00', breakDuration: 90, color: '#10b981' },
];

export default function SchedulePage() {
  const {
    shifts,
    schedules,
    staff,
    addShift,
    updateShift,
    deleteShift,
    addScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry,
    getWeekSchedule,
    refreshSchedules,
    isInitialized
  } = useSchedules();

  // Realtime subscription for schedules
  const handleScheduleChange = useCallback(() => {
    console.log('[Realtime] Schedule change detected, refreshing...');
    refreshSchedules();
  }, [refreshSchedules]);

  useSchedulesRealtime(handleScheduleChange);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEntry | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Holiday State
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [policies, setPolicies] = useState<HolidayPolicy[]>([]);

  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Shift form
  const [shiftForm, setShiftForm] = useState({
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    breakDuration: 60,
    color: '#3b82f6',
  });

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    staffId: '',
    shiftId: '',
    date: '',
    notes: '',
  });

  // Initialize default shifts if none exist
  const initializeDefaultShifts = () => {
    if (shifts.length === 0) {
      DEFAULT_SHIFTS.forEach(shift => addShift(shift));
    }
  };

  // Get active staff
  const activeStaff = staff.filter(s => s.status === 'active');

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

  // Get schedule for current week
  const weekSchedule = useMemo(() => {
    return getWeekSchedule(currentWeekStart.toISOString().split('T')[0]);
  }, [currentWeekStart, getWeekSchedule, schedules]);

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

  // Get schedule entries for a specific date and staff
  const getScheduleForCell = (date: Date, staffId: string): ScheduleEntry | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return weekSchedule.find(s => s.date === dateStr && s.staffId === staffId);
  };

  // Helper: Check for holiday
  const getHolidayDetails = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const holiday = holidays.find(h => h.date === dateStr);
    if (!holiday) return null;

    const policy = policies.find(p => p.holidayId === holiday.id);
    return { holiday, policy };
  }, [holidays, policies]);

  // Load holidays data
  const loadHolidayData = useCallback(async () => {
    const year = currentWeekStart.getFullYear();
    try {
      const [holidaysData, policiesData] = await Promise.all([
        fetchPublicHolidays(year),
        fetchHolidayPolicies(year)
      ]);
      setHolidays(holidaysData);
      setPolicies(policiesData);
    } catch (error) {
      console.error('Error loading holiday details:', error);
    }
  }, [currentWeekStart]);

  // Initial load & Re-fetch on week change (if year changes efficiently handled by memo/deps)
  // Actually simpler to just effect on currentWeekStart.getFullYear()
  const currentYear = useMemo(() => currentWeekStart.getFullYear(), [currentWeekStart]);



  useEffect(() => {
    loadHolidayData();
  }, [loadHolidayData, currentYear]);

  // Realtime hooks
  usePublicHolidaysRealtime(loadHolidayData);
  useHolidayPoliciesRealtime(loadHolidayData);

  // Check for conflicts
  const hasConflict = (staffId: string, date: string, excludeId?: string): boolean => {
    return schedules.some(s =>
      s.staffId === staffId &&
      s.date === date &&
      s.id !== excludeId
    );
  };

  // Calculate weekly hours for staff
  const getWeeklyHours = (staffId: string): number => {
    let totalMinutes = 0;
    weekSchedule.filter(s => s.staffId === staffId).forEach(entry => {
      const shift = shifts.find(sh => sh.id === entry.shiftId);
      if (shift) {
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        totalMinutes += (endH * 60 + endM) - (startH * 60 + startM) - shift.breakDuration;
      }
    });
    return Math.round(totalMinutes / 60 * 10) / 10;
  };

  // Calculate labor cost preview
  const laborCostPreview = useMemo(() => {
    let totalCost = 0;
    weekSchedule.forEach(entry => {
      const staffMember = staff.find(s => s.id === entry.staffId);
      const shift = shifts.find(sh => sh.id === entry.shiftId);
      if (staffMember && shift) {
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        const hours = ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakDuration) / 60;
        totalCost += hours * staffMember.hourlyRate;
      }
    });
    return totalCost;
  }, [weekSchedule, staff, shifts]);

  // Modal handlers
  const openAddShiftModal = () => {
    setShiftForm({ name: '', startTime: '08:00', endTime: '17:00', breakDuration: 60, color: '#3b82f6' });
    setModalType('add-shift');
  };

  const openEditShiftModal = (shift: Shift) => {
    setSelectedShift(shift);
    setShiftForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDuration: shift.breakDuration,
      color: shift.color,
    });
    setModalType('edit-shift');
  };

  const openAddScheduleModal = (date: Date, staffId: string) => {
    setScheduleForm({
      staffId,
      shiftId: shifts[0]?.id || '',
      date: date.toISOString().split('T')[0],
      notes: '',
    });
    setModalType('add-schedule');
  };

  const openEditScheduleModal = (schedule: ScheduleEntry) => {
    setSelectedSchedule(schedule);
    setScheduleForm({
      staffId: schedule.staffId,
      shiftId: schedule.shiftId,
      date: schedule.date,
      notes: schedule.notes || '',
    });
    setModalType('edit-schedule');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedShift(null);
    setSelectedSchedule(null);
    setIsProcessing(false);
  };

  const handleAddShift = async () => {
    if (!shiftForm.name.trim()) {
      alert('Sila masukkan nama shift');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    addShift({
      name: shiftForm.name.trim(),
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      breakDuration: shiftForm.breakDuration,
      color: shiftForm.color,
    });

    closeModal();
  };

  const handleEditShift = async () => {
    if (!selectedShift) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    updateShift(selectedShift.id, {
      name: shiftForm.name.trim(),
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      breakDuration: shiftForm.breakDuration,
      color: shiftForm.color,
    });

    closeModal();
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Padam shift ini?')) return;
    deleteShift(shiftId);
  };

  const handleAddSchedule = async () => {
    if (!scheduleForm.staffId || !scheduleForm.shiftId) {
      alert('Sila pilih staf dan shift');
      return;
    }

    if (hasConflict(scheduleForm.staffId, scheduleForm.date)) {
      alert('Staf sudah ada jadual pada tarikh ini!');
      return;
    }

    // Holiday Check
    const holidayDetails = getHolidayDetails(new Date(scheduleForm.date));
    if (holidayDetails) {
      const { holiday, policy } = holidayDetails;
      if (policy && !policy.isOperating) {
        if (!confirm(`AMARAN: ${holiday.name} adalah hari CUTI UMUM (Outlet Tutup). Adakah anda pasti mahu menjadualkan staf?`)) return;
      } else if (policy) {
        let msg = `INFO: ${holiday.name} adalah Cuti Umum.\n`;
        if (policy.compensationType === 'double_pay') msg += 'Staff layak dapat Double Pay.';
        else if (policy.compensationType === 'replacement_leave') msg += 'Staff layak dapat Replacement Leave.';
        else if (policy.compensationType === 'staff_choice') msg += 'Staff boleh pilih Double Pay atau Replacement Leave.';

        if (!confirm(`${msg}\n\nTeruskan?`)) return;
      }
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const staffMember = staff.find(s => s.id === scheduleForm.staffId);
    const shift = shifts.find(s => s.id === scheduleForm.shiftId);

    addScheduleEntry({
      staffId: scheduleForm.staffId,
      staffName: staffMember?.name || '',
      shiftId: scheduleForm.shiftId,
      shiftName: shift?.name || '',
      date: scheduleForm.date,
      startTime: shift?.startTime || '',
      endTime: shift?.endTime || '',
      status: 'scheduled',
      notes: scheduleForm.notes.trim() || undefined,
    });

    closeModal();
  };

  const handleUpdateSchedule = async () => {
    if (!selectedSchedule) return;

    if (hasConflict(scheduleForm.staffId, scheduleForm.date, selectedSchedule.id)) {
      alert('Staf sudah ada jadual pada tarikh ini!');
      return;
    }

    // Holiday Check
    const holidayDetails = getHolidayDetails(new Date(scheduleForm.date));
    if (holidayDetails) {
      const { holiday, policy } = holidayDetails;
      if (policy && !policy.isOperating) {
        if (!confirm(`AMARAN: ${holiday.name} adalah hari CUTI UMUM (Outlet Tutup). Adakah anda pasti mahu menjadualkan staf?`)) return;
      } else if (policy) {
        // Friendly warning for update too
        // Optional: maybe less intrusive for update? But safe to show.
      }
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const shift = shifts.find(s => s.id === scheduleForm.shiftId);

    updateScheduleEntry(selectedSchedule.id, {
      shiftId: scheduleForm.shiftId,
      shiftName: shift?.name || '',
      startTime: shift?.startTime || '',
      endTime: shift?.endTime || '',
      notes: scheduleForm.notes.trim() || undefined,
    });

    closeModal();
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;
    deleteScheduleEntry(selectedSchedule.id);
    closeModal();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

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
              Shift Scheduler
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Jadual kerja mingguan staf
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={openAddShiftModal}>
              <Settings size={18} />
              Urus Shift
            </button>
            {shifts.length === 0 && (
              <button className="btn btn-primary" onClick={initializeDefaultShifts}>
                <Plus size={18} />
                Buat Shift Default
              </button>
            )}
          </div>
        </div>

        {/* Week Navigation & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="lg:col-span-2 card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button className="btn btn-outline btn-sm" onClick={goToPreviousWeek}>
                <ChevronLeft size={18} />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {weekDates[0].toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })} -
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
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '1rem', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Users size={18} />
              <span style={{ fontSize: '0.875rem' }}>Jadual Minggu Ini</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{weekSchedule.length} shift</div>
          </div>

          <div className="card" style={{ padding: '1rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Clock size={18} />
              <span style={{ fontSize: '0.875rem' }}>Anggaran Kos Gaji</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>BND {laborCostPreview.toFixed(2)}</div>
          </div>
        </div>

        {/* Shift Templates */}
        {shifts.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title">Template Shift</div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {shifts.map(shift => (
                <div
                  key={shift.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: `${shift.color}20`,
                    borderLeft: `4px solid ${shift.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: shift.color }}>{shift.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {shift.startTime} - {shift.endTime}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => openEditShiftModal(shift)}>
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleDeleteShift(shift.id)}
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              <button className="btn btn-outline" onClick={openAddShiftModal}>
                <Plus size={16} />
                Tambah Shift
              </button>
            </div>
          </div>
        )}

        {/* Schedule Grid */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} />
              Jadual Mingguan
            </div>
          </div>

          {activeStaff.length > 0 && shifts.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '150px' }}>Staf</th>
                    {weekDates.map(date => (
                      <th
                        key={date.toISOString()}
                        style={{
                          textAlign: 'center',
                          background: (() => {
                            const details = getHolidayDetails(date);
                            if (details?.policy?.isOperating === false) return '#fee2e2'; // Red for closed
                            if (details) return '#fef3c7'; // Amber for holiday
                            if (isToday(date)) return '#dbeafe';
                            return undefined;
                          })(),
                        }}
                      >
                        <div style={{ fontWeight: isToday(date) ? 700 : 600 }}>
                          {formatDate(date)}
                        </div>
                        {(() => {
                          const details = getHolidayDetails(date);
                          if (details) {
                            return (
                              <div style={{
                                fontSize: '0.65rem',
                                color: details.policy?.isOperating === false ? 'var(--danger)' : 'var(--primary)',
                                marginTop: '4px',
                                fontWeight: 600
                              }}>
                                {details.holiday.name}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </th>
                    ))}
                    <th style={{ width: '80px', textAlign: 'center' }}>Jam/Week</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStaff.map(staffMember => (
                    <tr key={staffMember.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{staffMember.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {staffMember.role}
                        </div>
                      </td>
                      {weekDates.map(date => {
                        const schedule = getScheduleForCell(date, staffMember.id);
                        const shift = schedule ? shifts.find(s => s.id === schedule.shiftId) : null;

                        return (
                          <td
                            key={date.toISOString()}
                            style={{
                              textAlign: 'center',
                              background: isToday(date) ? '#dbeafe' : undefined,
                              cursor: 'pointer',
                              padding: '0.5rem',
                            }}
                            onClick={() => schedule
                              ? openEditScheduleModal(schedule)
                              : openAddScheduleModal(date, staffMember.id)
                            }
                          >
                            {schedule && shift ? (
                              <div style={{
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                background: `${shift.color}20`,
                                borderLeft: `3px solid ${shift.color}`,
                              }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: shift.color }}>
                                  {shift.name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                  {shift.startTime}-{shift.endTime}
                                </div>
                              </div>
                            ) : (
                              <div style={{
                                padding: '0.75rem',
                                color: 'var(--gray-400)',
                                fontSize: '0.75rem',
                                border: '1px dashed var(--gray-300)',
                                borderRadius: 'var(--radius-sm)'
                              }}>
                                + Tambah
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>
                        {getWeeklyHours(staffMember.id)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Calendar size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {shifts.length === 0
                  ? 'Sila buat shift terlebih dahulu'
                  : 'Tiada staf aktif untuk dijadualkan'
                }
              </p>
              {shifts.length === 0 && (
                <button className="btn btn-primary" onClick={initializeDefaultShifts}>
                  <Plus size={18} />
                  Buat Shift Default
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Shift Modal */}
        <Modal
          isOpen={modalType === 'add-shift' || modalType === 'edit-shift'}
          onClose={closeModal}
          title={modalType === 'add-shift' ? 'Tambah Shift' : 'Edit Shift'}
          maxWidth="400px"
        >
          <div className="form-group">
            <label className="form-label">Nama Shift *</label>
            <input
              type="text"
              className="form-input"
              value={shiftForm.name}
              onChange={(e) => setShiftForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: Pagi, Petang, Malam"
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Masa Mula</label>
              <input
                type="time"
                className="form-input"
                value={shiftForm.startTime}
                onChange={(e) => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Masa Tamat</label>
              <input
                type="time"
                className="form-input"
                value={shiftForm.endTime}
                onChange={(e) => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Rehat (minit)</label>
              <input
                type="number"
                className="form-input"
                value={shiftForm.breakDuration}
                onChange={(e) => setShiftForm(prev => ({ ...prev, breakDuration: Number(e.target.value) }))}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Warna</label>
              <input
                type="color"
                className="form-input"
                value={shiftForm.color}
                onChange={(e) => setShiftForm(prev => ({ ...prev, color: e.target.value }))}
                style={{ height: '40px', padding: '4px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add-shift' ? handleAddShift : handleEditShift}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Simpan'}
            </button>
          </div>
        </Modal>

        {/* Add/Edit Schedule Modal */}
        <Modal
          isOpen={modalType === 'add-schedule' || modalType === 'edit-schedule'}
          onClose={closeModal}
          title={modalType === 'add-schedule' ? 'Tambah Jadual' : 'Edit Jadual'}
          subtitle={new Date(scheduleForm.date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
          maxWidth="400px"
        >
          <div className="form-group">
            <label className="form-label">Staf</label>
            <input
              type="text"
              className="form-input"
              value={staff.find(s => s.id === scheduleForm.staffId)?.name || ''}
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">Shift *</label>
            <select
              className="form-select"
              value={scheduleForm.shiftId}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, shiftId: e.target.value }))}
            >
              {shifts.map(shift => (
                <option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nota</label>
            <textarea
              className="form-input"
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              placeholder="Catatan tambahan..."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            {modalType === 'edit-schedule' && (
              <button
                className="btn btn-outline"
                onClick={handleDeleteSchedule}
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
            <button
              className="btn btn-primary"
              onClick={modalType === 'add-schedule' ? handleAddSchedule : handleUpdateSchedule}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Simpan'}
            </button>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}




