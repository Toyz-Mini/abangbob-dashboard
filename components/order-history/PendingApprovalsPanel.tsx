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
        <div style={{ padding: '0.5rem' }}>
          {requests.map((request) => (
            <div 
              key={request.id}
              style={{ 
                padding: '1rem',
                marginBottom: '0.5rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--gray-200)',
              }}
            >
              {/* Request Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span 
                      style={{ 
                        fontWeight: 700, 
                        fontSize: '0.875rem',
                        color: getTypeColor(request.type),
                        textTransform: 'uppercase',
                      }}
                    >
                      {getVoidRefundTypeLabel(request.type)}
                    </span>
                    <span style={{ fontWeight: 600 }}>{request.orderNumber}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <User size={12} />
                      {request.requestedByName}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {getTimeSince(request.requestedAt)}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--danger)' }}>
                    BND {(request.amount || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div style={{ 
                padding: '0.5rem 0.75rem',
                background: 'white',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '0.75rem',
                fontSize: '0.875rem',
              }}>
                <strong>Sebab:</strong> {request.reason}
              </div>

              {/* Partial Refund Items */}
              {request.itemsToRefund && request.itemsToRefund.length > 0 && (
                <div style={{ 
                  marginBottom: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  background: 'white',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                }}>
                  <strong>Item untuk refund:</strong>
                  <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem' }}>
                    {request.itemsToRefund.map((item, idx) => (
                      <li key={idx}>{item.itemName} × {item.quantity} (BND {item.amount.toFixed(2)})</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rejection Reason Input */}
              {rejectingId === request.id && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Sebab penolakan..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{ fontSize: '0.875rem' }}
                    autoFocus
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                {rejectingId === request.id ? (
                  <>
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason('');
                      }}
                    >
                      Batal
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleReject(request.id)}
                      disabled={!rejectReason.trim()}
                    >
                      Hantar Penolakan
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn btn-sm btn-outline"
                      style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                      onClick={() => setRejectingId(request.id)}
                    >
                      <XCircle size={14} />
                      Tolak
                    </button>
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={() => handleApprove(request.id)}
                    >
                      <CheckCircle size={14} />
                      Luluskan
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
