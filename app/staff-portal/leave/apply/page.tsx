'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { getLeaveTypeLabel, calculateLeaveDays } from '@/lib/staff-portal-data';
import { LeaveType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  ArrowLeft,
  Calendar,
  Send
} from 'lucide-react';
import PremiumBackButton from '@/components/PremiumBackButton';
import { DocumentUpload } from '@/components/staff-portal';

// Demo: Using staff ID 2 as the logged-in user
const CURRENT_STAFF_ID = '2';

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
  const { addLeaveRequest, getLeaveBalance } = useStaffPortal();

  const currentStaff = staff.find(s => s.id === CURRENT_STAFF_ID);
  const leaveBalance = getLeaveBalance(CURRENT_STAFF_ID);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: 'annual' as LeaveType,
    startDate: '',
    endDate: '',
    isHalfDay: false,
    halfDayType: 'morning' as 'morning' | 'afternoon',
    reason: '',
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
    const balanceData = leaveBalance[type as keyof typeof leaveBalance];
    if (typeof balanceData === 'object' && 'balance' in balanceData) {
      return balanceData.balance;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.startDate || !form.endDate) {
      alert('Sila pilih tarikh');
      return;
    }

    if (!form.reason.trim()) {
      alert('Sila masukkan sebab');
      return;
    }

    const available = getAvailableBalance(form.type);
    if (available !== null && duration > available) {
      alert(`Baki cuti tidak mencukupi. Baki: ${available} hari`);
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    addLeaveRequest({
      staffId: CURRENT_STAFF_ID,
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
    router.push('/staff-portal/leave');
  };

  if (!isInitialized || !currentStaff) {
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
        <div className="page-header">
          <PremiumBackButton href="/staff-portal/leave" label="Kembali ke Cuti" />
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
      </div>
    </MainLayout>
  );
}

