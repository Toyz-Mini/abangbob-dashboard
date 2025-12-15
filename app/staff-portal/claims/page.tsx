'use client';

import { useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal, useStaff } from '@/lib/store';
import { getClaimTypeLabel, getStatusLabel, getStatusColor } from '@/lib/staff-portal-data';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import StaffPortalNav from '@/components/StaffPortalNav';
import {
  DollarSign,
  Plus,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  Wallet,
  CreditCard
} from 'lucide-react';

// Demo: Using staff ID 2 as the logged-in user
const CURRENT_STAFF_ID = '2';

export default function ClaimsPage() {
  const { staff, isInitialized } = useStaff();
  const { getStaffClaimRequests } = useStaffPortal();

  const currentStaff = staff.find(s => s.id === CURRENT_STAFF_ID);
  const claimRequests = getStaffClaimRequests(CURRENT_STAFF_ID);

  // Sort by date descending
  const sortedRequests = useMemo(() => {
    return [...claimRequests].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [claimRequests]);

  // Stats
  const pendingTotal = claimRequests.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const approvedTotal = claimRequests.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0);
  const paidTotal = claimRequests.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const pendingCount = claimRequests.filter(c => c.status === 'pending').length;

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
              <Link href="/staff-portal" className="btn btn-outline btn-sm" style={{ marginBottom: '0.5rem' }}>
                <ArrowLeft size={16} />
                Kembali
              </Link>
              <h1 className="page-title" style={{ marginTop: '0.5rem' }}>
                Tuntutan Saya
              </h1>
              <p className="page-subtitle">
                Submit dan track tuntutan
              </p>
            </div>
            <Link href="/staff-portal/claims/new" className="btn btn-primary">
              <Plus size={18} />
              Tuntutan Baru
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 staff-stagger" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="staff-stat-card warm">
            <div className="staff-stat-icon warm">
              <AlertCircle size={24} />
            </div>
            <div className="staff-stat-value">BND {pendingTotal.toFixed(2)}</div>
            <div className="staff-stat-label">Menunggu Kelulusan</div>
          </div>

          <div className="staff-stat-card success">
            <div className="staff-stat-icon success">
              <CheckCircle size={24} />
            </div>
            <div className="staff-stat-value">BND {approvedTotal.toFixed(2)}</div>
            <div className="staff-stat-label">Diluluskan</div>
          </div>

          <div className="staff-stat-card cool">
            <div className="staff-stat-icon cool">
              <Wallet size={24} />
            </div>
            <div className="staff-stat-value">BND {paidTotal.toFixed(2)}</div>
            <div className="staff-stat-label">Telah Dibayar</div>
          </div>
        </div>

        {/* Claims List */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={20} />
              Senarai Tuntutan
            </div>
            <div className="card-subtitle">{claimRequests.length} tuntutan</div>
          </div>

          {sortedRequests.length > 0 ? (
            <div className="staff-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedRequests.map(claim => (
                <div
                  key={claim.id}
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
                        {getClaimTypeLabel(claim.type)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {claim.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                        Tarikh claim: {claim.claimDate}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '0.25rem'
                      }}>
                        BND {claim.amount.toFixed(2)}
                      </div>
                      <span className={`badge badge-${getStatusColor(claim.status)}`}>
                        {claim.status === 'approved' && <CheckCircle size={12} style={{ marginRight: '0.25rem' }} />}
                        {claim.status === 'rejected' && <XCircle size={12} style={{ marginRight: '0.25rem' }} />}
                        {claim.status === 'pending' && <AlertCircle size={12} style={{ marginRight: '0.25rem' }} />}
                        {claim.status === 'paid' && <DollarSign size={12} style={{ marginRight: '0.25rem' }} />}
                        {getStatusLabel(claim.status)}
                      </span>

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <Clock size={10} />
                        {new Date(claim.createdAt).toLocaleDateString('ms-MY')}
                      </div>
                    </div>
                  </div>

                  {claim.rejectionReason && (
                    <div className="staff-message error" style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.75rem' }}>
                      <XCircle size={14} />
                      Sebab ditolak: {claim.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <Receipt size={40} color="var(--gray-300)" style={{ marginBottom: '0.75rem' }} />
              <div>Tiada rekod tuntutan</div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <StaffPortalNav pendingCount={pendingCount} />
      </div>
    </MainLayout>
  );
}
