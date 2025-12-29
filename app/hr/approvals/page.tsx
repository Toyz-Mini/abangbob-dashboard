'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal } from '@/lib/store';
import { useLeaveRequestsRealtime, useClaimRequestsRealtime, useStaffRequestsRealtime } from '@/lib/supabase/realtime-hooks';
import { getLeaveTypeLabel, getClaimTypeLabel, getRequestCategoryLabel, getStatusLabel, getStatusColor } from '@/lib/staff-portal-data';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClaimDetailModal from '@/components/staff-portal/ClaimDetailModal';
import RequestDetailModal from '@/components/staff-portal/RequestDetailModal';
import { ClaimRequest, StaffRequest, OTClaim, SalaryAdvance } from '@/lib/types';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  CheckCircle,
  XCircle,
  Plane,
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
  Calendar,
  UserPlus
} from 'lucide-react';

type TabType = 'leave' | 'claims' | 'ot' | 'advance' | 'requests' | 'newstaff';

export default function ApprovalsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const {
    // Leave
    leaveRequests,
    getPendingLeaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    refreshLeaveRequests,
    // Claims
    claimRequests,
    getPendingClaimRequests,
    approveClaimRequest,
    rejectClaimRequest,
    refreshClaimRequests,
    // Requests
    staffRequests,
    getPendingStaffRequests,
    completeStaffRequest,
    rejectStaffRequest,
    refreshStaffRequests,
    // OT Claims
    otClaims,
    getPendingOTClaims,
    approveOTClaim,
    rejectOTClaim,
    // Salary Advances
    salaryAdvances,
    getPendingSalaryAdvances,
    approveSalaryAdvance,
    rejectSalaryAdvance,
    // Common
    isInitialized
  } = useStaffPortal();

  // Realtime subscriptions for leave and claims
  const handleLeaveChange = useCallback(() => {
    console.log('[Realtime] Leave request change detected, refreshing...');
    refreshLeaveRequests();
  }, [refreshLeaveRequests]);

  const handleClaimChange = useCallback(() => {
    console.log('[Realtime] Claim request change detected, refreshing...');
    refreshClaimRequests();
  }, [refreshClaimRequests]);

  const handleStaffRequestsChange = useCallback(() => {
    console.log('[Realtime] Staff request change detected, refreshing...');
    refreshStaffRequests();
  }, [refreshStaffRequests]);

  useLeaveRequestsRealtime(handleLeaveChange);
  useClaimRequestsRealtime(handleClaimChange);
  useStaffRequestsRealtime(handleStaffRequestsChange);

  const [activeTab, setActiveTab] = useState<TabType>('leave');
  const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending');

  // Read tab from URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['leave', 'claims', 'ot', 'advance', 'requests', 'newstaff'].includes(tab)) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams]);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: TabType; id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Detail Modals State
  const [selectedClaim, setSelectedClaim] = useState<ClaimRequest | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StaffRequest | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Pending New Staff State
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch pending users on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'newstaff') {
      fetchPendingUsers();
    }
  }, [activeTab]);

  const fetchPendingUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/pending-users');
      const data = await res.json();
      setPendingUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'approve' }),
      });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectUser = async (userId: string, reason: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reject', reason }),
      });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setIsProcessing(false);
      setShowRejectModal(false);
    }
  };

  const pendingLeave = getPendingLeaveRequests() || [];
  const pendingClaims = getPendingClaimRequests() || [];
  const pendingOT = getPendingOTClaims() || [];
  const pendingAdvances = getPendingSalaryAdvances() || [];
  const pendingRequests = getPendingStaffRequests() || [];

  // History Data - add defensive checks for arrays
  const historyLeave = (leaveRequests || []).filter(r => r.status !== 'pending').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const historyClaims = (claimRequests || []).filter(r => r.status !== 'pending').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const historyOT = (otClaims || []).filter(r => r.status !== 'pending').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const historyAdvances = (salaryAdvances || []).filter(r => r.status !== 'pending').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const historyRequests = (staffRequests || []).filter(r => {
    if (r.category === 'shift_swap' && r.status === 'in_progress') return false;
    return r.status !== 'pending';
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPending = pendingLeave.length + pendingClaims.length + pendingOT.length + pendingAdvances.length + pendingRequests.length + pendingUsers.length;

  const handleApprove = async (type: TabType, id: string) => {
    if (!user) {
      alert('Sila log masuk untuk membuat kelulusan');
      return;
    }

    const approverId = user.id;
    const approverName = user.name || 'Admin';

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (type === 'leave') {
      approveLeaveRequest(id, approverId, approverName);
    } else if (type === 'claims') {
      approveClaimRequest(id, approverId, approverName);
      setIsClaimModalOpen(false); // Close modal if open
    } else if (type === 'ot') {
      approveOTClaim(id, approverId, approverName);
    } else if (type === 'advance') {
      approveSalaryAdvance(id, approverId, approverName);
    } else {
      completeStaffRequest(id, 'Diluluskan', approverName);
      setIsRequestModalOpen(false); // Close modal if open
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

    if (!user) {
      alert('Sila log masuk untuk membuat kelulusan');
      return;
    }

    const approverId = user.id;
    const approverName = user.name || 'Admin';

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (selectedItem.type === 'leave') {
      rejectLeaveRequest(selectedItem.id, approverId, approverName, rejectReason);
    } else if (selectedItem.type === 'claims') {
      rejectClaimRequest(selectedItem.id, approverId, approverName, rejectReason);
      setIsClaimModalOpen(false);
    } else if (selectedItem.type === 'ot') {
      rejectOTClaim(selectedItem.id, approverId, approverName, rejectReason);
    } else if (selectedItem.type === 'advance') {
      rejectSalaryAdvance(selectedItem.id, approverId, approverName, rejectReason);
    } else if (selectedItem.type === 'newstaff') {
      await handleRejectUser(selectedItem.id, rejectReason);
      return; // handleRejectUser handles its own state cleanup
    } else {
      rejectStaffRequest(selectedItem.id, rejectReason, approverName);
      setIsRequestModalOpen(false);
    }

    setIsProcessing(false);
    setShowRejectModal(false);
    setSelectedItem(null);
  };

  const openClaimDetail = (claim: ClaimRequest) => {
    setSelectedClaim(claim);
    setIsClaimModalOpen(true);
  };

  const openRequestDetail = (request: StaffRequest) => {
    setSelectedRequest(request);
    setIsRequestModalOpen(true);
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

  // Helper to render lists
  const renderList = (data: any[], type: TabType, isHistory: boolean) => {
    if (data.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Tiada rekod {isHistory ? 'history' : 'pending'}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.map(item => (
          <div
            key={item.id}
            onClick={() => {
              if (type === 'claims') openClaimDetail(item);
              if (type === 'requests') openRequestDetail(item);
            }}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)',
              cursor: (type === 'claims' || type === 'requests') ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (type === 'claims' || type === 'requests') {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.backgroundColor = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (type === 'claims' || type === 'requests') {
                e.currentTarget.style.borderColor = 'var(--gray-200)';
                e.currentTarget.style.backgroundColor = 'var(--gray-50)';
              }
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {item.staffName}
                </div>

                {/* Specific details based on type */}
                {type === 'leave' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                        {getLeaveTypeLabel(item.type)}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {item.duration} hari
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} />
                      {item.startDate} - {item.endDate}
                    </div>
                    {item.reason && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                        Sebab: {item.reason}
                      </div>
                    )}
                  </>
                )}

                {type === 'claims' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                        {getClaimTypeLabel(item.type)}
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                        BND {item.amount.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {item.description}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                      <FileText size={10} style={{ display: 'inline', marginRight: '4px' }} />
                      Klik untuk lihat butiran & resit
                    </div>
                  </>
                )}

                {type === 'requests' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                        {getRequestCategoryLabel(item.category)}
                      </span>
                      <span className={`badge badge-${item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'info'}`} style={{ fontSize: '0.65rem' }}>
                        {item.priority === 'high' ? 'Urgent' : item.priority === 'medium' ? 'Sederhana' : 'Rendah'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {item.description}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                      <FileText size={10} style={{ display: 'inline', marginRight: '4px' }} />
                      Klik untuk lihat butiran
                    </div>
                  </>
                )}

                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                  <Clock size={10} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  {new Date(item.createdAt).toLocaleDateString('ms-MY')}
                  {isHistory && (
                    <span className={`badge badge-${getStatusColor(item.status)}`} style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                      {getStatusLabel(item.status)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions - Only for Pending */}
              {!isHistory && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(type, item.id);
                    }}
                    disabled={isProcessing}
                  >
                    <CheckCircle size={16} />
                    {type === 'requests' && item.status === 'pending' ? 'Selesai' : 'Lulus'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRejectModal(type, item.id);
                    }}
                    disabled={isProcessing}
                  >
                    <XCircle size={16} />
                    Tolak
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render OT Claims List
  const renderOTList = (data: OTClaim[], isHistory: boolean) => {
    if (data.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Tiada rekod OT {isHistory ? 'history' : 'pending'}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.map(item => (
          <div
            key={item.id}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {item.staffName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                    {item.hoursWorked.toFixed(1)} jam
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                    BND {item.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} />
                  {new Date(item.date).toLocaleDateString('ms-MY')} | {item.startTime} - {item.endTime}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Sebab: {item.reason}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                  <Clock size={10} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  {new Date(item.createdAt).toLocaleDateString('ms-MY')}
                  {isHistory && (
                    <span className={`badge badge-${item.status === 'approved' || item.status === 'paid' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}`} style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                      {item.status === 'approved' ? 'Diluluskan' : item.status === 'rejected' ? 'Ditolak' : item.status === 'paid' ? 'Dibayar' : 'Menunggu'}
                    </span>
                  )}
                </div>
                {item.status === 'rejected' && item.rejectionReason && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                    Sebab ditolak: {item.rejectionReason}
                  </div>
                )}
              </div>

              {/* Actions - Only for Pending */}
              {!isHistory && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleApprove('ot', item.id)}
                    disabled={isProcessing}
                  >
                    <CheckCircle size={16} />
                    Lulus
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => openRejectModal('ot', item.id)}
                    disabled={isProcessing}
                  >
                    <XCircle size={16} />
                    Tolak
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Salary Advance List
  const renderAdvanceList = (data: SalaryAdvance[], isHistory: boolean) => {
    if (data.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Tiada permohonan pendahuluan gaji {isHistory ? 'history' : 'pending'}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.map(item => (
          <div
            key={item.id}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {item.staffName}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                  BND {item.amount.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Sebab: {item.reason}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                  <Clock size={10} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  {new Date(item.createdAt).toLocaleDateString('ms-MY')}
                  {isHistory && (
                    <span className={`badge badge-${item.status === 'approved' || item.status === 'deducted' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}`} style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                      {item.status === 'approved' ? 'Diluluskan' : item.status === 'rejected' ? 'Ditolak' : item.status === 'deducted' ? 'Dipotong' : 'Menunggu'}
                    </span>
                  )}
                </div>
                {item.status === 'rejected' && item.rejectionReason && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                    Sebab ditolak: {item.rejectionReason}
                  </div>
                )}
                {item.status === 'deducted' && item.deductedMonth && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                    Dipotong: Bulan {item.deductedMonth}
                  </div>
                )}
              </div>

              {/* Actions - Only for Pending */}
              {!isHistory && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleApprove('advance', item.id)}
                    disabled={isProcessing}
                  >
                    <CheckCircle size={16} />
                    Lulus
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => openRejectModal('advance', item.id)}
                    disabled={isProcessing}
                  >
                    <XCircle size={16} />
                    Tolak
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Approval Center
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {totalPending} permohonan menunggu kelulusan
            </p>
          </div>

          <div style={{ display: 'flex', background: 'var(--gray-100)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'pending' ? 'btn-white shadow-sm' : 'btn-ghost'}`}
              onClick={() => setViewMode('pending')}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              Menunggu ({totalPending})
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'history' ? 'btn-white shadow-sm' : 'btn-ghost'}`}
              onClick={() => setViewMode('history')}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              Sejarah
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'leave' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('leave')}
          >
            <Plane size={18} />
            Cuti {viewMode === 'pending' ? `(${pendingLeave.length})` : ''}
          </button>
          <button
            className={`btn ${activeTab === 'claims' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('claims')}
          >
            <DollarSign size={18} />
            Tuntutan {viewMode === 'pending' ? `(${pendingClaims.length})` : ''}
          </button>
          <button
            className={`btn ${activeTab === 'ot' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('ot')}
          >
            <Clock size={18} />
            OT Claims {viewMode === 'pending' ? `(${pendingOT.length})` : ''}
          </button>
          <button
            className={`btn ${activeTab === 'advance' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('advance')}
          >
            <DollarSign size={18} />
            Pendahuluan {viewMode === 'pending' ? `(${pendingAdvances.length})` : ''}
          </button>
          <button
            className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('requests')}
          >
            <FileText size={18} />
            Permohonan Lain {viewMode === 'pending' ? `(${pendingRequests.length})` : ''}
          </button>
          <button
            className={`btn ${activeTab === 'newstaff' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('newstaff')}
          >
            <UserPlus size={18} />
            Staff Baru {viewMode === 'pending' ? `(${pendingUsers.length})` : ''}
          </button>
        </div>

        {/* Content */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {viewMode === 'pending' ? (
                <AlertCircle size={20} color="var(--warning)" />
              ) : (
                <Clock size={20} color="var(--text-secondary)" />
              )}
              {viewMode === 'pending' ? 'Menunggu Kelulusan' : 'Sejarah Permohonan'}
            </div>
          </div>

          {activeTab === 'leave' && renderList(viewMode === 'pending' ? pendingLeave : historyLeave, 'leave', viewMode === 'history')}
          {activeTab === 'claims' && renderList(viewMode === 'pending' ? pendingClaims : historyClaims, 'claims', viewMode === 'history')}
          {activeTab === 'ot' && renderOTList(viewMode === 'pending' ? pendingOT : historyOT, viewMode === 'history')}
          {activeTab === 'advance' && renderAdvanceList(viewMode === 'pending' ? pendingAdvances : historyAdvances, viewMode === 'history')}
          {activeTab === 'requests' && renderList(viewMode === 'pending' ? pendingRequests : historyRequests, 'requests', viewMode === 'history')}

          {/* New Staff Registration Tab */}
          {activeTab === 'newstaff' && (
            <div>
              {isLoadingUsers ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <LoadingSpinner />
                </div>
              ) : pendingUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  <UserPlus size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p>Tiada staff baru menunggu kelulusan</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pendingUsers.map(user => (
                    <div
                      key={user.id}
                      style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--gray-50)',
                        border: '1px solid var(--gray-200)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                            {user.name}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <span>📧 {user.email}</span>
                            {user.phone && <span>📱 {user.phone}</span>}
                            {user.icNumber && <span>🪪 {user.icNumber}</span>}
                          </div>
                          {user.address && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                              📍 {user.address}
                            </div>
                          )}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                            <Clock size={10} style={{ display: 'inline', marginRight: '0.25rem' }} />
                            Didaftar: {new Date(user.createdAt).toLocaleDateString('ms-MY')}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApproveUser(user.id)}
                            disabled={isProcessing}
                          >
                            <CheckCircle size={16} />
                            Luluskan
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setSelectedItem({ type: 'newstaff', id: user.id });
                              setRejectReason('');
                              setShowRejectModal(true);
                            }}
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
              )}
            </div>
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

        {/* Claim Detail Modal */}
        <ClaimDetailModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          claim={selectedClaim}
          isApprover={true}
          isProcessing={isProcessing}
          onApprove={(id) => handleApprove('claims', id)}
          onReject={(id) => openRejectModal('claims', id)}
        />

        {/* Request Detail Modal */}
        <RequestDetailModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          request={selectedRequest}
          isApprover={true}
          isProcessing={isProcessing}
          onApprove={(id) => handleApprove('requests', id)}
          onReject={(id) => openRejectModal('requests', id)}
        />
      </div>
    </MainLayout>
  );
}
