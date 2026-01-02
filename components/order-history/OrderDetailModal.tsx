'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { OrderHistoryItem, CartItem } from '@/lib/types';
import { getOrderTypeLabel, getPaymentMethodLabel, getOrderStatusLabel } from '@/lib/order-history-data';
import { canApproveVoidRefund, canViewInventoryImpact } from '@/lib/permissions';
import { thermalPrinter, loadReceiptSettings } from '@/lib/services';
import { ReceiptSettings } from '@/lib/types';
import OrderStatusBadge from './OrderStatusBadge';
import {
  Printer,
  RefreshCw,
  XCircle,
  Flag,
  User,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderHistoryItem;
  userRole: 'Admin' | 'Manager' | 'Staff';
  currentStaffId?: string;
  currentStaffName?: string;
  onVoidRequest: () => void;
  onRefundRequest: () => void;
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  userRole,
  currentStaffId,
  currentStaffName,
  onVoidRequest,
  onRefundRequest,
}: OrderDetailModalProps) {
  const canApprove = canApproveVoidRefund(userRole);
  const canViewInventory = canViewInventoryImpact(userRole);
  const hasNoPendingRequest = order.voidRefundStatus === 'none';
  const isCompleted = order.status === 'completed';
  const canRequestVoidRefund = isCompleted && hasNoPendingRequest;

  // Receipt Settings State
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings | null>(null);

  // Load receipt settings
  useEffect(() => {
    const settings = loadReceiptSettings();
    setReceiptSettings(settings);
  }, []);

  // Handle reprint
  const handleReprint = async () => {
    if (!receiptSettings) return;

    // cast OrderHistoryItem to Order (they are compatible for printing purposes)
    // We might need to map it if types are strictly different, but usually they overlap enough for the printer
    const orderForPrint = order as any;

    try {
      await thermalPrinter.print(orderForPrint, receiptSettings);
    } catch (error) {
      console.error('Print failed:', error);
      // Fallback
      window.print();
    }
  };

  // Handle repeat order
  const handleRepeatOrder = () => {
    // In a real app, this would add items to POS cart
    alert('Fungsi ini akan menambah item ke keranjang POS');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pesanan ${order.orderNumber}`}
      maxWidth="700px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Order Info Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '1rem',
          background: 'var(--gray-100)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem' }}>{order.orderNumber}</h3>
              <OrderStatusBadge status={order.status} voidRefundStatus={order.voidRefundStatus} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={14} />
                {new Date(order.createdAt).toLocaleDateString('ms-MY')} {new Date(order.createdAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <User size={14} />
                {order.cashierName || 'Unknown'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={14} />
                {getOrderTypeLabel(order.orderType)}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
              BND {order.total.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {getPaymentMethodLabel(order.paymentMethod || '-')}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {(order.customerName || order.customerPhone) && (
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              MAKLUMAT PELANGGAN
            </h4>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              {order.customerName && <span><strong>Nama:</strong> {order.customerName}</span>}
              {order.customerPhone && <span><strong>Tel:</strong> {order.customerPhone}</span>}
            </div>
          </div>
        )}

        {/* Item Breakdown */}
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            ITEM PESANAN
          </h4>
          <table className="table" style={{ fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Harga</th>
                <th style={{ textAlign: 'right' }}>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: CartItem, idx: number) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {item.selectedModifiers.map((mod, i) => (
                          <div key={i}>+ {mod.optionName}</div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>BND {item.itemTotal.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>
                    BND {(item.itemTotal * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Summary */}
        <div style={{
          padding: '1rem',
          background: 'var(--gray-100)',
          borderRadius: 'var(--radius-md)',
        }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            RINGKASAN PEMBAYARAN
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>BND {(order.total - (order.discount || 0)).toFixed(2)}</span>
            </div>
            {order.discount && order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>Diskaun:</span>
                <span>-BND {order.discount.toFixed(2)}</span>
              </div>
            )}
            {order.refundAmount && order.refundAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                <span>Refund:</span>
                <span>-BND {order.refundAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--gray-300)', marginTop: '0.25rem' }}>
              <span>Jumlah:</span>
              <span>BND {order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Void/Refund Status (if applicable) */}
        {order.voidRefundStatus !== 'none' && (
          <div style={{
            padding: '1rem',
            background: order.voidRefundStatus.includes('pending') ? '#fef3c7' : '#fee2e2',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${order.voidRefundStatus.includes('pending') ? '#f59e0b' : '#ef4444'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {order.voidRefundStatus.includes('pending') ? (
                <Clock size={18} style={{ color: '#f59e0b' }} />
              ) : (
                <AlertTriangle size={18} style={{ color: '#ef4444' }} />
              )}
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                {order.voidRefundStatus === 'pending_void' && 'Pending Void Approval'}
                {order.voidRefundStatus === 'pending_refund' && 'Pending Refund Approval'}
                {order.voidRefundStatus === 'voided' && 'Order Voided'}
                {order.voidRefundStatus === 'refunded' && 'Order Refunded'}
                {order.voidRefundStatus === 'partial_refund' && 'Partial Refund'}
              </h4>
            </div>
            {order.refundReason && (
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                <strong>Sebab:</strong> {order.refundReason}
              </p>
            )}
            {order.refundedByName && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                <strong>Diluluskan oleh:</strong> {order.refundedByName}
                {order.refundedAt && ` pada ${new Date(order.refundedAt).toLocaleString('ms-MY')}`}
              </p>
            )}
            {order.voidedByName && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                <strong>Diluluskan oleh:</strong> {order.voidedByName}
                {order.voidedAt && ` pada ${new Date(order.voidedAt).toLocaleString('ms-MY')}`}
              </p>
            )}
            {order.pendingRequest && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                <strong>Diminta oleh:</strong> {order.pendingRequest.requestedByName}
                {` pada ${new Date(order.pendingRequest.requestedAt).toLocaleString('ms-MY')}`}
              </p>
            )}
          </div>
        )}

        {/* Inventory Impact (Admin/Manager only) */}
        {canViewInventory && (
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              KESAN INVENTORI
            </h4>
            <div style={{
              padding: '0.75rem',
              background: 'var(--gray-100)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}>
              <Package size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Stok berikut telah ditolak berdasarkan pesanan ini:
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                {order.items.map((item, idx) => (
                  <li key={idx}>{item.name} × {item.quantity}</li>
                ))}
              </ul>
              {(order.voidRefundStatus === 'voided' || order.voidRefundStatus === 'refunded') && (
                <div style={{ marginTop: '0.5rem', color: 'var(--success)' }}>
                  <CheckCircle size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                  Stok telah dikembalikan semula kerana void/refund.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
          <button className="btn btn-outline" onClick={handleReprint}>
            <Printer size={16} />
            Cetak Semula Resit
          </button>

          {order.voidRefundStatus === 'none' && order.status === 'completed' && (
            <button className="btn btn-outline" onClick={handleRepeatOrder}>
              <RefreshCw size={16} />
              Ulang Pesanan
            </button>
          )}

          {canRequestVoidRefund && (
            <>
              <button
                className="btn btn-outline"
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                onClick={onVoidRequest}
              >
                <XCircle size={16} />
                Request Void
              </button>
              <button
                className="btn btn-outline"
                style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}
                onClick={onRefundRequest}
              >
                <RefreshCw size={16} />
                Request Refund
              </button>
            </>
          )}

          {canApprove && (
            <button className="btn btn-outline">
              <Flag size={16} />
              Flag Pesanan
            </button>
          )}

          <button className="btn btn-primary" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}
