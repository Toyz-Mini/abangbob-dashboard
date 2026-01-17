'use client';

import { useState, useMemo, useEffect } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { StaffRequest } from '@/lib/types';
import { useTranslation } from '@/lib/contexts/LanguageContext';
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
  const { t } = useTranslation();
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
        // Use translation key format if backend supports it, but for now stick to dynamic string as it persists to DB
        // Or construct it here. The prompt implies we are refactoring UI strings.
        // The title/desc are saved to DB, so maybe we should keep them readable or use a format.
        // For now I will keep the descriptive text but use the keys for UI elements.
        // ACTUALLY, if I change title/desc to keys, the admin panel might not show them correctly unless admin panel also translates.
        // Let's stick to generating the string as before BUT using the new translatable format if possible, or just keep string generation for DB contents as is (in Malay/English mixed default).
        // Since I'm replacing hardcoded strings, I should probably use `t` here to generate the string that goes into the DB, 
        // so it's at least localized to the user's current language when created.
        title: t('staffPortal.swap.request.title', { date: formattedDate }),
        description: t('staffPortal.swap.request.desc', {
          date: formattedDate,
          shift: mySchedule?.shift?.name || 'Unknown',
          reason: reason || 'N/A'
        }) + ` (${colleague?.name} @ ${formattedColleagueDate})`, // Append extra info not in simple key
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
        title: t('staffPortal.swap.modals.errorTitle'),
        message: t('staffPortal.swap.modals.errorMsg'),
        type: 'danger',
        showCancel: false,
        confirmText: t('staffPortal.swap.actions.back')
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
      // Note: we can't easily translate existing DB titles, so we handle UI display separately or accept mixed content
    };
  };

  const handleCancelRequest = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t('staffPortal.swap.modals.cancelTitle'),
      message: t('staffPortal.swap.modals.cancelMsg'),
      onConfirm: () => {
        deleteStaffRequest(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText: t('staffPortal.swap.modals.cancelConfirm'),
      cancelText: t('staffPortal.swap.modals.cancelDecline'),
      type: 'danger'
    });
  };

  const handleAcceptSwap = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t('staffPortal.swap.modals.acceptTitle'),
      message: t('staffPortal.swap.modals.acceptMsg'),
      onConfirm: () => {
        updateStaffRequest(id, {
          status: 'in_progress',
          responseNote: t('staffPortal.swap.modals.acceptNote')
        });
        setConfirmModal({
          isOpen: true,
          title: t('staffPortal.swap.modals.acceptSuccessTitle'),
          message: t('staffPortal.swap.modals.acceptSuccessMsg'),
          type: 'success',
          showCancel: false,
          confirmText: t('common.close') || 'Tutup'
        });
      },
      confirmText: t('staffPortal.swap.modals.acceptConfirm'),
      cancelText: t('staffPortal.swap.actions.back'),
      type: 'success'
    });
  };

  const handleDeclineSwap = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t('staffPortal.swap.modals.declineTitle'),
      message: t('staffPortal.swap.modals.declineMsg'),
      onConfirm: () => {
        rejectStaffRequest(id, t('staffPortal.swap.modals.declineNote'), currentStaff?.name || 'Rakan Sekerja');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText: t('staffPortal.swap.modals.declineConfirm'),
      cancelText: t('staffPortal.swap.actions.back'),
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
              {t('staffPortal.swap.title')}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('staffPortal.swap.subtitle')}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowRequestModal(true)}>
            <ArrowLeftRight size={18} />
            {t('staffPortal.swap.apply')}
          </button>
        </div>

        {/* My Upcoming Shifts */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} />
              {t('staffPortal.swap.myShiftsTitle')}
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
              <div>{t('staffPortal.swap.noShifts')}</div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {t('staffPortal.swap.contactAdmin')}
              </div>
            </div>
          )}
        </div>

        {/* Swap Requests */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeftRight size={20} />
              {t('staffPortal.swap.requestsTitle')}
            </div>
            <div className="card-subtitle">{t('staffPortal.swap.count', { count: mySwapRequests.length })}</div>
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
                            <span>
                              {t('staffPortal.swap.with', { name: '' })} <strong>{details.colleagueName}</strong>
                            </span>
                          ) : (
                            <span>
                              {t('staffPortal.swap.from', { name: '' })} <strong>{request.staffName}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`badge badge-${request.status === 'completed' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 600 }}>
                        {request.status === 'completed' && <CheckCircle size={12} />}
                        {request.status === 'rejected' && <XCircle size={12} />}
                        {request.status === 'pending' && <AlertCircle size={12} />}
                        {request.status === 'in_progress' && <Clock size={12} />}
                        {t(`staffPortal.swap.status.${request.status}`)}
                      </span>
                    </div>
                    {request.description && (
                      <div className="swap-reason" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        &quot;{request.description.length > 100
                          ? request.description.substring(0, 100) + '...'
                          : request.description}&quot;
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
                            {t('staffPortal.swap.actions.cancel')}
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
                              {t('staffPortal.swap.actions.decline')}
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
                              {t('staffPortal.swap.actions.accept')}
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
              <div>{t('staffPortal.swap.noRequests')}</div>
            </div>
          )}
        </div>

        {/* Request Modal */}
        <Modal
          isOpen={showRequestModal}
          onClose={() => !isSubmitting && setShowRequestModal(false)}
          title={t('staffPortal.swap.form.title')}
          maxWidth="500px"
        >
          {submitSuccess ? (
            <div className="swap-success" style={{ textAlign: 'center', padding: '2rem' }}>
              <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
              <h3>{t('staffPortal.swap.form.successTitle')}</h3>
              <p>{t('staffPortal.swap.form.successDesc')}</p>
            </div>
          ) : (
            <div className="swap-form">
              {/* Select My Shift */}
              <div className="form-group">
                <label className="form-label">{t('staffPortal.swap.form.selectMyShift')}</label>
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
                    <option value="">{t('staffPortal.swap.form.selectDatePlaceholder')}</option>
                    {myUpcomingSchedules.map(s => (
                      <option key={s.date} value={s.date}>
                        {new Date(s.date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'short' })} - {s.shift?.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="form-hint" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={14} />
                    {t('staffPortal.swap.form.noShiftHint')}
                  </div>
                )}
              </div>

              {/* Select Colleague */}
              {selectedDate && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">{t('staffPortal.swap.form.swapWith')}</label>
                  {availableColleagues.length > 0 ? (
                    <select
                      className="form-select"
                      value={selectedColleague}
                      onChange={(e) => {
                        setSelectedColleague(e.target.value);
                        setSelectedColleagueDate('');
                      }}
                    >
                      <option value="">{t('staffPortal.swap.form.selectColleaguePlaceholder')}</option>
                      {availableColleagues.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="form-hint" style={{ color: 'var(--warning)' }}>
                      <AlertCircle size={14} />
                      {t('staffPortal.swap.form.noColleagueHint')}
                    </div>
                  )}
                </div>
              )}

              {/* Select Colleague's Shift */}
              {selectedColleague && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">{t('staffPortal.swap.form.selectTheirShift')}</label>
                  {(() => {
                    const colleague = availableColleagues.find(c => c.id === selectedColleague);
                    return colleague && colleague.schedules.length > 0 ? (
                      <select
                        className="form-select"
                        value={selectedColleagueDate}
                        onChange={(e) => setSelectedColleagueDate(e.target.value)}
                      >
                        <option value="">{t('staffPortal.swap.form.selectShiftPlaceholder')}</option>
                        {colleague.schedules.map(s => (
                          <option key={s.date} value={s.date}>
                            {new Date(s.date).toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' })} - {s.shift?.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="form-hint">{t('staffPortal.swap.form.noShiftAvailable')}</div>
                    );
                  })()}
                </div>
              )}

              {/* Reason */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">{t('staffPortal.swap.form.reason')}</label>
                <textarea
                  className="form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('staffPortal.swap.form.reasonPlaceholder')}
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
                  {t('staffPortal.swap.form.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={handleSubmitRequest}
                  disabled={!selectedDate || !selectedColleague || !selectedColleagueDate || isSubmitting}
                >
                  {isSubmitting ? t('staffPortal.swap.form.submitting') : (
                    <>
                      <Send size={16} />
                      {t('staffPortal.swap.form.submit')}
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
