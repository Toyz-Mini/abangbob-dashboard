'use client';

import { OrderVoidRefundStatus } from '@/lib/types';
import { getOrderStatusLabel, getOrderStatusColor, getVoidRefundStatusColor } from '@/lib/order-history-data';
import { Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: string;
  voidRefundStatus?: OrderVoidRefundStatus;
  size?: 'sm' | 'md';
}

export default function OrderStatusBadge({ status, voidRefundStatus, size = 'md' }: OrderStatusBadgeProps) {
  // If there's a void/refund status other than 'none', show that instead
  const displayStatus = voidRefundStatus && voidRefundStatus !== 'none' 
    ? voidRefundStatus 
    : status;

  const getIcon = () => {
    switch (displayStatus) {
      case 'completed':
        return <CheckCircle size={size === 'sm' ? 12 : 14} />;
      case 'pending':
      case 'preparing':
        return <Clock size={size === 'sm' ? 12 : 14} />;
      case 'cancelled':
      case 'voided':
        return <XCircle size={size === 'sm' ? 12 : 14} />;
      case 'refunded':
      case 'partial_refund':
        return <RefreshCw size={size === 'sm' ? 12 : 14} />;
      case 'pending_void':
      case 'pending_refund':
        return <AlertTriangle size={size === 'sm' ? 12 : 14} />;
      default:
        return null;
    }
  };

  const getColor = () => {
    if (voidRefundStatus && voidRefundStatus !== 'none') {
      return getVoidRefundStatusColor(voidRefundStatus);
    }
    return getOrderStatusColor(status);
  };

  const getBadgeClass = () => {
    const color = getColor();
    switch (color) {
      case 'success':
        return 'badge-success';
      case 'warning':
        return 'badge-warning';
      case 'danger':
        return 'badge-danger';
      case 'info':
        return 'badge-info';
      case 'secondary':
        return 'badge-secondary';
      default:
        return '';
    }
  };

  return (
    <span 
      className={`badge ${getBadgeClass()}`}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.25rem',
        fontSize: size === 'sm' ? '0.65rem' : '0.75rem',
        padding: size === 'sm' ? '0.2rem 0.4rem' : '0.25rem 0.5rem',
      }}
    >
      {getIcon()}
      {getOrderStatusLabel(displayStatus)}
    </span>
  );
}
