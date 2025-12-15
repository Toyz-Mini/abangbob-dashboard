'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import DataTable, { Column } from '@/components/DataTable';
import StatCard from '@/components/StatCard';
import { useOrderHistory } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { VoidRefundRequest, OrderHistoryItem } from '@/lib/types';
import { canApproveVoidRefund } from '@/lib/permissions';
import { getVoidRefundTypeLabel } from '@/lib/order-history-data';
import LoadingSpinner from '@/components/LoadingSpinner';
import OrderDetailModal from '@/components/order-history/OrderDetailModal';
import PendingApprovalsPanel from '@/components/order-history/PendingApprovalsPanel';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  DollarSign,
  Filter,
  Eye,
  Calendar,
} from 'lucide-react';

export default function RefundApprovalsPage() {
  const {
    voidRefundRequests,
    getOrderById,
    getPendingVoidRefundRequests,
    getPendingVoidRefundCount,
    approveVoidRefund,
    rejectVoidRefund,
    isInitialized,
  } = useOrderHistory();
  const { currentStaff } = useAuth();
  const { t } = useTranslation();

  // State
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Get user role
  const userRole = currentStaff?.role || 'Staff';
  const canApprove = canApproveVoidRefund(userRole);

  // Redirect if not authorized
  if (!canApprove) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </MainLayout>
    );
  }

  // Get pending requests
  const pendingRequests = getPendingVoidRefundRequests();
  const pendingCount = getPendingVoidRefundCount();

  // Get filtered requests
  const filteredRequests = useMemo(() => {
    let requests = [...voidRefundRequests];
    
    if (filterStatus !== 'all') {
      requests = requests.filter(r => r.status === filterStatus);
    }
    
    return requests.sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }, [voidRefundRequests, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const pending = voidRefundRequests.filter(r => r.status === 'pending');
    const approved = voidRefundRequests.filter(r => r.status === 'approved');
    const rejected = voidRefundRequests.filter(r => r.status === 'rejected');
    
    return {
      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      pendingAmount: pending.reduce((sum, r) => sum + (r.amount || 0), 0),
    };
  }, [voidRefundRequests]);

  // Handle view order details
  const handleViewOrder = (request: VoidRefundRequest) => {
    const order = getOrderById(request.orderId);
    if (order) {
      setSelectedOrder(order);
      setShowDetailModal(true);
    }
  };

  // Table columns
  const columns: Column<VoidRefundRequest>[] = [
    {
      id: 'orderNumber',
      header: 'Order ID',
      accessor: 'orderNumber',
      sortable: true,
    },
    {
      id: 'type',
      header: 'Jenis',
      accessor: (row) => (
        <span 
          style={{ 
            fontWeight: 600,
            color: row.type === 'void' ? 'var(--danger)' : 'var(--warning)',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
          }}
        >
          {getVoidRefundTypeLabel(row.type)}
        </span>
      ),
    },
    {
      id: 'requestedAt',
      header: 'Tarikh Permintaan',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
            {new Date(row.requestedAt).toLocaleDateString('ms-MY')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {new Date(row.requestedAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'requestedByName',
      header: 'Diminta Oleh',
      accessor: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <User size={14} style={{ color: 'var(--text-secondary)' }} />
          <span>{row.requestedByName}</span>
        </div>
      ),
    },
    {
      id: 'reason',
      header: 'Sebab',
      accessor: (row) => (
        <div style={{ maxWidth: '250px', fontSize: '0.875rem' }}>
          {row.reason.length > 50 ? `${row.reason.substring(0, 50)}...` : row.reason}
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Jumlah',
      accessor: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--danger)' }}>
          BND {(row.amount || 0).toFixed(2)}
        </span>
      ),
      sortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => {
        let color = 'var(--text-secondary)';
        let icon = <Clock size={14} />;
        let label = 'Pending';
        
        if (row.status === 'approved') {
          color = 'var(--success)';
          icon = <CheckCircle size={14} />;
          label = 'Diluluskan';
        } else if (row.status === 'rejected') {
          color = 'var(--danger)';
          icon = <XCircle size={14} />;
          label = 'Ditolak';
        } else if (row.status === 'pending') {
          color = 'var(--warning)';
        }
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color }}>
            {icon}
            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{label}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Tindakan',
      accessor: (row) => (
        <button
          className="btn btn-sm btn-outline"
          onClick={(e) => {
            e.stopPropagation();
            handleViewOrder(row);
          }}
        >
          <Eye size={14} />
          Lihat
        </button>
      ),
    },
  ];

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <RefreshCw size={28} />
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                Refund & Void Approvals
              </h1>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
                Urus permintaan void dan refund dari staff
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label="Pending Approval"
            value={stats.pendingCount}
            change={`BND ${stats.pendingAmount.toFixed(2)}`}
            changeType="neutral"
            icon={Clock}
            gradient="primary"
          />
          <StatCard
            label="Diluluskan"
            value={stats.approvedCount}
            icon={CheckCircle}
            gradient="peach"
          />
          <StatCard
            label="Ditolak"
            value={stats.rejectedCount}
            icon={XCircle}
          />
          <StatCard
            label="Jumlah Permintaan"
            value={voidRefundRequests.length}
            icon={RefreshCw}
            gradient="info"
          />
        </div>

        {/* Pending Approvals Panel */}
        {pendingCount > 0 && (
          <PendingApprovalsPanel
            requests={pendingRequests}
            onApprove={(requestId) => {
              if (currentStaff) {
                approveVoidRefund(requestId, currentStaff.id, currentStaff.name);
              }
            }}
            onReject={(requestId, reason) => {
              if (currentStaff) {
                rejectVoidRefund(requestId, currentStaff.id, currentStaff.name, reason);
              }
            }}
          />
        )}

        {/* Empty State for No Pending */}
        {pendingCount === 0 && (
          <div className="card mb-lg" style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Tiada Permintaan Pending</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Semua permintaan void dan refund telah diproses.
            </p>
          </div>
        )}

        {/* All Requests Table */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="card-title">Semua Permintaan</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Filter:
                </span>
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  style={{ width: 'auto', padding: '0.375rem 0.75rem' }}
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Diluluskan</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
            </div>
          </div>
          <DataTable
            data={filteredRequests as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            keyField="id"
            searchable
            searchPlaceholder="Cari order ID, nama staff, sebab..."
            pagination
            pageSize={10}
            emptyMessage={
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <RefreshCw size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                <p>Tiada permintaan dijumpai</p>
              </div>
            }
          />
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <OrderDetailModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
            userRole={userRole}
            currentStaffId={currentStaff?.id}
            currentStaffName={currentStaff?.name}
            onVoidRequest={() => {}}
            onRefundRequest={() => {}}
          />
        )}
      </div>
    </MainLayout>
  );
}
