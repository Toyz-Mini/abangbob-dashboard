import { DeliveryOrder } from './types';

export const MOCK_DELIVERY_ORDERS: DeliveryOrder[] = [
  {
    id: '1',
    platform: 'Grab',
    customerName: 'Ali Ahmad',
    customerPhone: '+6737123456',
    items: [
      { id: '1', name: 'Nasi Lemak Ayam', category: 'Nasi Lemak', price: 6.50, quantity: 2, selectedModifiers: [], itemTotal: 13.00, isAvailable: true, modifierGroupIds: [] },
      { id: '7', name: 'Teh Ais', category: 'Minuman', price: 2.50, quantity: 2, selectedModifiers: [], itemTotal: 5.00, isAvailable: true, modifierGroupIds: [] },
    ],
    totalAmount: 18.00,
    status: 'new',
    driverName: 'Driver A',
    driverPlate: 'BK1234',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    platform: 'Panda',
    customerName: 'Sarah Binti Rahman',
    customerPhone: '+6737234567',
    items: [
      { id: '4', name: 'Burger Ayam', category: 'Burger', price: 8.00, quantity: 1, selectedModifiers: [], itemTotal: 8.00, isAvailable: true, modifierGroupIds: [] },
    ],
    totalAmount: 8.00,
    status: 'preparing',
    driverName: 'Driver B',
    driverPlate: 'BK5678',
    createdAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: '3',
    platform: 'Shopee',
    customerName: 'Hassan Bin Ali',
    customerPhone: '+6737345678',
    items: [
      { id: '2', name: 'Nasi Lemak Rendang', category: 'Nasi Lemak', price: 7.00, quantity: 1, selectedModifiers: [], itemTotal: 7.00, isAvailable: true, modifierGroupIds: [] },
      { id: '9', name: 'Lime Juice', category: 'Minuman', price: 3.00, quantity: 1, selectedModifiers: [], itemTotal: 3.00, isAvailable: true, modifierGroupIds: [] },
    ],
    totalAmount: 10.00,
    status: 'ready',
    driverName: 'Driver C',
    driverPlate: 'BK9012',
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

export const DELIVERY_PLATFORMS = [
  { name: 'GrabFood', status: 'online' as const },
  { name: 'FoodPanda', status: 'online' as const },
  { name: 'ShopeeFood', status: 'offline' as const },
];

