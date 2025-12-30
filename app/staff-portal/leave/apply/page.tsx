'use client';

import { useState, useCallback, useEffect } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { useSubmitLeaveRequestMutation } from '@/lib/hooks/mutations/useLeaveMutations';
import { getLeaveTypeLabel, calculateLeaveDays } from '@/lib/staff-portal-data';
import { getReplacementLeaveStats } from '@/lib/supabase/operations';
import { LeaveType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import {
  ArrowLeft,
  Calendar,
  Send
} from 'lucide-react';

import { DocumentUpload } from '@/components/staff-portal';

import { useAuth } from '@/lib/contexts/AuthContext';


const LEAVE_TYPES: LeaveType[] = [
  'annual',
  'medical',
  'emergency',
  'unpaid',
  'compassionate',
  'replacement',
];

export default function ApplyLeavePage() {
  const router = useRouter();
  const { staff, isInitialized } = useStaff();
  const { getLeaveBalance } = useStaffPortal();
  const submitLeaveMutation = useSubmitLeaveRequestMutation();

  /* 
   * FIXED: Use real logged in user from AuthContext
   */
  const { currentStaff: authStaff, user } = useAuth();
  const staffId = authStaff?.id || user?.id || '';

  const currentStaff = staff.find(s => s.id === staffId);
  const leaveBalance = getLeaveBalance(staffId);

  // Replacement Balance State
  const [replacementAvailable, setReplacementAvailable] = useState<number | null>(null);

  useEffect(() => {
    if (staffId) {
      getReplacementLeaveStats(staffId).then(stats => {
        setReplacementAvailable(stats.available);
      });
    }
  }, [staffId]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: 'annual' as LeaveType,
    startDate: '',
    endDate: '',
    isHalfDay: false,
    halfDayType: 'morning' as 'morning' | 'afternoon',
    reason: '',
  });

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

  // Calculate duration
  const duration = form.startDate && form.endDate
    ? calculateLeaveDays(form.startDate, form.endDate, form.isHalfDay)
    : 0;

  // Get available balance for selected type
  const getAvailableBalance = (type: LeaveType): number | null => {
    if (!leaveBalance) return null;
    if (type === 'unpaid') return null; // unlimited
    if (type === 'study') return null;
    if (type === 'replacement') return replacementAvailable;

    const balanceData = leaveBalance[type as keyof typeof leaveBalance];
    if (typeof balanceData === 'object' && 'balance' in balanceData) {
      return balanceData.balance;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.startDate || !form.endDate) {
      setConfirmModal({
        isOpen: true,
        title: 'Maklumat Tidak Lengkap',
        message: 'Sila pilih tarikh mula dan tamat cuti anda.',
        type: 'warning',
        showCancel: false,
        confirmText: 'Faham'
      });
      return;
    }

    if (!form.reason.trim()) {
      setConfirmModal({
        isOpen: true,
        title: 'Maklumat Tidak Lengkap',
        message: 'Sila masukkan sebab permohonan cuti anda.',
        type: 'warning',
        showCancel: false,
        confirmText: 'Faham'
      });
      return;
    }

    const available = getAvailableBalance(form.type);
    if (available !== null && duration > available) {
      setConfirmModal({
        isOpen: true,
        title: 'Baki Tidak Mencukupi',
        message: `Baki cuti ${getLeaveTypeLabel(form.type)} anda tidak mencukupi (Tinggal ${available} hari).`,
        type: 'danger',
        showCancel: false,
        confirmText: 'Kembali'
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    submitLeaveMutation.mutate({
      staffId: staffId,
      staffName: currentStaff?.name || '',
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      duration,
      isHalfDay: form.isHalfDay,
      halfDayType: form.isHalfDay ? form.halfDayType : undefined,
      reason: form.reason.trim(),
      status: 'pending',
    });

    setIsSubmitting(false);

    setConfirmModal({
      isOpen: true,
      title: 'Permohonan Dihantar',
      message: 'Permohonan cuti anda telah berjaya dihantar dan sedang menunggu kelulusan pengurus.',
      type: 'success',
      showCancel: false,
      confirmText: 'Selesai',
      onConfirm: () => {
        router.push('/staff-portal/leave');
      }
    });
  };

  if (!isInitialized || !currentStaff) {
    return (
      <StaffLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner />
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="page-header">

          <h1 className="page-title" style={{ marginTop: '0.5rem' }}>
            Mohon Cuti
          </h1>
          <p className="page-subtitle">
            Isi borang permohonan cuti
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ maxWidth: '600px' }}>
            <div className="form-group">
              <label className="form-label">Jenis Cuti *</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as LeaveType }))}
              >
                {LEAVE_TYPES.map(type => {
                  const balance = getAvailableBalance(type);
                  return (
                    <option key={type} value={type}>
                      {getLeaveTypeLabel(type)}
                      {balance !== null && ` (Baki: ${balance} hari)`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tarikh Mula *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.startDate}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    startDate: e.target.value,
                    endDate: prev.endDate < e.target.value ? e.target.value : prev.endDate
                  }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tarikh Tamat *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.endDate}
                  onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                  min={form.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isHalfDay}
                  onChange={(e) => setForm(prev => ({ ...prev, isHalfDay: e.target.checked }))}
                />
                <span>Separuh Hari sahaja</span>
              </label>
            </div>

            {form.isHalfDay && (
              <div className="form-group">
                <label className="form-label">Pilih Sesi</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="halfDayType"
                      value="morning"
                      checked={form.halfDayType === 'morning'}
                      onChange={() => setForm(prev => ({ ...prev, halfDayType: 'morning' }))}
                    />
                    <span>Pagi</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="halfDayType"
                      value="afternoon"
                      checked={form.halfDayType === 'afternoon'}
                      onChange={() => setForm(prev => ({ ...prev, halfDayType: 'afternoon' }))}
                    />
                    <span>Petang</span>
                  </label>
                </div>
              </div>
            )}

            {/* Duration Preview */}
            {duration > 0 && (
              <div style={{
                padding: '1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={18} color="var(--primary)" />
                <span>Tempoh: <strong>{duration} hari</strong></span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Sebab Permohonan *</label>
              <textarea
                className="form-input"
                value={form.reason}
                onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
                placeholder="Nyatakan sebab permohonan cuti..."
              />
            </div>

            {/* MC Document Upload - only show for medical leave */}
            {form.type === 'medical' && (
              <DocumentUpload
                label="Upload Sijil MC"
                accept="image/*,.pdf"
                maxSize={5}
                hint="Sila upload sijil MC dari doktor/klinik"
              />
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <Link href="/staff-portal/leave" className="btn btn-outline" style={{ flex: 1 }}>
                Batal
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ flex: 1 }}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Menghantar...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Hantar Permohonan
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => {
            if (confirmModal.onConfirm) confirmModal.onConfirm();
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }}
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
      </div>
    </StaffLayout>
  );
}

