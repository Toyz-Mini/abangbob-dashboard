'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { useLeaveRequestsRealtime, useReplacementLeavesRealtime } from '@/lib/supabase/realtime-hooks';
import { getStatusLabel, getStatusColor } from '@/lib/staff-portal-data';
import { getReplacementLeaveStats } from '@/lib/supabase/operations';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from '@/lib/contexts/LanguageContext';
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
import { useAuth } from '@/lib/contexts/AuthContext';

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
  type: 'annual' | 'medical' | 'emergency' | 'unpaid' | 'replacement' | 'compassionate';
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
    annual: 'var(--primary)',
    medical: 'var(--success)',
    emergency: 'var(--warning)',
    unpaid: 'var(--text-secondary)',
    replacement: 'var(--accent)',
    compassionate: 'var(--info)'
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
            style={{ strokeWidth }}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            stroke={colors[type]}
          />
        </svg>
        <div className="leave-progress-center">
          <span className={`leave-progress-value ${type}`} style={{ fontSize: '1.75rem', color: colors[type] }}>{balance}</span>
        </div>
      </div>
      <div className="leave-balance-label">{label}</div>
      <div className="leave-balance-detail">{detail}</div>
    </div>
  );
}

export default function LeavePage() {
  const { t } = useTranslation();
  const { staff, isInitialized } = useStaff();
  const { getLeaveBalance, getStaffLeaveRequests, refreshLeaveRequests } = useStaffPortal();
  const [replacementStats, setReplacementStats] = useState({ available: 0, used: 0, expired: 0, pending: 0 });

  // Realtime subscription for leave requests
  const handleLeaveChange = useCallback(() => {
    console.log('[Realtime] Leave request change detected, refreshing...');
    refreshLeaveRequests();
  }, [refreshLeaveRequests]);

  useLeaveRequestsRealtime(handleLeaveChange);

  const { currentStaff: authStaff, user } = useAuth();
  const staffId = authStaff?.id || user?.id || '';

  // Fetch Replacement Stats
  const loadReplacementStats = useCallback(async () => {
    if (staffId) {
      const stats = await getReplacementLeaveStats(staffId);
      setReplacementStats(stats);
    }
  }, [staffId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReplacementStats();
  }, [loadReplacementStats]);

  useReplacementLeavesRealtime(loadReplacementStats);

  const currentStaff = staff.find(s => s.id === staffId);
  const leaveBalance = getLeaveBalance(staffId);
  const leaveRequests = getStaffLeaveRequests(staffId);

  // Sort by date descending
  const sortedRequests = useMemo(() => {
    return [...leaveRequests].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [leaveRequests]);

  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;

  // Helper to get translated leave type label
  const getTranslatedLeaveType = (type: string) => {
    const rawType = type.toLowerCase().replace('_', '');
    // Map backend types to translation keys
    const mapping: Record<string, string> = {
      'annual': 'annual',
      'medical': 'medical',
      'sick': 'medical',
      'emergency': 'emergency',
      'compassionate': 'compassionate',
      'unpaid': 'unpaid',
      'replacement': 'replacement'
    };

    const key = mapping[rawType] || rawType;
    const translated = t(`staffPortal.leave.types.${key}`);
    // Fallback to raw type if translation key returns itself
    return translated === `staffPortal.leave.types.${key}` ? type : translated;
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
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title" style={{ marginTop: '0.5rem' }}>
                {t('staffPortal.leave.title')}
              </h1>
              <p className="page-subtitle">
                {t('staffPortal.leave.subtitle')}
              </p>
            </div>
            <Link href="/staff-portal/leave/apply" className="btn btn-primary">
              <Plus size={18} />
              {t('staffPortal.leave.apply')}
            </Link>
          </div>
        </div>

        {leaveBalance && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plane size={20} />
                {t('staffPortal.leave.balanceTitle', { year: new Date().getFullYear() })}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 staff-stagger" style={{ gap: '1rem' }}>
              <LeaveBalanceRing
                balance={leaveBalance.annual?.balance ?? 0}
                total={leaveBalance.annual?.entitled ?? 0}
                type="annual"
                label={t('staffPortal.leave.types.annual')}
                detail={`${t('staffPortal.leave.details.taken', { count: leaveBalance.annual?.taken ?? 0 })} | ${t('staffPortal.leave.details.pending', { count: leaveBalance.annual?.pending ?? 0 })}`}
              />

              <LeaveBalanceRing
                balance={replacementStats.available}
                total={replacementStats.available + replacementStats.used}
                type="replacement"
                label={t('staffPortal.leave.types.replacement')}
                detail={`${t('staffPortal.leave.details.available', { count: replacementStats.available })} | ${t('staffPortal.leave.details.used', { count: replacementStats.used })}`}
              />

              <LeaveBalanceRing
                balance={leaveBalance.medical?.balance ?? 0}
                total={leaveBalance.medical?.entitled ?? 0}
                type="medical"
                label={t('staffPortal.leave.types.medical')}
                detail={t('staffPortal.leave.details.taken', { count: leaveBalance.medical?.taken ?? 0 })}
              />

              <LeaveBalanceRing
                balance={leaveBalance.emergency?.balance ?? 0}
                total={leaveBalance.emergency?.entitled ?? 0}
                type="emergency"
                label={t('staffPortal.leave.types.emergency')}
                detail={t('staffPortal.leave.details.taken', { count: leaveBalance.emergency?.taken ?? 0 })}
              />

              <LeaveBalanceRing
                balance={leaveBalance.compassionate?.balance ?? 0}
                total={leaveBalance.compassionate?.entitled ?? 0}
                type="compassionate"
                label={t('staffPortal.leave.types.compassionate')}
                detail={t('staffPortal.leave.details.taken', { count: leaveBalance.compassionate?.taken ?? 0 })}
              />

              <LeaveBalanceRing
                balance={leaveBalance.unpaid?.taken ?? 0}
                total={5}
                type="unpaid"
                label={t('staffPortal.leave.types.unpaid')}
                detail={t('staffPortal.leave.details.takenThisYear')}
              />
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} />
              {t('staffPortal.leave.historyTitle')}
            </div>
            <div className="card-subtitle">{t('staffPortal.leave.historyCount', { count: leaveRequests.length })}</div>
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
                        {getTranslatedLeaveType(request.type)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} />
                        {request.startDate} {request.startDate !== request.endDate && `- ${request.endDate}`}
                        <span style={{ color: 'var(--text-light)' }}>{t('staffPortal.leave.details.days', { count: request.duration })}</span>
                      </div>
                      {request.reason && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                          {t('staffPortal.leave.details.reason', { reason: request.reason })}
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
                          {request.status === 'approved'
                            ? t('staffPortal.leave.details.approvedBy', { name: request.approverName })
                            : t('staffPortal.leave.details.rejectedBy', { name: request.approverName })
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {request.rejectionReason && (
                    <div className="staff-message error" style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.75rem' }}>
                      <XCircle size={14} />
                      {t('staffPortal.leave.details.rejectionReason', { reason: request.rejectionReason })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <Plane size={40} color="var(--gray-300)" style={{ marginBottom: '0.75rem' }} />
              <div>{t('staffPortal.leave.noHistory')}</div>
            </div>
          )}
        </div>

      </div>
    </StaffLayout>
  );
}
