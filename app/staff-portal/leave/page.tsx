'use client';

import { useMemo, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { useLeaveRequestsRealtime } from '@/lib/supabase/realtime-hooks';
import { getLeaveTypeLabel, getStatusLabel, getStatusColor } from '@/lib/staff-portal-data';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import StaffPortalNav from '@/components/StaffPortalNav';
import {
  Plane,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import PremiumBackButton from '@/components/PremiumBackButton';

// Demo: Using staff ID 2 as the logged-in user
const CURRENT_STAFF_ID = '2';

// Leave Balance Ring Component
function LeaveBalanceRing({
  balance,
  total,
  type,
  label,
  detail
}: {
  balance: number;
  total: number;
  type: 'annual' | 'medical' | 'emergency' | 'unpaid';
  label: string;
  detail: string;
}) {
  const percentage = total > 0 ? (balance / total) * 100 : 0;
  const size = 90;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colors = {
    annual: '#6366f1',
    medical: '#3b82f6',
    emergency: '#f59e0b',
    unpaid: '#94a3b8'
  };

  return (
    <div className="leave-balance-card">
      <div className="leave-progress-ring" style={{ width: size, height: size }}>
        <svg style={{ width: size, height: size }}>
          <circle
            className="progress-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            style={{ strokeWidth }}
          />
          <circle
            className={`progress-fill ${type}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ strokeWidth }}
          />
        </svg>
        <div className="leave-progress-center">
          <span className={`leave-progress-value ${type}`} style={{ fontSize: '1.75rem' }}>{balance}</span>
        </div>
      </div>
      <div className="leave-balance-label">{label}</div>
      <div className="leave-balance-detail">{detail}</div>
    </div>
  );
}

export default function LeavePage() {
  const { staff, isInitialized } = useStaff();
  const { getLeaveBalance, getStaffLeaveRequests, refreshLeaveRequests } = useStaffPortal();

  // Realtime subscription for leave requests
  const handleLeaveChange = useCallback(() => {
    console.log('[Realtime] Leave request change detected, refreshing...');
    refreshLeaveRequests();
  }, [refreshLeaveRequests]);

  useLeaveRequestsRealtime(handleLeaveChange);

  const currentStaff = staff.find(s => s.id === CURRENT_STAFF_ID);
  const leaveBalance = getLeaveBalance(CURRENT_STAFF_ID);
  const leaveRequests = getStaffLeaveRequests(CURRENT_STAFF_ID);

  // Sort by date descending
  const sortedRequests = useMemo(() => {
    return [...leaveRequests].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [leaveRequests]);

  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;

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
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <PremiumBackButton href="/staff-portal" label="Kembali ke Portal" />
              <h1 className="page-title" style={{ marginTop: '0.5rem' }}>
                Pengurusan Cuti
              </h1>
              <p className="page-subtitle">
                Lihat baki dan mohon cuti
              </p>
            </div>
            <Link href="/staff-portal/leave/apply" className="btn btn-primary">
              <Plus size={18} />
              Mohon Cuti
            </Link>
          </div>
        </div>

        {/* Leave Balance Cards */}
        {leaveBalance && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plane size={20} />
                Baki Cuti {new Date().getFullYear()}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 staff-stagger" style={{ gap: '1rem' }}>
              <LeaveBalanceRing
                balance={leaveBalance.annual.balance}
                total={leaveBalance.annual.entitled}
                type="annual"
                label="Cuti Tahunan"
                detail={`Diambil: ${leaveBalance.annual.taken} | Pending: ${leaveBalance.annual.pending}`}
              />

              <LeaveBalanceRing
                balance={leaveBalance.medical.balance}
                total={leaveBalance.medical.entitled}
                type="medical"
                label="Cuti Sakit"
                detail={`Diambil: ${leaveBalance.medical.taken}`}
              />

              <LeaveBalanceRing
                balance={leaveBalance.emergency.balance}
                total={leaveBalance.emergency.entitled}
                type="emergency"
                label="Cuti Kecemasan"
                detail={`Diambil: ${leaveBalance.emergency.taken}`}
              />

              <LeaveBalanceRing
                balance={leaveBalance.unpaid.taken}
                total={5}
                type="unpaid"
                label="Tanpa Gaji"
                detail="Diambil tahun ini"
              />
            </div>
          </div>
        )}

        {/* Leave Requests History */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} />
              Sejarah Permohonan
            </div>
            <div className="card-subtitle">{leaveRequests.length} permohonan</div>
          </div>

          {sortedRequests.length > 0 ? (
            <div className="staff-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedRequests.map(request => (
                <div
                  key={request.id}
                  className="staff-info-row"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {getLeaveTypeLabel(request.type)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} />
                        {request.startDate} {request.startDate !== request.endDate && `- ${request.endDate}`}
                        <span style={{ color: 'var(--text-light)' }}>({request.duration} hari)</span>
                      </div>
                      {request.reason && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                          Sebab: {request.reason}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${getStatusColor(request.status)}`}>
                        {request.status === 'approved' && <CheckCircle size={12} style={{ marginRight: '0.25rem' }} />}
                        {request.status === 'rejected' && <XCircle size={12} style={{ marginRight: '0.25rem' }} />}
                        {request.status === 'pending' && <AlertCircle size={12} style={{ marginRight: '0.25rem' }} />}
                        {getStatusLabel(request.status)}
                      </span>

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                        <Clock size={10} style={{ marginRight: '0.25rem', display: 'inline' }} />
                        {new Date(request.createdAt).toLocaleDateString('ms-MY')}
                      </div>

                      {request.approverName && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                          {request.status === 'approved' ? 'Diluluskan' : 'Ditolak'} oleh: {request.approverName}
                        </div>
                      )}
                    </div>
                  </div>

                  {request.rejectionReason && (
                    <div className="staff-message error" style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.75rem' }}>
                      <XCircle size={14} />
                      Sebab ditolak: {request.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <Plane size={40} color="var(--gray-300)" style={{ marginBottom: '0.75rem' }} />
              <div>Tiada rekod permohonan cuti</div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <StaffPortalNav currentPage="leave" pendingCount={pendingCount} />
      </div>
    </MainLayout>
  );
}
