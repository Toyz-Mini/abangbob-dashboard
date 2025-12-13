import { Order } from './types';

export const MOCK_SALES_TODAY: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    items: [
      { id: '1', name: 'Nasi Lemak Ayam', category: 'Nasi Lemak', price: 6.50, quantity: 2, selectedModifiers: [], itemTotal: 13.00, isAvailable: true, modifierGroupIds: [] },
      { id: '7', name: 'Teh Ais', category: 'Minuman', price: 2.50, quantity: 2, selectedModifiers: [], itemTotal: 5.00, isAvailable: true, modifierGroupIds: [] },
    ],
    total: 18.00,
    customerPhone: '+6737123456',
    orderType: 'takeaway',
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    items: [
      { id: '4', name: 'Burger Ayam', category: 'Burger', price: 8.00, quantity: 1, selectedModifiers: [], itemTotal: 8.00, isAvailable: true, modifierGroupIds: [] },
    ],
    total: 8.00,
    customerPhone: '+6737234567',
    orderType: 'takeaway',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function getTotalSalesToday(): number {
  return MOCK_SALES_TODAY
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);
}

export function getTotalOrdersToday(): number {
  return MOCK_SALES_TODAY.filter(order => order.status === 'completed').length;
}

