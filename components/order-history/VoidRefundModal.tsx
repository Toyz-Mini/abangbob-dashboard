'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { OrderHistoryItem, RefundItem, CartItem } from '@/lib/types';
import { useOrderHistory } from '@/lib/store';
import { useToast } from '@/lib/contexts/ToastContext';
import { AlertTriangle, XCircle, RefreshCw, CheckCircle } from 'lucide-react';

interface VoidRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderHistoryItem;
  mode: 'void' | 'refund';
  requestedBy: string;
  requestedByName: string;
}

export default function VoidRefundModal({
  isOpen,
  onClose,
  order,
  mode,
  requestedBy,
  requestedByName,
}: VoidRefundModalProps) {
  const { requestVoid, requestRefund } = useOrderHistory();
  const { showToast } = useToast();

  const [reason, setReason] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: { selected: boolean; quantity: number } }>(
    order.items.reduce((acc, item, idx) => ({
      ...acc,
      [`${item.id}_${idx}`]: { selected: true, quantity: item.quantity }
    }), {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate refund amount
  const calculateRefundAmount = () => {
    if (mode === 'void' || refundType === 'full') {
      return order.total;
    }

    let total = 0;
    order.items.forEach((item, idx) => {
      const key = `${item.id}_${idx}`;
      const selection = selectedItems[key];
      if (selection?.selected) {
        const itemTotal = item.itemTotal * selection.quantity;
        total += itemTotal;
      }
    });
    return total;
  };

  const refundAmount = calculateRefundAmount();

  // Toggle item selection
  const toggleItem = (key: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: { ...prev[key], selected: !prev[key].selected }
    }));
  };

  // Update item quantity
  const updateQuantity = (key: string, qty: number, maxQty: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: { ...prev[key], quantity: Math.min(Math.max(1, qty), maxQty) }
    }));
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!reason.trim()) {
      showToast('Sila masukkan sebab', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let result;

      if (mode === 'void') {
        result = await requestVoid(order.id, reason, requestedBy, requestedByName);
      } else {
        // Build items to refund for partial refund
        const itemsToRefund: RefundItem[] = [];

        if (refundType === 'partial') {
          order.items.forEach((item, idx) => {
            const key = `${item.id}_${idx}`;
            const selection = selectedItems[key];
            if (selection?.selected) {
              itemsToRefund.push({
                itemId: item.id,
                itemName: item.name,
                quantity: selection.quantity,
                amount: item.itemTotal * selection.quantity,
              });
            }
          });
        }

        result = await requestRefund(
          order.id,
          refundAmount,
          reason,
          requestedBy,
          requestedByName,
          refundType === 'partial' ? itemsToRefund : undefined
        );
      }

      if (result.success) {
        showToast(
          mode === 'void'
            ? 'Permintaan void telah dihantar untuk kelulusan'
            : 'Permintaan refund telah dihantar untuk kelulusan',
          'success'
        );
        onClose();
      } else {
        showToast(result.error || 'Ralat berlaku', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'void' ? 'Request Void' : 'Request Refund'}
      maxWidth="500px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Order Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0.75rem',
          background: 'var(--gray-100)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div>
            <div style={{ fontWeight: 600 }}>{order.orderNumber}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {new Date(order.createdAt).toLocaleString('ms-MY')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
              BND {order.total.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Warning */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '0.75rem',
          background: '#fef3c7',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #f59e0b',
        }}>
          <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '0.125rem' }} />
          <div style={{ fontSize: '0.875rem' }}>
            {mode === 'void' ? (
              <p style={{ margin: 0 }}>
                <strong>Void</strong> akan membatalkan pesanan sepenuhnya. Jualan dan inventori akan dikembalikan setelah diluluskan.
              </p>
            ) : (
              <p style={{ margin: 0 }}>
                <strong>Refund</strong> akan mengembalikan wang kepada pelanggan. Jualan dan inventori akan dikembalikan setelah diluluskan.
              </p>
            )}
          </div>
        </div>

        {/* Refund Type (only for refund mode) */}
        {mode === 'refund' && (
          <div className="form-group">
            <label className="form-label">Jenis Refund</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn ${refundType === 'full' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => setRefundType('full')}
              >
                Refund Penuh
              </button>
              <button
                type="button"
                className={`btn ${refundType === 'partial' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => setRefundType('partial')}
              >
                Refund Separa
              </button>
            </div>
          </div>
        )}

        {/* Item Selection (for partial refund) */}
        {mode === 'refund' && refundType === 'partial' && (
          <div>
            <label className="form-label">Pilih Item untuk Refund</label>
            <div style={{
              border: '1px solid var(--gray-300)',
              borderRadius: 'var(--radius-md)',
              maxHeight: '200px',
              overflowY: 'auto',
            }}>
              {order.items.map((item: CartItem, idx: number) => {
                const key = `${item.id}_${idx}`;
                const selection = selectedItems[key];
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderBottom: idx < order.items.length - 1 ? '1px solid var(--gray-200)' : 'none',
                      background: selection?.selected ? 'var(--primary-light)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selection?.selected || false}
                      onChange={() => toggleItem(key)}
                      style={{ marginRight: '0.75rem' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        BND {item.itemTotal.toFixed(2)} ×
                        {selection?.selected && (
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={selection?.quantity || 1}
                            onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 1, item.quantity)}
                            style={{
                              width: '40px',
                              marginLeft: '0.25rem',
                              padding: '0.125rem 0.25rem',
                              border: '1px solid var(--gray-300)',
                              borderRadius: 'var(--radius-sm)',
                              textAlign: 'center',
                            }}
                          />
                        )}
                        {!selection?.selected && ` ${item.quantity}`}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      BND {((selection?.selected ? selection.quantity : item.quantity) * item.itemTotal).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Refund Amount Display */}
        <div style={{
          padding: '0.75rem',
          background: 'var(--gray-100)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: 500 }}>
            {mode === 'void' ? 'Jumlah Void:' : 'Jumlah Refund:'}
          </span>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--danger)' }}>
            BND {refundAmount.toFixed(2)}
          </span>
        </div>

        {/* Reason */}
        <div className="form-group">
          <label className="form-label">Sebab *</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Masukkan sebab void/refund..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        {/* Note about approval */}
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <CheckCircle size={14} />
          Permintaan ini memerlukan kelulusan Manager atau Admin.
        </div>

        {/* Action Buttons */}
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--gray-200)'
        }}>
          <button
            className="btn btn-outline"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              minWidth: '100px',
              padding: '0.5rem 1rem'
            }}
          >
            Batal
          </button>
          <button
            className="btn btn-danger"
            onClick={handleSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minWidth: '140px',
              padding: '0.5rem 1.25rem'
            }}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              mode === 'void' ? <XCircle size={16} /> : <RefreshCw size={16} />
            )}
            {isSubmitting ? 'Menghantar...' : (mode === 'void' ? 'Request Void' : 'Request Refund')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
