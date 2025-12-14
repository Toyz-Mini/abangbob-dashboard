// Order History Mock Data and Helper Functions

import { OrderHistoryItem, VoidRefundRequest, OrderVoidRefundStatus } from './types';

// Generate mock order history data
export const MOCK_ORDER_HISTORY: OrderHistoryItem[] = [
  {
    id: 'ord-001',
    orderNumber: 'AB-001',
    items: [
      { id: 'item-1', name: 'Nasi Lemak Ayam', category: 'Nasi Lemak', price: 8.00, isAvailable: true, modifierGroupIds: [], quantity: 2, selectedModifiers: [], itemTotal: 8.00 },
      { id: 'item-2', name: 'Teh Tarik', category: 'Minuman', price: 2.50, isAvailable: true, modifierGroupIds: [], quantity: 1, selectedModifiers: [], itemTotal: 2.50 }
    ],
    total: 18.50,
    customerName: 'Ahmad',
    customerPhone: '+6738123456',
    orderType: 'takeaway',
    status: 'completed',
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    cashierId: 'staff-001',
    cashierName: 'Siti',
    outletId: 'outlet-001',
    outletName: 'AbangBob Gadong',
    voidRefundStatus: 'none',
  },
  {
    id: 'ord-002',
    orderNumber: 'AB-002',
    items: [
      { id: 'item-3', name: 'Burger Special', category: 'Burger', price: 12.00, isAvailable: true, modifierGroupIds: [], quantity: 1, selectedModifiers: [], itemTotal: 12.00 },
      { id: 'item-4', name: 'Milo Ais', category: 'Minuman', price: 3.00, isAvailable: true, modifierGroupIds: [], quantity: 2, selectedModifiers: [], itemTotal: 3.00 }
    ],
    total: 18.00,
    customerName: 'Rahman',
    customerPhone: '+6738234567',
    orderType: 'dine-in',
    status: 'completed',
    paymentMethod: 'card',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    cashierId: 'staff-002',
    cashierName: 'Ali',
    outletId: 'outlet-001',
    outletName: 'AbangBob Gadong',
    voidRefundStatus: 'refunded',
    refundAmount: 18.00,
    refundReason: 'Customer complaint - food quality',
    refundedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    refundedBy: 'manager-001',
    refundedByName: 'Haji Kamal',
  },
  {
    id: 'ord-003',
    orderNumber: 'AB-003',
    items: [
      { id: 'item-5', name: 'Nasi Lemak Biasa', category: 'Nasi Lemak', price: 5.00, isAvailable: true, modifierGroupIds: [], quantity: 3, selectedModifiers: [], itemTotal: 5.00 },
    ],
    total: 15.00,
    customerPhone: '+6738345678',
    orderType: 'takeaway',
    status: 'completed',
    paymentMethod: 'qr',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    cashierId: 'staff-001',
    cashierName: 'Siti',
    outletId: 'outlet-001',
    outletName: 'AbangBob Gadong',
    voidRefundStatus: 'pending_refund',
    pendingRequest: {
      id: 'req-001',
      orderId: 'ord-003',
      orderNumber: 'AB-003',
      type: 'refund',
      reason: 'Customer found hair in food',
      amount: 15.00,
      requestedBy: 'staff-001',
      requestedByName: 'Siti',
      requestedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
      status: 'pending',
      salesReversed: false,
      inventoryReversed: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  },
  {
    id: 'ord-004',
    orderNumber: 'AB-004',
    items: [
      { id: 'item-6', name: 'Burger Ayam', category: 'Burger', price: 8.00, isAvailable: true, modifierGroupIds: [], quantity: 2, selectedModifiers: [], itemTotal: 8.00 },
      { id: 'item-7', name: 'Kopi O', category: 'Minuman', price: 2.00, isAvailable: true, modifierGroupIds: [], quantity: 2, selectedModifiers: [], itemTotal: 2.00 }
    ],
    total: 20.00,
    customerName: 'Fatimah',
    customerPhone: '+6738456789',
    orderType: 'delivery',
    status: 'completed',
    paymentMethod: 'ewallet',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    cashierId: 'staff-002',
    cashierName: 'Ali',
    outletId: 'outlet-001',
    outletName: 'AbangBob Gadong',
    voidRefundStatus: 'voided',
    voidedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    voidedBy: 'manager-001',
    voidedByName: 'Haji Kamal',
  },
  {
    id: 'ord-005',
    orderNumber: 'AB-005',
    items: [
      { id: 'item-8', name: 'Nasi Lemak Rendang', category: 'Nasi Lemak', price: 10.00, isAvailable: true, modifierGroupIds: [], quantity: 1, selectedModifiers: [], itemTotal: 10.00 },
    ],
    total: 10.00,
    customerName: 'Zainab',
    customerPhone: '+6738567890',
    orderType: 'takeaway',
    status: 'cancelled',
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    cashierId: 'staff-001',
    cashierName: 'Siti',
    outletId: 'outlet-001',
    outletName: 'AbangBob Gadong',
    voidRefundStatus: 'none',
  },
];

// Mock void/refund requests
export const MOCK_VOID_REFUND_REQUESTS: VoidRefundRequest[] = [
  {
    id: 'req-001',
    orderId: 'ord-003',
    orderNumber: 'AB-003',
    type: 'refund',
    reason: 'Customer found hair in food',
    amount: 15.00,
    requestedBy: 'staff-001',
    requestedByName: 'Siti',
    requestedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'pending',
    salesReversed: false,
    inventoryReversed: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-002',
    orderId: 'ord-006',
    orderNumber: 'AB-006',
    type: 'void',
    reason: 'Customer cancelled before food prepared',
    amount: 25.00,
    requestedBy: 'staff-002',
    requestedByName: 'Ali',
    requestedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'pending',
    salesReversed: false,
    inventoryReversed: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

// Helper function to get status badge color
export function getOrderStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
    case 'preparing':
      return 'warning';
    case 'ready':
      return 'info';
    case 'cancelled':
    case 'voided':
      return 'danger';
    case 'refunded':
    case 'partial_refund':
      return 'secondary';
    default:
      return 'default';
  }
}

// Helper function to get void/refund status badge color
export function getVoidRefundStatusColor(status: OrderVoidRefundStatus): string {
  switch (status) {
    case 'none':
      return 'default';
    case 'pending_void':
    case 'pending_refund':
      return 'warning';
    case 'voided':
      return 'danger';
    case 'refunded':
    case 'partial_refund':
      return 'secondary';
    default:
      return 'default';
  }
}

// Helper function to get status label
export function getOrderStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Selesai';
    case 'pending':
      return 'Menunggu';
    case 'preparing':
      return 'Sedang Dimasak';
    case 'ready':
      return 'Sedia';
    case 'cancelled':
      return 'Dibatalkan';
    case 'voided':
      return 'Void';
    case 'refunded':
      return 'Refund';
    case 'partial_refund':
      return 'Refund Separa';
    case 'pending_void':
      return 'Pending Void';
    case 'pending_refund':
      return 'Pending Refund';
    default:
      return status;
  }
}

// Helper function to get void/refund type label
export function getVoidRefundTypeLabel(type: string): string {
  switch (type) {
    case 'void':
      return 'Void';
    case 'refund':
      return 'Refund Penuh';
    case 'partial_refund':
      return 'Refund Separa';
    default:
      return type;
  }
}

// Helper function to get payment method label
export function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'cash':
      return 'Tunai';
    case 'card':
      return 'Kad';
    case 'qr':
      return 'QR Code';
    case 'ewallet':
      return 'E-Wallet';
    default:
      return method;
  }
}

// Helper function to get order type label
export function getOrderTypeLabel(type: string): string {
  switch (type) {
    case 'dine-in':
      return 'Dine-in';
    case 'takeaway':
      return 'Takeaway';
    case 'delivery':
      return 'Delivery';
    case 'gomamam':
      return 'GoMamam';
    default:
      return type;
  }
}

// Storage keys for order history
export const ORDER_HISTORY_STORAGE_KEYS = {
  ORDER_HISTORY: 'abangbob_order_history',
  VOID_REFUND_REQUESTS: 'abangbob_void_refund_requests',
};
