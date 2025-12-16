'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { getClaimTypeLabel } from '@/lib/staff-portal-data';
import { ClaimType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  ArrowLeft,
  Send,
  DollarSign
} from 'lucide-react';

import { DocumentUpload } from '@/components/staff-portal';

// Demo: Using staff ID 2 as the logged-in user
const CURRENT_STAFF_ID = '2';

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

  const currentStaff = staff.find(s => s.id === CURRENT_STAFF_ID);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: 'transport' as ClaimType,
    amount: '',
    description: '',
    claimDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Sila masukkan jumlah yang sah');
      return;
    }

    if (!form.description.trim()) {
      alert('Sila masukkan penerangan');
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    addClaimRequest({
      staffId: CURRENT_STAFF_ID,
      staffName: currentStaff?.name || '',
      type: form.type,
      amount,
      description: form.description.trim(),
      receiptUrls: ['receipt_uploaded.jpg'], // Demo
      claimDate: form.claimDate,
      status: 'pending',
    });

    setIsSubmitting(false);
    router.push('/staff-portal/claims');
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

          <h1 className="page-title" style={{ marginTop: '0.5rem' }}>
            Tuntutan Baru
          </h1>
          <p className="page-subtitle">
            Isi borang tuntutan
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ maxWidth: '600px' }}>
            <div className="form-group">
              <label className="form-label">Jenis Tuntutan *</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as ClaimType }))}
              >
                {CLAIM_TYPES.map(type => (
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
    </MainLayout>
  );
}

