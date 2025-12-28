'use client';

import { useState, useMemo, useEffect } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { StaffRequest } from '@/lib/types';
import {
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  User,
  Check,
  X,
  AlertCircle,
  Send,
  Sun,
  Moon,
  Calendar,
  Clock,
  Trash2
} from 'lucide-react';

export default function SwapShiftPage() {
  const { user } = useAuth();
  const { staff, isInitialized } = useStaff();
  const {
    schedules,
    shifts,
    addStaffRequest,
    updateStaffRequest,
    deleteStaffRequest,
    rejectStaffRequest,
    getStaffRequestsByStaff,
    refreshStaffRequests
  } = useStaffPortal();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedColleague, setSelectedColleague] = useState<string>('');
  const [selectedColleagueDate, setSelectedColleagueDate] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Custom confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'primary' | 'danger' | 'success' | 'warning' | 'info';
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // Dynamic Staff Finding
  const currentStaff = useMemo(() => {
    return staff.find(s => s.id === user?.id) || null;
  }, [staff, user]);

  // Get my swap requests from store (filter by category 'shift_swap')
  const mySwapRequests = useMemo(() => {
    if (!user) return [];
    const allRequests = getStaffRequestsByStaff(user.id);
    return allRequests.filter(r => r.category === 'shift_swap');
  }, [user, getStaffRequestsByStaff]);

  // Refresh data on mount
  useEffect(() => {
    refreshStaffRequests();
  }, [refreshStaffRequests]);

  // Get my upcoming schedules
  const myUpcomingSchedules = useMemo(() => {
    if (!user) return [];
    const today = new Date().toISOString().split('T')[0];
    return schedules
      .filter(s => s.staffId === user.id && s.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 7)
      .map(s => ({
        ...s,
        shift: shifts.find(sh => sh.id === s.shiftId)
      }));
  }, [schedules, shifts, user]);

  // Get available colleagues for swap
  const availableColleagues = useMemo(() => {
    if (!selectedDate || !user) return [];

    const mySchedule = myUpcomingSchedules.find(s => s.date === selectedDate);
    if (!mySchedule) return [];

    return staff
      .filter(s => s.id !== user.id && s.status === 'active')
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
  }, [selectedDate, myUpcomingSchedules, schedules, staff, shifts, user]);

  const handleSubmitRequest = async () => {
    if (!selectedDate || !selectedColleague || !selectedColleagueDate || !user || !currentStaff) return;

    setIsSubmitting(true);

    try {
      const mySchedule = myUpcomingSchedules.find(s => s.date === selectedDate);
      const colleague = staff.find(s => s.id === selectedColleague);
      const colleagueSchedule = schedules.find(s => s.staffId === selectedColleague && s.date === selectedColleagueDate);
      const colleagueShift = colleagueSchedule ? shifts.find(sh => sh.id === colleagueSchedule.shiftId) : null;

      const formattedDate = new Date(selectedDate).toLocaleDateString('ms-MY', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      });

      const formattedColleagueDate = new Date(selectedColleagueDate).toLocaleDateString('ms-MY', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      });

      // Call addStaffRequest to persist to Supabase
      addStaffRequest({
        staffId: user.id,
        staffName: currentStaff.name,
        category: 'shift_swap',
        title: `Tukar Shift: ${formattedDate}`,
        description: `Permohonan tukar shift pada ${formattedDate} (${mySchedule?.shift?.name || 'Unknown'}) dengan ${colleague?.name || 'Unknown'} pada ${formattedColleagueDate} (${colleagueShift?.name || 'Unknown'}). Sebab: ${reason || 'Tiada sebab dinyatakan'}`,
        targetStaffId: selectedColleague,
        priority: 'medium',
        status: 'pending'
      });

      setSubmitSuccess(true);

      setTimeout(() => {
        setSubmitSuccess(false);
        setShowRequestModal(false);
        setSelectedDate('');
        setSelectedColleague('');
        setSelectedColleagueDate('');
        setReason('');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit swap request:', error);
      setConfirmModal({
        isOpen: true,
        title: 'Ralat Penghantaran',
        message: 'Gagal menghantar permohonan pertukaran. Sila cuba lagi sebentar.',
        type: 'danger',
        showCancel: false,
        confirmText: 'Kembali'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to parse swap request details
  const parseSwapDetails = (request: StaffRequest) => {
    // Try to extract colleague name and dates from description
    const match = request.description?.match(/dengan (.+?) pada/);
    const colleagueName = match ? match[1] : 'Tidak diketahui';

    return {
      colleagueName,
      date: request.title?.replace('Tukar Shift: ', '') || 'Unknown'
    };
  };

  const handleCancelRequest = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Batal Permohonan',
      message: 'Adakah anda benar-benar mahukan membatalkan permohonan pertukaran ini?',
      onConfirm: () => {
        deleteStaffRequest(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText: 'Ya, Batal',
      cancelText: 'Tidak',
      type: 'danger'
    });
  };

  const handleAcceptSwap = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Terima Pertukaran',
      message: 'Adakah anda bersetuju untuk menukar shift dengan rakan sekerja anda?',
      onConfirm: () => {
        updateStaffRequest(id, {
          status: 'in_progress',
          responseNote: 'Bersetuju dengan pertukaran. Menunggu maklum balas pengurus.'
        });
        setConfirmModal({
          isOpen: true,
          title: 'Berjaya',
          message: 'Terima kasih! Persetujuan anda telah direkodkan. Kini menunggu kelulusan pengurus.',
          type: 'success',
          showCancel: false,
          confirmText: 'Tutup'
        });
      },
      confirmText: 'Ya, Setuju',
      cancelText: 'Kembali',
      type: 'success'
    });
  };

  const handleDeclineSwap = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Tolak Pertukaran',
      message: 'Adakah anda mahu menolak permohonan pertukaran ini?',
      onConfirm: () => {
        rejectStaffRequest(id, 'Ditolak oleh rakan sekerja.', currentStaff?.name || 'Rakan Sekerja');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText: 'Ya, Tolak',
      cancelText: 'Kembali',
      type: 'danger'
    });
  };

  if (!isInitialized || !currentStaff) {
    return (
      <StaffLayout>
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
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

          {myUpcomingSchedules.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '0.75rem', padding: '1rem' }}>
              {myUpcomingSchedules.map(schedule => (
                <div
                  key={schedule.date}
                  className="shift-card"
                  style={{
                    background: `${schedule.shift?.color}15`,
                    borderLeft: `4px solid ${schedule.shift?.color}`,
                    padding: '0.75rem',
                    borderRadius: '0.5rem'
                  }}
                >
                  <div className="shift-date" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {new Date(schedule.date).toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div className="shift-name" style={{ color: schedule.shift?.color, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0.25rem 0' }}>
                    {schedule.shift?.startTime && schedule.shift.startTime < '12:00' ? (
                      <Sun size={14} />
                    ) : (
                      <Moon size={14} />
                    )}
                    {schedule.shift?.name}
                  </div>
                  <div className="shift-time" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {schedule.shift?.startTime} - {schedule.shift?.endTime}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <Calendar size={40} color="var(--gray-300)" style={{ marginBottom: '0.75rem' }} />
              <div>Tiada shift dijadualkan dalam 7 hari akan datang</div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Sila hubungi admin untuk maklumat jadual kerja anda
              </div>
            </div>
          )}
        </div>

        {/* Swap Requests */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeftRight size={20} />
              Permohonan Pertukaran
            </div>
            <div className="card-subtitle">{mySwapRequests.length} permohonan</div>
          </div>

          {mySwapRequests.length > 0 ? (
            <div className="staff-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
              {mySwapRequests.map(request => {
                const details = parseSwapDetails(request);
                return (
                  <div key={request.id} className="swap-request-card" style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <div className="swap-request-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="swap-info">
                        <div className="swap-dates" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <Calendar size={14} color="var(--primary)" />
                          <span style={{ fontWeight: 600 }}>{details.date}</span>
                        </div>
                        <div className="swap-with" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={14} />
                          {request.staffId === user?.id ? (
                            <span>Dengan: <strong>{details.colleagueName}</strong></span>
                          ) : (
                            <span>Dari: <strong>{request.staffName}</strong></span>
                          )}
                        </div>
                      </div>
                      <span className={`badge badge-${request.status === 'completed' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 600 }}>
                        {request.status === 'completed' && <CheckCircle size={12} />}
                        {request.status === 'rejected' && <XCircle size={12} />}
                        {request.status === 'pending' && <AlertCircle size={12} />}
                        {request.status === 'in_progress' && <Clock size={12} />}
                        {request.status === 'completed' ? 'Diluluskan' :
                          request.status === 'rejected' ? 'Ditolak' :
                            request.status === 'in_progress' ? 'Dalam Proses' : 'Menunggu'}
                      </span>
                    </div>
                    {request.description && (
                      <div className="swap-reason" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        "{request.description.length > 100
                          ? request.description.substring(0, 100) + '...'
                          : request.description}"
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {request.staffId === user?.id ? (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleCancelRequest(request.id)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <Trash2 size={12} />
                            Batal Permohonan
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeclineSwap(request.id)}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <X size={12} />
                              Tolak
                            </button>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleAcceptSwap(request.id)}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                background: 'var(--success)',
                                color: 'white',
                                border: 'none'
                              }}
                            >
                              <Check size={12} />
                              Terima
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {request.responseNote && (
                      <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '0.5rem', fontSize: '0.8rem', border: '1px dashed var(--border-color)' }}>
                        <strong>Maklum balas:</strong> {request.responseNote}
                      </div>
                    )}
                  </div>
                );
              })}
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
            <div className="swap-success" style={{ textAlign: 'center', padding: '2rem' }}>
              <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
              <h3>Permohonan Dihantar!</h3>
              <p>Permohonan anda akan disemak oleh pengurus.</p>
            </div>
          ) : (
            <div className="swap-form">
              {/* Select My Shift */}
              <div className="form-group">
                <label className="form-label">Pilih Shift Anda</label>
                {myUpcomingSchedules.length > 0 ? (
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
                ) : (
                  <div className="form-hint" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={14} />
                    Tiada shift dijadualkan. Sila hubungi admin.
                  </div>
                )}
              </div>

              {/* Select Colleague */}
              {selectedDate && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
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
                <div className="form-group" style={{ marginTop: '1rem' }}>
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
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Sebab Pertukaran</label>
                <textarea
                  className="form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nyatakan sebab pertukaran (optional)"
                  rows={2}
                  style={{ width: '100%', padding: '0.50rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
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
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
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

        {/* Standardized Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          type={confirmModal.type}
          showCancel={confirmModal.showCancel}
        />
      </div>
    </StaffLayout>
  );
}
