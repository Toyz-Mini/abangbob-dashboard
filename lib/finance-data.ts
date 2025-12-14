import { Expense, DailyCashFlow, ExpenseCategory } from './types';

// Expense categories with labels and colors
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: 'rent', label: 'Sewa', color: '#8b5cf6' },
  { value: 'utilities', label: 'Utiliti (Air/Elektrik)', color: '#3b82f6' },
  { value: 'supplies', label: 'Bekalan Kedai', color: '#10b981' },
  { value: 'wages', label: 'Gaji Staf', color: '#f59e0b' },
  { value: 'marketing', label: 'Marketing', color: '#ec4899' },
  { value: 'maintenance', label: 'Penyelenggaraan', color: '#6366f1' },
  { value: 'ingredients', label: 'Bahan Mentah', color: '#14b8a6' },
  { value: 'equipment', label: 'Peralatan', color: '#f97316' },
  { value: 'other', label: 'Lain-lain', color: '#6b7280' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tunai' },
  { value: 'bank', label: 'Transfer Bank' },
  { value: 'card', label: 'Kad Kredit/Debit' },
  { value: 'ewallet', label: 'E-Wallet' },
];

// Mock expenses data
export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp_001',
    date: new Date().toISOString().split('T')[0],
    category: 'ingredients',
    amount: 250.00,
    description: 'Ayam 10kg dari Supplier Ali',
    paymentMethod: 'cash',
    vendor: 'Supplier Ali',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp_002',
    date: new Date().toISOString().split('T')[0],
    category: 'ingredients',
    amount: 85.00,
    description: 'Beras 25kg',
    paymentMethod: 'cash',
    vendor: 'Kedai Runcit Haji',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp_003',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    category: 'utilities',
    amount: 180.00,
    description: 'Bil Elektrik Disember',
    paymentMethod: 'bank',
    vendor: 'DES',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'exp_004',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    category: 'supplies',
    amount: 45.00,
    description: 'Plastik takeaway, paper bag',
    paymentMethod: 'cash',
    vendor: 'Packaging Supplier',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'exp_005',
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    category: 'maintenance',
    amount: 120.00,
    description: 'Servis aircond',
    paymentMethod: 'cash',
    vendor: 'Cool Air Services',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'exp_006',
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    category: 'rent',
    amount: 1500.00,
    description: 'Sewa kedai bulan Disember',
    paymentMethod: 'bank',
    vendor: 'Tuan Kedai',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

// Mock daily cash flow
export const MOCK_CASH_FLOWS: DailyCashFlow[] = [
  {
    id: 'cf_001',
    date: new Date().toISOString().split('T')[0],
    openingCash: 500.00,
    salesCash: 0,
    salesCard: 0,
    salesEwallet: 0,
    expensesCash: 0,
    closingCash: 500.00,
  },
  {
    id: 'cf_002',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    openingCash: 500.00,
    salesCash: 450.00,
    salesCard: 180.00,
    salesEwallet: 95.00,
    expensesCash: 180.00,
    closingCash: 770.00,
    closedBy: 'Ahmad',
    closedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'cf_003',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    openingCash: 500.00,
    salesCash: 520.00,
    salesCard: 210.00,
    salesEwallet: 75.00,
    expensesCash: 45.00,
    closingCash: 975.00,
    closedBy: 'Siti',
    closedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

// Helper function to get category label
export function getCategoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category;
}

// Helper function to get category color
export function getCategoryColor(category: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find(c => c.value === category)?.color || '#6b7280';
}


