// Excel Export Service
// Uses CSV format for broad compatibility (opens in Excel, Google Sheets, etc.)

export interface ExportColumn {
  key: string;
  label: string;
  format?: 'currency' | 'number' | 'date' | 'datetime';
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  includeTimestamp?: boolean;
}

function formatValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '';
  
  switch (format) {
    case 'currency':
      return Number(value).toFixed(2);
    case 'number':
      return String(Number(value));
    case 'date':
      return new Date(String(value)).toLocaleDateString('ms-MY');
    case 'datetime':
      return new Date(String(value)).toLocaleString('ms-MY');
    default:
      // Escape quotes and wrap in quotes if contains comma
      const strValue = String(value);
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
  }
}

export function exportToCSV(options: ExportOptions): void {
  const { filename, columns, data, includeTimestamp = true } = options;
  
  // Create header row
  const headers = columns.map(col => col.label).join(',');
  
  // Create data rows
  const rows = data.map(row => 
    columns.map(col => formatValue(row[col.key], col.format)).join(',')
  );
  
  // Combine with BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const csvContent = BOM + [headers, ...rows].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
  link.href = url;
  link.download = `${filename}${timestamp}.csv`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Pre-defined export functions

export function exportOrders(orders: Array<{
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  customerPhone: string;
  orderType: string;
  status: string;
  createdAt: string;
}>): void {
  exportToCSV({
    filename: 'pesanan',
    columns: [
      { key: 'orderNumber', label: 'No. Pesanan' },
      { key: 'items', label: 'Items' },
      { key: 'total', label: 'Jumlah (BND)', format: 'currency' },
      { key: 'customerPhone', label: 'Telefon' },
      { key: 'orderType', label: 'Jenis' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Tarikh/Masa', format: 'datetime' },
    ],
    data: orders.map(o => ({
      ...o,
      items: o.items.map(i => `${i.quantity}x ${i.name}`).join('; '),
    })),
  });
}

export function exportInventory(inventory: Array<{
  name: string;
  category: string;
  currentQuantity: number;
  minQuantity: number;
  unit: string;
  cost: number;
  supplier?: string;
}>): void {
  exportToCSV({
    filename: 'inventori',
    columns: [
      { key: 'name', label: 'Item' },
      { key: 'category', label: 'Kategori' },
      { key: 'currentQuantity', label: 'Kuantiti Semasa', format: 'number' },
      { key: 'minQuantity', label: 'Kuantiti Minimum', format: 'number' },
      { key: 'unit', label: 'Unit' },
      { key: 'cost', label: 'Kos (BND)', format: 'currency' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'value', label: 'Nilai (BND)', format: 'currency' },
      { key: 'status', label: 'Status' },
    ],
    data: inventory.map(i => ({
      ...i,
      value: i.currentQuantity * i.cost,
      status: i.currentQuantity <= i.minQuantity ? 'Stok Rendah' : 'OK',
    })),
  });
}

export function exportStaff(staff: Array<{
  name: string;
  role: string;
  baseSalary: number;
  hourlyRate: number;
  phone: string;
  status: string;
}>): void {
  exportToCSV({
    filename: 'staf',
    columns: [
      { key: 'name', label: 'Nama' },
      { key: 'role', label: 'Jawatan' },
      { key: 'baseSalary', label: 'Gaji Asas (BND)', format: 'currency' },
      { key: 'hourlyRate', label: 'Kadar Sejam (BND)', format: 'currency' },
      { key: 'phone', label: 'Telefon' },
      { key: 'status', label: 'Status' },
    ],
    data: staff,
  });
}

export function exportExpenses(expenses: Array<{
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  vendor?: string;
}>): void {
  exportToCSV({
    filename: 'perbelanjaan',
    columns: [
      { key: 'date', label: 'Tarikh', format: 'date' },
      { key: 'category', label: 'Kategori' },
      { key: 'description', label: 'Keterangan' },
      { key: 'amount', label: 'Jumlah (BND)', format: 'currency' },
      { key: 'paymentMethod', label: 'Cara Bayaran' },
      { key: 'vendor', label: 'Vendor' },
    ],
    data: expenses,
  });
}

export function exportCustomers(customers: Array<{
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  segment: string;
  createdAt: string;
}>): void {
  exportToCSV({
    filename: 'pelanggan',
    columns: [
      { key: 'name', label: 'Nama' },
      { key: 'phone', label: 'Telefon' },
      { key: 'email', label: 'Email' },
      { key: 'loyaltyPoints', label: 'Mata Kesetiaan', format: 'number' },
      { key: 'totalSpent', label: 'Jumlah Belanja (BND)', format: 'currency' },
      { key: 'totalOrders', label: 'Jumlah Pesanan', format: 'number' },
      { key: 'segment', label: 'Segmen' },
      { key: 'createdAt', label: 'Tarikh Daftar', format: 'date' },
    ],
    data: customers,
  });
}

export function exportAttendance(attendance: Array<{
  staffName: string;
  date: string;
  clockInTime?: string;
  clockOutTime?: string;
  hoursWorked: number;
}>): void {
  exportToCSV({
    filename: 'kehadiran',
    columns: [
      { key: 'staffName', label: 'Nama Staf' },
      { key: 'date', label: 'Tarikh', format: 'date' },
      { key: 'clockInTime', label: 'Clock In' },
      { key: 'clockOutTime', label: 'Clock Out' },
      { key: 'hoursWorked', label: 'Jam Bekerja', format: 'number' },
    ],
    data: attendance,
  });
}

// Export all data as a single JSON backup
export function exportAllData(data: Record<string, unknown>): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = `abangbob-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

