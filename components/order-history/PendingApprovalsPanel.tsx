'use client';

import { useState } from 'react';
import { VoidRefundRequest } from '@/lib/types';
import { getVoidRefundTypeLabel } from '@/lib/order-history-data';
import { useToast } from '@/lib/contexts/ToastContext';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  DollarSign,
} from 'lucide-react';

interface PendingApprovalsPanelProps {
  requests: VoidRefundRequest[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason: string) => void;
}

export default function PendingApprovalsPanel({
  requests,
  onApprove,
  onReject,
}: PendingApprovalsPanelProps) {
  const { showToast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleApprove = (requestId: string) => {
    onApprove(requestId);
    showToast('Permintaan telah diluluskan. Jualan dan inventori akan dikembalikan.', 'success');
  };

  const handleReject = (requestId: string) => {
    if (!rejectReason.trim()) {
      showToast('Sila masukkan sebab penolakan', 'error');
      return;
    }
    onReject(requestId, rejectReason);
    setRejectingId(null);
    setRejectReason('');
    showToast('Permintaan telah ditolak.', 'info');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'void':
        return '#ef4444';
      case 'refund':
        return '#f59e0b';
      case 'partial_refund':
        return '#eab308';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} hari lepas`;
    if (hours > 0) return `${hours} jam lepas`;
    if (minutes > 0) return `${minutes} minit lepas`;
    return 'baru sahaja';
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="card mb-lg" style={{ borderLeft: '4px solid #f59e0b' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          padding: '0.75rem 1rem',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--gray-200)',
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              Pending Approvals
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {requests.length} permintaan menunggu kelulusan
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-warning">{requests.length}</span>
          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </div>

      {/* Request List */}
      {!isCollapsed && (
        <div style={{ padding: '0.75rem' }}>
          {requests.map((request) => (
            <div
              key={request.id}
              style={{
                padding: '1.25rem',
                marginBottom: '1rem',
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-200)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              {/* Request Main Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span
                      className={`badge ${request.type === 'void' ? 'badge-danger' : 'badge-warning'}`}
                      style={{ textTransform: 'uppercase', fontWeight: 700 }}
                    >
                      {getVoidRefundTypeLabel(request.type)}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{request.orderNumber}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={14} />
                      Requested by: <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{request.requestedByName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} />
                      {getTimeSince(request.requestedAt)}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Amount</div>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--danger)', lineHeight: 1 }}>
                    BND {(request.amount || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Reason Box */}
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                borderLeft: '4px solid var(--primary)',
                fontSize: '0.95rem'
              }}>
                <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Reason</span>
                "{request.reason}"
              </div>

              {/* Items List (if partial) */}
              {request.itemsToRefund && request.itemsToRefund.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Items to Refund</div>
                  <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                    {request.itemsToRefund.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0.5rem', borderBottom: idx < (request.itemsToRefund?.length || 0) - 1 ? '1px solid var(--gray-200)' : 'none' }}>
                        <span>{item.itemName} <span style={{ opacity: 0.6 }}>×{item.quantity}</span></span>
                        <span style={{ fontWeight: 500 }}>BND {item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Input */}
              {rejectingId === request.id && (
                <div style={{ marginBottom: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Sebab Penolakan:</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Contoh: Customer change mind"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem' }}
                    autoFocus
                  />
                </div>
              )}

              {/* Big Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: rejectingId === request.id ? '1fr 2fr' : '1fr 1fr', gap: '0.75rem' }}>
                {rejectingId === request.id ? (
                  <>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason('');
                      }}
                      style={{ justifyContent: 'center' }}
                    >
                      Batal
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(request.id)}
                      disabled={!rejectReason.trim()}
                      style={{ justifyContent: 'center' }}
                    >
                      Confirm Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => setRejectingId(request.id)}
                      style={{ padding: '0.75rem', justifyContent: 'center', height: 'auto', gap: '0.5rem' }}
                    >
                      <XCircle size={18} />
                      <span style={{ fontWeight: 600 }}>Tolak Order</span>
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(request.id)}
                      style={{ padding: '0.75rem', justifyContent: 'center', height: 'auto', gap: '0.5rem', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}
                    >
                      <CheckCircle size={18} />
                      <span style={{ fontWeight: 600 }}>Luluskan (Approve)</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
