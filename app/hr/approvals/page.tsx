'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal } from '@/lib/store';
import { getLeaveTypeLabel, getClaimTypeLabel, getRequestCategoryLabel, getStatusLabel, getStatusColor } from '@/lib/staff-portal-data';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  CheckCircle, 
  XCircle,
  Plane,
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
  Calendar
} from 'lucide-react';

// Demo: Using staff ID 1 (Manager) as the logged-in approver
const CURRENT_APPROVER_ID = '1';
const CURRENT_APPROVER_NAME = 'Ahmad Bin Hassan';

type TabType = 'leave' | 'claims' | 'requests';

export default function ApprovalsPage() {
  const { 
    getPendingLeaveRequests,
    getPendingClaimRequests,
    getPendingStaffRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    approveClaimRequest,
    rejectClaimRequest,
    completeStaffRequest,
    rejectStaffRequest,
    isInitialized 
  } = useStaffPortal();

  const [activeTab, setActiveTab] = useState<TabType>('leave');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: TabType; id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingLeave = getPendingLeaveRequests();
  const pendingClaims = getPendingClaimRequests();
  const pendingRequests = getPendingStaffRequests();

  const totalPending = pendingLeave.length + pendingClaims.length + pendingRequests.length;

  const handleApprove = async (type: TabType, id: string) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (type === 'leave') {
      approveLeaveRequest(id, CURRENT_APPROVER_ID, CURRENT_APPROVER_NAME);
    } else if (type === 'claims') {
      approveClaimRequest(id, CURRENT_APPROVER_ID, CURRENT_APPROVER_NAME);
    } else {
      completeStaffRequest(id, 'Diluluskan');
    }

    setIsProcessing(false);
  };

  const openRejectModal = (type: TabType, id: string) => {
    setSelectedItem({ type, id });
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectReason.trim()) {
      alert('Sila masukkan sebab penolakan');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (selectedItem.type === 'leave') {
      rejectLeaveRequest(selectedItem.id, CURRENT_APPROVER_ID, CURRENT_APPROVER_NAME, rejectReason);
    } else if (selectedItem.type === 'claims') {
      rejectClaimRequest(selectedItem.id, CURRENT_APPROVER_ID, CURRENT_APPROVER_NAME, rejectReason);
    } else {
      rejectStaffRequest(selectedItem.id, rejectReason);
    }

    setIsProcessing(false);
    setShowRejectModal(false);
    setSelectedItem(null);
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
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Approval Center
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {totalPending} permohonan menunggu kelulusan
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'leave' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('leave')}
          >
            <Plane size={18} />
            Cuti ({pendingLeave.length})
          </button>
          <button
            className={`btn ${activeTab === 'claims' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('claims')}
          >
            <DollarSign size={18} />
            Tuntutan ({pendingClaims.length})
          </button>
          <button
            className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('requests')}
          >
            <FileText size={18} />
            Permohonan Lain ({pendingRequests.length})
          </button>
        </div>

        {/* Content */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} color="var(--warning)" />
              Menunggu Kelulusan
            </div>
          </div>

          {/* Leave Tab */}
          {activeTab === 'leave' && (
            pendingLeave.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingLeave.map(request => (
                  <div 
                    key={request.id}
                    style={{ 
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--gray-50)',
                      border: '1px solid var(--gray-200)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                          {request.staffName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            {getLeaveTypeLabel(request.type)}
                          </span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {request.duration} hari
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={14} />
                          {request.startDate} - {request.endDate}
                        </div>
                        {request.reason && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                            Sebab: {request.reason}
                          </div>
                        )}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                          <Clock size={10} style={{ display: 'inline', marginRight: '0.25rem' }} />
                          Dihantar: {new Date(request.createdAt).toLocaleDateString('ms-MY')}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove('leave', request.id)}
                          disabled={isProcessing}
                        >
                          <CheckCircle size={16} />
                          Lulus
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => openRejectModal('leave', request.id)}
                          disabled={isProcessing}
                        >
                          <XCircle size={16} />
                          Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Tiada permohonan cuti pending
              </div>
            )
          )}

          {/* Claims Tab */}
          {activeTab === 'claims' && (
            pendingClaims.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingClaims.map(claim => (
                  <div 
                    key={claim.id}
                    style={{ 
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--gray-50)',
                      border: '1px solid var(--gray-200)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                          {claim.staffName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            {getClaimTypeLabel(claim.type)}
                          </span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                            BND {claim.amount.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {claim.description}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                          Tarikh: {claim.claimDate}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove('claims', claim.id)}
                          disabled={isProcessing}
                        >
                          <CheckCircle size={16} />
                          Lulus
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => openRejectModal('claims', claim.id)}
                          disabled={isProcessing}
                        >
                          <XCircle size={16} />
                          Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Tiada tuntutan pending
              </div>
            )
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            pendingRequests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingRequests.map(request => (
                  <div 
                    key={request.id}
                    style={{ 
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--gray-50)',
                      border: '1px solid var(--gray-200)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                          {request.staffName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                            {getRequestCategoryLabel(request.category)}
                          </span>
                          <span className={`badge badge-${request.priority === 'high' ? 'danger' : request.priority === 'medium' ? 'warning' : 'info'}`} style={{ fontSize: '0.65rem' }}>
                            {request.priority === 'high' ? 'Urgent' : request.priority === 'medium' ? 'Sederhana' : 'Rendah'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                          {request.title}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {request.description}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove('requests', request.id)}
                          disabled={isProcessing}
                        >
                          <CheckCircle size={16} />
                          Selesai
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => openRejectModal('requests', request.id)}
                          disabled={isProcessing}
                        >
                          <XCircle size={16} />
                          Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Tiada permohonan pending
              </div>
            )
          )}
        </div>

        {/* Reject Modal */}
        <Modal
          isOpen={showRejectModal}
          onClose={() => !isProcessing && setShowRejectModal(false)}
          title="Tolak Permohonan"
          maxWidth="400px"
        >
          <div className="form-group">
            <label className="form-label">Sebab Penolakan *</label>
            <textarea
              className="form-input"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Nyatakan sebab penolakan..."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => setShowRejectModal(false)}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              className="btn btn-danger"
              onClick={handleReject}
              disabled={isProcessing}
              style={{ flex: 1 }}
            >
              {isProcessing ? <LoadingSpinner size="sm" /> : 'Tolak'}
            </button>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}


