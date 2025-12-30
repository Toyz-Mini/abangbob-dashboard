'use client';

import { useState } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { getClaimTypeLabel } from '@/lib/staff-portal-data';
import { ClaimType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import {
  ArrowLeft,
  Send,
  DollarSign
} from 'lucide-react';

import { DocumentUpload } from '@/components/staff-portal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { loadSettingsFromLocalStorage } from '@/lib/supabase/settings-sync';


const CLAIM_TYPES: ClaimType[] = [
  'medical',
  'transport',
  'meal',
  'training',
  'phone',
  'uniform',
  'equipment',
  'other',
];

export default function NewClaimPage() {
  const router = useRouter();
  const { staff, isInitialized } = useStaff();
  const { addClaimRequest } = useStaffPortal();

  /* 
   * FIXED: Use real logged in user from AuthContext
   */
  const { currentStaff: authStaff, user } = useAuth();
  const staffId = authStaff?.id || user?.id || '';

  const currentStaff = staff.find(s => s.id === staffId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: 'general' as 'general' | 'mileage',
    type: 'transport' as ClaimType,
    amount: '',
    description: '',
    claimDate: new Date().toISOString().split('T')[0],
    odometerStart: '',
    odometerEnd: '',
    distanceKm: 0,
    locations: '',
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

  const [mileageRate, setMileageRate] = useState(0.60);

  // Load configured mileage rate
  useState(() => {
    // Check client-side only
    if (typeof window !== 'undefined') {
      const settings = loadSettingsFromLocalStorage();
      if (settings?.outlet?.mileageRate) {
        setMileageRate(settings.outlet.mileageRate);
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setConfirmModal({
        isOpen: true,
        title: 'Jumlah Tidak Sah',
        message: 'Sila masukkan jumlah tuntutan yang sah.',
        type: 'warning',
        showCancel: false,
        confirmText: 'Faham'
      });
      return;
    }

    if (!form.description.trim()) {
      setConfirmModal({
        isOpen: true,
        title: 'Maklumat Tidak Lengkap',
        message: 'Sila masukkan penerangan atau tujuan tuntutan ini.',
        type: 'warning',
        showCancel: false,
        confirmText: 'Faham'
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    addClaimRequest({
      staffId: staffId,
      staffName: currentStaff?.name || '',
      type: form.type,
      amount,
      description: form.category === 'mileage' ? `${form.locations} (${form.distanceKm.toFixed(1)}km)` : form.description.trim(),
      receiptUrls: ['receipt_placeholder.jpg'], // Demo
      claimDate: form.claimDate,
      status: 'pending',
      // Mileage Fields
      category: form.category,
      odometerStart: form.category === 'mileage' ? parseFloat(form.odometerStart) : undefined,
      odometerEnd: form.category === 'mileage' ? parseFloat(form.odometerEnd) : undefined,
      distanceKm: form.category === 'mileage' ? form.distanceKm : undefined,
      ratePerKm: form.category === 'mileage' ? mileageRate : undefined,
      locations: form.category === 'mileage' ? form.locations : undefined,
    });
    setIsSubmitting(false);

    setConfirmModal({
      isOpen: true,
      title: 'Tuntutan Dihantar',
      message: 'Tuntutan anda telah berjaya dihantar untuk semakan pihak pengurusan.',
      type: 'success',
      showCancel: false,
      confirmText: 'Selesai',
      onConfirm: () => {
        router.push('/staff-portal/claims');
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
            Tuntutan Baru
          </h1>
          <p className="page-subtitle">
            Isi borang tuntutan
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ maxWidth: '600px' }}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Jenis Claim</label>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--gray-100)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                <button
                  type="button"
                  className={`btn-toggle ${form.category === 'general' ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, category: 'general', type: 'transport', amount: '' }))}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: 'none',
                    background: form.category === 'general' ? 'white' : 'transparent',
                    boxShadow: form.category === 'general' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: form.category === 'general' ? 'var(--primary)' : 'var(--text-secondary)'
                  }}
                >
                  Biasa (Resit)
                </button>
                <button
                  type="button"
                  className={`btn-toggle ${form.category === 'mileage' ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, category: 'mileage', type: 'mileage', amount: '' }))}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: 'none',
                    background: form.category === 'mileage' ? 'white' : 'transparent',
                    boxShadow: form.category === 'mileage' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: form.category === 'mileage' ? 'var(--primary)' : 'var(--text-secondary)'
                  }}
                >
                  Mileage (KM)
                </button>
              </div>
            </div>

            {form.category === 'general' ? (
              // GENERAL CLAIM FORM
              <>
                <div className="form-group">
                  <label className="form-label">Kategori *</label>
                  <select
                    className="form-select"
                    value={form.type}
                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as ClaimType }))}
                  >
                    {CLAIM_TYPES.filter(t => t !== 'mileage').map(type => (
                      <option key={type} value={type}>
                        {getClaimTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Jumlah (BND) *</label>
                    <div style={{ position: 'relative' }}>
                      <DollarSign size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        type="number"
                        className="form-input"
                        value={form.amount}
                        onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        style={{ paddingLeft: '35px' }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tarikh *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.claimDate}
                      onChange={(e) => setForm(prev => ({ ...prev, claimDate: e.target.value }))}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Penerangan *</label>
                  <textarea
                    className="form-input"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Contoh: Petrol untuk delivery ke customer"
                  />
                </div>
              </>
            ) : (
              // MILEAGE CLAIM FORM
              <div className="animate-fade-in">
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Odometer Mula (KM) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={form.odometerStart}
                      onChange={(e) => {
                        const start = parseFloat(e.target.value) || 0;
                        const end = parseFloat(form.odometerEnd) || 0;
                        const dist = Math.max(0, end - start);
                        const amt = (dist * mileageRate).toFixed(2);
                        setForm(prev => ({ ...prev, odometerStart: e.target.value, distanceKm: dist, amount: amt }));
                      }}
                      placeholder="e.g. 15000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Odometer Akhir (KM) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={form.odometerEnd}
                      onChange={(e) => {
                        const end = parseFloat(e.target.value) || 0;
                        const start = parseFloat(form.odometerStart) || 0;
                        const dist = Math.max(0, end - start);
                        const amt = (dist * mileageRate).toFixed(2);
                        setForm(prev => ({ ...prev, odometerEnd: e.target.value, distanceKm: dist, amount: amt }));
                      }}
                      placeholder="e.g. 15050"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '1rem', background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Jarak (KM)</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{form.distanceKm.toFixed(1)} km</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Jumlah Tuntutan (x BND {mileageRate.toFixed(2)})</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>BND {form.amount || '0.00'}</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Lokasi Perjalanan *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.locations}
                    onChange={(e) => setForm(prev => ({ ...prev, locations: e.target.value }))}
                    placeholder="Contoh: Pejabat -> HQ -> Pejabat"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tarikh *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.claimDate}
                    onChange={(e) => setForm(prev => ({ ...prev, claimDate: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nota Tambahan</label>
                  <textarea
                    className="form-input"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="Sebab perjalanan..."
                  />
                </div>
              </div>
            )}

            <DocumentUpload
              label="Upload Resit/Bukti"
              accept="image/*,.pdf"
              maxSize={5}
              multiple={true}
              hint="Sila upload gambar resit atau bukti pembayaran"
            />

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <Link href="/staff-portal/claims" className="btn btn-outline" style={{ flex: 1 }}>
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
                    Hantar Tuntutan
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

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
    </StaffLayout>
  );
}

