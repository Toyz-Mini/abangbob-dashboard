'use client';

import { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { useStaffRequestsRealtime } from '@/lib/supabase/realtime-hooks';
import { getRequestCategoryLabel, getStatusLabel, getStatusColor } from '@/lib/staff-portal-data';
import { RequestCategory, StaffRequest } from '@/lib/types';
import Modal from '@/components/Modal';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import RequestDetailModal from '@/components/staff-portal/RequestDetailModal';
import {
  FileText,
  Plus,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send
} from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';


const REQUEST_CATEGORIES: RequestCategory[] = [
  'shift_swap',
  'off_day',
  'ot_request',
  'letter',
  'training',
  'equipment',
  'bank_change',
  'other',
];

export default function RequestsPage() {
  const { staff, isInitialized } = useStaff();
  const { getStaffRequestsByStaff, addStaffRequest, refreshStaffRequests } = useStaffPortal();

  // Realtime subscription for staff requests
  const handleStaffRequestsChange = useCallback(() => {
    console.log('[Realtime] Staff request change detected, refreshing...');
    refreshStaffRequests();
  }, [refreshStaffRequests]);

  useStaffRequestsRealtime(handleStaffRequestsChange);

  /* 
   * FIXED: Use real logged in user from AuthContext
   */
  const { currentStaff: authStaff, user } = useAuth();
  const staffId = authStaff?.id || user?.id || '';

  const currentStaff = staff.find(s => s.id === staffId);
  const requests = getStaffRequestsByStaff(staffId);

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: 'letter' as RequestCategory,
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
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

  // State for detail modal
  const [selectedRequest, setSelectedRequest] = useState<StaffRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleViewDetail = (request: StaffRequest) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  // Sort by date descending
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [requests]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setConfirmModal({
        isOpen: true,
        title: 'Maklumat Tidak Lengkap',
        message: 'Sila isi tajuk dan penerangan permohonan anda.',
        type: 'warning',
        showCancel: false,
        confirmText: 'Faham'
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    addStaffRequest({
      staffId: staffId,
      staffName: currentStaff?.name || '',
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      status: 'pending',
    });

    setIsSubmitting(false);
    setShowModal(false);
    setForm({
      category: 'letter',
      title: '',
      description: '',
      priority: 'medium',
    });

    setConfirmModal({
      isOpen: true,
      title: 'Berjaya Dihantar',
      message: 'Permohonan anda telah berjaya dihantar dan akan diproses secepat mungkin.',
      type: 'success',
      showCancel: false,
      confirmText: 'Selesai'
    });
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/staff-portal" className="btn btn-outline btn-sm" style={{ marginBottom: '0.5rem' }}>
              <ArrowLeft size={16} />
              Kembali
            </Link>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>
              Permohonan Lain
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Submit pelbagai jenis permohonan
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Permohonan Baru
          </button>
        </div>

        {/* Requests List */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} />
              Senarai Permohonan
            </div>
            <div className="card-subtitle">{requests.length} permohonan</div>
          </div>

          {sortedRequests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedRequests.map(request => (
                <div
                  key={request.id}
                  onClick={() => handleViewDetail(request)}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--gray-50)',
                    border: '1px solid var(--gray-200)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.backgroundColor = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-200)';
                    e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>
                          {getRequestCategoryLabel(request.category)}
                        </span>
                        <span className={`badge badge-${request.priority === 'high' ? 'danger' : request.priority === 'medium' ? 'warning' : 'info'}`} style={{ fontSize: '0.65rem' }}>
                          {request.priority === 'high' ? 'Urgent' : request.priority === 'medium' ? 'Sederhana' : 'Rendah'}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {request.title}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {request.description}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${getStatusColor(request.status)}`}>
                        {request.status === 'completed' && <CheckCircle size={12} style={{ marginRight: '0.25rem' }} />}
                        {request.status === 'rejected' && <XCircle size={12} style={{ marginRight: '0.25rem' }} />}
                        {request.status === 'pending' && <AlertCircle size={12} style={{ marginRight: '0.25rem' }} />}
                        {getStatusLabel(request.status)}
                      </span>

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                        <Clock size={10} style={{ marginRight: '0.25rem', display: 'inline' }} />
                        {new Date(request.createdAt).toLocaleDateString('ms-MY')}
                      </div>

                      <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.25rem', fontWeight: 500 }}>
                        Lihat Butiran
                      </div>
                    </div>
                  </div>

                  {request.responseNote && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem',
                      background: request.status === 'completed' ? '#dcfce7' : '#fee2e2',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      color: request.status === 'completed' ? '#166534' : '#991b1b'
                    }}>
                      Maklum balas: {request.responseNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Tiada rekod permohonan
            </div>
          )}
        </div>

        {/* Detail Modal */}
        <RequestDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          request={selectedRequest}
        />

        {/* New Request Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => !isSubmitting && setShowModal(false)}
          title="Permohonan Baru"
          maxWidth="500px"
        >
          <div className="form-group">
            <label className="form-label">Kategori *</label>
            <select
              className="form-select"
              value={form.category}
              onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as RequestCategory }))}
            >
              {REQUEST_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {getRequestCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tajuk *</label>
            <input
              type="text"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Contoh: Surat Pengesahan Kerja"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Penerangan *</label>
            <textarea
              className="form-input"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Terangkan permohonan anda..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Prioriti</label>
            <select
              className="form-select"
              value={form.priority}
              onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
            >
              <option value="low">Rendah</option>
              <option value="medium">Sederhana</option>
              <option value="high">Urgent</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Send size={18} />
                  Hantar
                </>
              )}
            </button>
          </div>
        </Modal>

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
      </div>
    </MainLayout>
  );
}
