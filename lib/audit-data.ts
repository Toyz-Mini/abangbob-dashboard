// Audit Log Types and Mock Data

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'print';
export type AuditModule = 'orders' | 'inventory' | 'staff' | 'finance' | 'customers' | 'settings' | 'auth';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditAction;
  module: AuditModule;
  resourceId?: string;
  resourceName?: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Action labels in Malay
export const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Tambah',
  update: 'Kemaskini',
  delete: 'Padam',
  login: 'Log Masuk',
  logout: 'Log Keluar',
  export: 'Eksport',
  print: 'Cetak',
};

// Module labels in Malay
export const MODULE_LABELS: Record<AuditModule, string> = {
  orders: 'Pesanan',
  inventory: 'Inventori',
  staff: 'Staf',
  finance: 'Kewangan',
  customers: 'Pelanggan',
  settings: 'Tetapan',
  auth: 'Autentikasi',
};

// Action colors
export const ACTION_COLORS: Record<AuditAction, string> = {
  create: '#10b981',
  update: '#3b82f6',
  delete: '#ef4444',
  login: '#8b5cf6',
  logout: '#6b7280',
  export: '#f59e0b',
  print: '#06b6d4',
};

// Generate mock audit logs for demo
export const generateMockAuditLogs = (): AuditLog[] => {
  const now = new Date();
  const logs: AuditLog[] = [];
  
  const actions: Array<{ action: AuditAction; module: AuditModule; details: string }> = [
    { action: 'login', module: 'auth', details: 'Berjaya log masuk ke sistem' },
    { action: 'create', module: 'orders', details: 'Pesanan baru ORD-123456 dibuat' },
    { action: 'update', module: 'inventory', details: 'Stok Ayam dikemaskini dari 50kg ke 45kg' },
    { action: 'create', module: 'staff', details: 'Staf baru Ahmad bin Ali didaftarkan' },
    { action: 'update', module: 'orders', details: 'Status pesanan ORD-123455 dikemaskini ke "completed"' },
    { action: 'delete', module: 'inventory', details: 'Item "Bawang Lama" dipadam dari inventori' },
    { action: 'export', module: 'finance', details: 'Laporan perbelanjaan bulan Disember dieksport' },
    { action: 'update', module: 'settings', details: 'Waktu operasi dikemaskini' },
    { action: 'create', module: 'customers', details: 'Pelanggan baru didaftarkan' },
    { action: 'print', module: 'orders', details: 'Resit pesanan ORD-123454 dicetak' },
  ];
  
  for (let i = 0; i < 50; i++) {
    const actionData = actions[i % actions.length];
    const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000); // Every 30 mins back
    
    logs.push({
      id: `audit_${Date.now()}_${i}`,
      timestamp: timestamp.toISOString(),
      userId: 'admin',
      userName: 'Admin',
      action: actionData.action,
      module: actionData.module,
      details: actionData.details,
      ipAddress: '192.168.1.100',
    });
  }
  
  return logs;
};

