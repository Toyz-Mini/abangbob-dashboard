'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import StaffPortalNav from '@/components/StaffPortalNav';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  User,
  AlertCircle,
  Send,
  Sun,
  Moon
} from 'lucide-react';


const CURRENT_STAFF_ID = '2';

interface SwapRequest {
  id: string;
  fromStaffId: string;
  fromStaffName: string;
  toStaffId: string;
  toStaffName: string;
  fromDate: string;
  fromShift: string;
  toDate: string;
  toShift: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reason?: string;
}

// Helper function to get future date string
const getFutureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Mock swap requests with dynamic dates
const mockSwapRequests: SwapRequest[] = [
  {
    id: '1',
    fromStaffId: '2',
    fromStaffName: 'Siti Nurhaliza',
    toStaffId: '3',
    toStaffName: 'Muhammad Ali',
    fromDate: getFutureDate(3), // 3 days from now
    fromShift: 'Pagi',
    toDate: getFutureDate(4), // 4 days from now
    toShift: 'Petang',
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0],
    reason: 'Ada urusan keluarga'
  }
];

export default function SwapShiftPage() {
  const { staff, isInitialized } = useStaff();
  const { schedules, shifts } = useStaffPortal();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedColleague, setSelectedColleague] = useState<string>('');
  const [selectedColleagueDate, setSelectedColleagueDate] = useState<string>('');
  const [reason, setReason] = useState('');
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(mockSwapRequests);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const currentStaff = staff.find(s => s.id === CURRENT_STAFF_ID);

  // Get my upcoming schedules
  const myUpcomingSchedules = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules
      .filter(s => s.staffId === CURRENT_STAFF_ID && s.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 7)
      .map(s => ({
        ...s,
        shift: shifts.find(sh => sh.id === s.shiftId)
      }));
  }, [schedules, shifts]);

  // Get available colleagues for swap
  const availableColleagues = useMemo(() => {
    if (!selectedDate) return [];

    const mySchedule = myUpcomingSchedules.find(s => s.date === selectedDate);
    if (!mySchedule) return [];

    // Find colleagues who are NOT working on this date
    const workingOnDate = schedules
      .filter(s => s.date === selectedDate)
      .map(s => s.staffId);

    return staff
      .filter(s => s.id !== CURRENT_STAFF_ID && s.status === 'active' && !workingOnDate.includes(s.id))
      .map(s => ({
        ...s,
        // Get their schedules for swap options
        schedules: schedules
          .filter(sch => sch.staffId === s.id && sch.date >= selectedDate)
          .slice(0, 5)
          .map(sch => ({
            ...sch,
            shift: shifts.find(sh => sh.id === sch.shiftId)
          }))
      }));
  }, [selectedDate, myUpcomingSchedules, schedules, staff, shifts]);

  const handleSubmitRequest = async () => {
    if (!selectedDate || !selectedColleague || !selectedColleagueDate) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mySchedule = myUpcomingSchedules.find(s => s.date === selectedDate);
    const colleague = staff.find(s => s.id === selectedColleague);
    const colleagueSchedule = schedules.find(s => s.staffId === selectedColleague && s.date === selectedColleagueDate);
    const colleagueShift = colleagueSchedule ? shifts.find(sh => sh.id === colleagueSchedule.shiftId) : null;

    const newRequest: SwapRequest = {
      id: Date.now().toString(),
      fromStaffId: CURRENT_STAFF_ID,
      fromStaffName: currentStaff?.name || '',
      toStaffId: selectedColleague,
      toStaffName: colleague?.name || '',
      fromDate: selectedDate,
      fromShift: mySchedule?.shift?.name || '',
      toDate: selectedColleagueDate,
      toShift: colleagueShift?.name || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      reason
    };

    setSwapRequests(prev => [newRequest, ...prev]);
    setIsSubmitting(false);
    setSubmitSuccess(true);

    setTimeout(() => {
      setSubmitSuccess(false);
      setShowRequestModal(false);
      setSelectedDate('');
      setSelectedColleague('');
      setSelectedColleagueDate('');
      setReason('');
    }, 2000);
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>
              Tukar Shift
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Mohon pertukaran shift dengan rakan sekerja
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowRequestModal(true)}>
            <ArrowLeftRight size={18} />
            Mohon Tukar
          </button>
        </div>

        {/* My Upcoming Shifts */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} />
              Shift Saya (7 Hari Akan Datang)
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '0.75rem' }}>
            {myUpcomingSchedules.map(schedule => (
              <div
                key={schedule.date}
                className="shift-card"
                style={{
                  background: `${schedule.shift?.color}15`,
                  borderLeft: `4px solid ${schedule.shift?.color}`
                }}
              >
                <div className="shift-date">
                  {new Date(schedule.date).toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <div className="shift-name" style={{ color: schedule.shift?.color }}>
                  {schedule.shift?.startTime && schedule.shift.startTime < '12:00' ? (
                    <Sun size={14} />
                  ) : (
                    <Moon size={14} />
                  )}
                  {schedule.shift?.name}
                </div>
                <div className="shift-time">
                  {schedule.shift?.startTime} - {schedule.shift?.endTime}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Swap Requests */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeftRight size={20} />
              Permohonan Pertukaran
            </div>
            <div className="card-subtitle">{swapRequests.length} permohonan</div>
          </div>

          {swapRequests.length > 0 ? (
            <div className="staff-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {swapRequests.map(request => (
                <div key={request.id} className="swap-request-card">
                  <div className="swap-request-header">
                    <div className="swap-info">
                      <div className="swap-dates">
                        <div className="swap-from">
                          <Calendar size={14} />
                          <span>{new Date(request.fromDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}</span>
                          <span className="swap-shift-name">{request.fromShift}</span>
                        </div>
                        <ArrowLeftRight size={16} className="swap-arrow" />
                        <div className="swap-to">
                          <Calendar size={14} />
                          <span>{new Date(request.toDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}</span>
                          <span className="swap-shift-name">{request.toShift}</span>
                        </div>
                      </div>
                      <div className="swap-with">
                        <User size={14} />
                        <span>Dengan: <strong>{request.toStaffName}</strong></span>
                      </div>
                    </div>
                    <span className={`badge badge-${request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}`}>
                      {request.status === 'approved' && <CheckCircle size={12} />}
                      {request.status === 'rejected' && <XCircle size={12} />}
                      {request.status === 'pending' && <AlertCircle size={12} />}
                      {request.status === 'approved' ? 'Diluluskan' : request.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                    </span>
                  </div>
                  {request.reason && (
                    <div className="swap-reason">
                      Sebab: {request.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <ArrowLeftRight size={40} color="var(--gray-300)" style={{ marginBottom: '0.75rem' }} />
              <div>Tiada permohonan pertukaran</div>
            </div>
          )}
        </div>

        {/* Request Modal */}
        <Modal
          isOpen={showRequestModal}
          onClose={() => !isSubmitting && setShowRequestModal(false)}
          title="Mohon Pertukaran Shift"
          maxWidth="500px"
        >
          {submitSuccess ? (
            <div className="swap-success">
              <CheckCircle size={48} color="var(--success)" />
              <h3>Permohonan Dihantar!</h3>
              <p>Permohonan anda akan disemak oleh pengurus.</p>
            </div>
          ) : (
            <div className="swap-form">
              {/* Select My Shift */}
              <div className="form-group">
                <label className="form-label">Pilih Shift Anda</label>
                <select
                  className="form-select"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedColleague('');
                    setSelectedColleagueDate('');
                  }}
                >
                  <option value="">-- Pilih tarikh --</option>
                  {myUpcomingSchedules.map(s => (
                    <option key={s.date} value={s.date}>
                      {new Date(s.date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'short' })} - {s.shift?.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Colleague */}
              {selectedDate && (
                <div className="form-group">
                  <label className="form-label">Tukar Dengan</label>
                  {availableColleagues.length > 0 ? (
                    <select
                      className="form-select"
                      value={selectedColleague}
                      onChange={(e) => {
                        setSelectedColleague(e.target.value);
                        setSelectedColleagueDate('');
                      }}
                    >
                      <option value="">-- Pilih rakan sekerja --</option>
                      {availableColleagues.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="form-hint" style={{ color: 'var(--warning)' }}>
                      <AlertCircle size={14} />
                      Tiada rakan sekerja yang available untuk tarikh ini
                    </div>
                  )}
                </div>
              )}

              {/* Select Colleague's Shift */}
              {selectedColleague && (
                <div className="form-group">
                  <label className="form-label">Pilih Shift Mereka</label>
                  {(() => {
                    const colleague = availableColleagues.find(c => c.id === selectedColleague);
                    return colleague && colleague.schedules.length > 0 ? (
                      <select
                        className="form-select"
                        value={selectedColleagueDate}
                        onChange={(e) => setSelectedColleagueDate(e.target.value)}
                      >
                        <option value="">-- Pilih shift --</option>
                        {colleague.schedules.map(s => (
                          <option key={s.date} value={s.date}>
                            {new Date(s.date).toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' })} - {s.shift?.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="form-hint">Tiada shift tersedia</div>
                    );
                  })()}
                </div>
              )}

              {/* Reason */}
              <div className="form-group">
                <label className="form-label">Sebab Pertukaran</label>
                <textarea
                  className="form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nyatakan sebab pertukaran (optional)"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowRequestModal(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleSubmitRequest}
                  disabled={!selectedDate || !selectedColleague || !selectedColleagueDate || isSubmitting}
                >
                  {isSubmitting ? 'Menghantar...' : (
                    <>
                      <Send size={16} />
                      Hantar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </Modal>

        <StaffPortalNav />
      </div>
    </MainLayout>
  );
}

