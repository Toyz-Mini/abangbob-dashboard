'use client';

import { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import StatCard from '@/components/StatCard';
import { useOrders, useOrderHistory } from '@/lib/store';
import { useOrdersRealtime, useVoidRefundRealtime } from '@/lib/supabase/realtime-hooks';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { OrderHistoryItem, OrderHistoryFilters, VoidRefundRequest, Order } from '@/lib/types';
import { canApproveVoidRefund, canViewAllOrders, canExport } from '@/lib/permissions';
import { getOrderStatusColor, getOrderStatusLabel, getPaymentMethodLabel, getOrderTypeLabel, getVoidRefundTypeLabel } from '@/lib/order-history-data';
import { exportToCSV } from '@/lib/services/excel-export';
import LoadingSpinner from '@/components/LoadingSpinner';
import OrderDetailModal from '@/components/order-history/OrderDetailModal';
import VoidRefundModal from '@/components/order-history/VoidRefundModal';
import OrderStatusBadge from '@/components/order-history/OrderStatusBadge';
import PendingApprovalsPanel from '@/components/order-history/PendingApprovalsPanel';
import {
  History,
  Calendar,
  DollarSign,
  FileText,
  Download,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  ShoppingCart
} from 'lucide-react';
import LivePageHeader from '@/components/LivePageHeader';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';

export default function OrderHistoryPage() {
  // Use orders from Supabase-synced store
  const { orders, refreshOrders, isInitialized: ordersInitialized } = useOrders();

  // Keep void/refund functionality from orderHistory
  const {
    getPendingVoidRefundRequests,
    getPendingVoidRefundCount,
    approveVoidRefund,
    rejectVoidRefund,
    refreshVoidRefundRequests,
    isInitialized: historyInitialized,
    voidRefundRequests,
  } = useOrderHistory();

  const { currentStaff } = useAuth();
  const { t } = useTranslation();

  // Handle realtime order changes - refresh when new orders come in
  const handleOrderChange = useCallback(() => {
    console.log('[Realtime] Order change detected, refreshing...');
    refreshOrders();
  }, [refreshOrders]);

  // Handle realtime void/refund changes - refresh when requests change
  const handleVoidRefundChange = useCallback(() => {
    console.log('[Realtime] Void/refund change detected, refreshing...');
    refreshVoidRefundRequests();
  }, [refreshVoidRefundRequests]);

  // Subscribe to realtime order changes
  useOrdersRealtime(handleOrderChange);

  // Subscribe to realtime void/refund changes
  useVoidRefundRealtime(handleVoidRefundChange);

  // State
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVoidRefundModal, setShowVoidRefundModal] = useState(false);
  const [voidRefundMode, setVoidRefundMode] = useState<'void' | 'refund'>('refund');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState<Partial<OrderHistoryFilters>>({
    status: 'all',
    paymentMethod: 'all',
    orderType: 'all',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    searchQuery: '',
  });

  // Get user role
  const userRole = currentStaff?.role || 'Staff';
  const canApprove = canApproveVoidRefund(userRole);
  const canViewAll = canViewAllOrders(userRole);
  const canExportData = canExport(userRole, 'order-history');

  // TEMPORARY DEBUG: Expose request count to UI
  if (typeof window !== 'undefined') {
    (window as any).__DEBUG_REQUESTS__ = voidRefundRequests;
  }

  // Convert orders to OrderHistoryItem format and apply filters
  const filteredOrders = useMemo(() => {
    // Transform orders to OrderHistoryItem format
    let historyItems: OrderHistoryItem[] = orders.map((order: Order) => {
      // Find relevant void/refund requests
      // We prioritize approved requests to show actual status
      const approvedRequests = voidRefundRequests.filter(r =>
        r.orderId === order.id &&
        (r.status === 'approved' || r.status?.toLowerCase() === 'approved')
      );

      let voidRefundStatus: 'none' | 'pending_void' | 'pending_refund' | 'voided' | 'refunded' | 'partial_refund' = 'none';
      let refundAmount = 0;

      if (approvedRequests.length > 0) {
        // Check for void (highest priority)
        const hasVoid = approvedRequests.some(r => r.type === 'void');
        if (hasVoid) {
          voidRefundStatus = 'voided';
        } else {
          // Check for refunds
          const hasRefund = approvedRequests.some(r => r.type === 'refund');
          const hasPartial = approvedRequests.some(r => r.type === 'partial_refund');

          if (hasRefund) voidRefundStatus = 'refunded';
          else if (hasPartial) voidRefundStatus = 'partial_refund';

          // Calculate total refunded amount
          refundAmount = approvedRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
        }
      }

      return {
        ...order,
        voidRefundStatus,
        refundAmount,
        cashierId: order.staffId,
        cashierName: order.staffId || 'Unknown',
      };
    });

    // Apply date filter
    if (filters.dateRange?.start && filters.dateRange?.end) {
      historyItems = historyItems.filter(o => {
        const orderDate = o.createdAt.split('T')[0];
        return orderDate >= filters.dateRange!.start && orderDate <= filters.dateRange!.end;
      });
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      historyItems = historyItems.filter(o => o.status === filters.status);
    }

    // Apply payment method filter
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      historyItems = historyItems.filter(o => o.paymentMethod === filters.paymentMethod);
    }

    // Apply order type filter
    if (filters.orderType && filters.orderType !== 'all') {
      historyItems = historyItems.filter(o => o.orderType === filters.orderType);
    }

    // If staff, only show their own orders
    if (!canViewAll && currentStaff) {
      historyItems = historyItems.filter(o => o.cashierId === currentStaff.id);
    }

    // Sort by date descending
    historyItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return historyItems;
  }, [orders, filters, canViewAll, currentStaff, voidRefundRequests]);

  // Get pending requests for Manager/Admin
  const pendingRequests = getPendingVoidRefundRequests();
  const pendingCount = getPendingVoidRefundCount();

  // Stats
  const stats = useMemo(() => {
    const completed = filteredOrders.filter(o => o.status === 'completed' && o.voidRefundStatus === 'none');
    const voided = filteredOrders.filter(o => o.voidRefundStatus === 'voided');
    const refunded = filteredOrders.filter(o => o.voidRefundStatus === 'refunded' || o.voidRefundStatus === 'partial_refund');
    const totalSales = completed.reduce((sum, o) => sum + o.total, 0);
    const refundedAmount = refunded.reduce((sum, o) => sum + (o.refundAmount || 0), 0);

    return {
      totalOrders: filteredOrders.length,
      completedOrders: completed.length,
      voidedOrders: voided.length,
      refundedOrders: refunded.length,
      totalSales,
      refundedAmount,
    };
  }, [filteredOrders]);

  // Table columns
  const columns: Column<OrderHistoryItem>[] = [
    {
      id: 'orderNumber',
      header: 'Order ID',
      accessor: 'orderNumber',
      sortable: true,
    },
    {
      id: 'createdAt',
      header: 'Tarikh & Masa',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {new Date(row.createdAt).toLocaleDateString('ms-MY')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {new Date(row.createdAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'customerName',
      header: 'Pelanggan',
      accessor: (row) => row.customerName || 'Walk-in',
    },
    {
      id: 'cashierName',
      header: 'Cashier',
      accessor: (row) => row.cashierName || 'Unknown',
    },
    {
      id: 'orderType',
      header: 'Jenis',
      accessor: (row) => (
        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
          {getOrderTypeLabel(row.orderType)}
        </span>
      ),
    },
    {
      id: 'paymentMethod',
      header: 'Pembayaran',
      accessor: (row) => getPaymentMethodLabel(row.paymentMethod || '-'),
    },
    {
      id: 'total',
      header: 'Jumlah',
      accessor: (row) => (
        <span style={{ fontWeight: 600 }}>
          BND {row.total.toFixed(2)}
        </span>
      ),
      sortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => (
        <OrderStatusBadge
          status={row.status}
          voidRefundStatus={row.voidRefundStatus}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Tindakan',
      accessor: (row) => (
        <button
          className="btn btn-sm btn-outline"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedOrder(row);
            setShowDetailModal(true);
          }}
        >
          <Eye size={14} />
          Lihat
        </button>
      ),
    },
  ];

  // Handle export
  const handleExport = () => {
    exportToCSV({
      filename: 'order-history',
      columns: [
        { key: 'orderNumber', label: 'Order ID' },
        { key: 'createdAt', label: 'Tarikh/Masa', format: 'datetime' },
        { key: 'customerName', label: 'Pelanggan' },
        { key: 'cashierName', label: 'Cashier' },
        { key: 'orderType', label: 'Jenis' },
        { key: 'paymentMethod', label: 'Pembayaran' },
        { key: 'total', label: 'Jumlah (BND)', format: 'currency' },
        { key: 'status', label: 'Status' },
        { key: 'voidRefundStatus', label: 'Void/Refund' },
      ],
      data: filteredOrders.map(o => ({
        ...o,
        customerName: o.customerName || 'Walk-in',
        cashierName: o.cashierName || 'Unknown',
      })),
    });
  };

  // Handle void/refund request
  const handleVoidRefund = (mode: 'void' | 'refund') => {
    setVoidRefundMode(mode);
    setShowVoidRefundModal(true);
  };

  if (!ordersInitialized) {
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
        <LivePageHeader
          title="Sejarah Pesanan"
          subtitle="Lihat, cari, dan urus semua pesanan lampau"
          rightContent={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <PremiumButton
                variant="glass"
                icon={Filter}
                onClick={() => setShowFilters(!showFilters)}
                isActive={showFilters}
              >
                Filter
              </PremiumButton>
              {canExportData && (
                <PremiumButton variant="outline" icon={Download} onClick={handleExport}>
                  Export CSV
                </PremiumButton>
              )}
            </div>
          }
        />

        {/* Stats */}
        <div className="content-grid cols-4 mb-lg animate-slide-up-stagger">
          <StatCard
            label="Jumlah Pesanan"
            value={stats.totalOrders}
            icon={FileText}
            gradient="primary"
          />
          <StatCard
            label="Pesanan Selesai"
            value={stats.completedOrders}
            icon={CheckCircle}
            gradient="success"
          />
          <StatCard
            label="Void / Refund"
            value={stats.voidedOrders + stats.refundedOrders}
            change={pendingCount > 0 ? `${pendingCount} pending` : undefined}
            changeType={pendingCount > 0 ? 'warning' : 'neutral'}
            icon={RefreshCw}
            gradient="accent"
          />
          <StatCard
            label="Jumlah Jualan"
            value={`BND ${stats.totalSales.toFixed(2)}`}
            change={stats.refundedAmount > 0 ? `-BND ${stats.refundedAmount.toFixed(2)} refund` : undefined}
            changeType={stats.refundedAmount > 0 ? 'negative' : 'neutral'}
            icon={DollarSign}
            gradient="info"
          />
        </div>

        {/* Pending Approvals Panel (Manager/Admin only) */}
        {canApprove && pendingCount > 0 && (
          <div className="mb-lg animate-slide-up">
            <PendingApprovalsPanel
              requests={pendingRequests}
              onApprove={async (requestId) => {
                if (currentStaff) {
                  await approveVoidRefund(requestId, currentStaff.id, currentStaff.name);
                }
              }}
              onReject={async (requestId, reason) => {
                if (currentStaff) {
                  await rejectVoidRefund(requestId, currentStaff.id, currentStaff.name, reason);
                }
              }}
            />
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <GlassCard className="mb-lg animate-slide-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <Filter size={18} color="var(--primary)" />
              <span style={{ fontWeight: 600 }}>Filter Lanjutan</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="form-group">
                <label className="form-label">Tarikh Mula</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange!, start: e.target.value }
                  }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tarikh Akhir</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange!, end: e.target.value }
                  }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={filters.status || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <option value="all">Semua Status</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                  <option value="voided">Void</option>
                  <option value="refunded">Refund</option>
                  <option value="pending_void">Pending Void</option>
                  <option value="pending_refund">Pending Refund</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Pembayaran</label>
                <select
                  className="form-select"
                  value={filters.paymentMethod || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="all">Semua</option>
                  <option value="cash">Tunai</option>
                  <option value="card">Kad</option>
                  <option value="qr">QR Code</option>
                  <option value="ewallet">E-Wallet</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jenis Pesanan</label>
                <select
                  className="form-select"
                  value={filters.orderType || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, orderType: e.target.value }))}
                >
                  <option value="all">Semua</option>
                  <option value="dine-in">Dine-in</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                  <option value="gomamam">GoMamam</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={() => setFilters({
                  status: 'all',
                  paymentMethod: 'all',
                  orderType: 'all',
                  dateRange: {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0],
                  },
                  searchQuery: '',
                })}
              >
                Reset Filter
              </PremiumButton>
            </div>
          </GlassCard>
        )}

        {/* Data Table */}
        <GlassCard className="animate-slide-up" style={{ animationDelay: '0.2s', padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <DataTable
              data={filteredOrders as unknown as Record<string, unknown>[]}
              columns={columns as unknown as Column<Record<string, unknown>>[]}
              keyField="id"
              searchable
              searchPlaceholder="Cari order ID, pelanggan, cashier..."
              pagination
              pageSize={10}
              emptyMessage={
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <History size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Tiada pesanan dijumpai</p>
                </div>
              }
            />
          </div>
        </GlassCard>

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
            onVoidRequest={() => handleVoidRefund('void')}
            onRefundRequest={() => handleVoidRefund('refund')}
          />
        )}

        {/* Void/Refund Modal */}
        {selectedOrder && (
          <VoidRefundModal
            isOpen={showVoidRefundModal}
            onClose={() => setShowVoidRefundModal(false)}
            order={selectedOrder}
            mode={voidRefundMode}
            requestedBy={currentStaff?.id || ''}
            requestedByName={currentStaff?.name || ''}
          />
        )}
      </div>
    </MainLayout>
  );
}
