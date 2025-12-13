// PDF Generator Service
// Uses browser's print functionality for PDF generation

export interface ReportData {
  title: string;
  subtitle?: string;
  date: string;
  data: Record<string, unknown>[];
  summary?: Record<string, string | number>;
  columns: { key: string; label: string; format?: 'currency' | 'number' | 'date' }[];
}

export function generatePrintableReport(report: ReportData): string {
  const formatValue = (value: unknown, format?: string): string => {
    if (value === null || value === undefined) return '-';
    
    switch (format) {
      case 'currency':
        return `BND ${Number(value).toFixed(2)}`;
      case 'number':
        return Number(value).toLocaleString();
      case 'date':
        return new Date(String(value)).toLocaleDateString('ms-MY');
      default:
        return String(value);
    }
  };

  const tableRows = report.data.map(row => 
    `<tr>
      ${report.columns.map(col => 
        `<td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatValue(row[col.key], col.format)}</td>`
      ).join('')}
    </tr>`
  ).join('');

  const summarySection = report.summary ? `
    <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0; font-size: 14px;">Ringkasan</h3>
      ${Object.entries(report.summary).map(([key, value]) => 
        `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>${key}:</span>
          <strong>${value}</strong>
        </div>`
      ).join('')}
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${report.title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }
        .header .subtitle {
          color: #666;
          margin-top: 5px;
        }
        .header .date {
          color: #999;
          font-size: 12px;
          margin-top: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #2563eb;
          color: white;
          padding: 10px 8px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
        }
        td {
          font-size: 13px;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 11px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ABANGBOB</h1>
        <div class="subtitle">Nasi Lemak & Burger</div>
        <h2 style="margin: 20px 0 0 0; font-size: 18px;">${report.title}</h2>
        ${report.subtitle ? `<div class="subtitle">${report.subtitle}</div>` : ''}
        <div class="date">Dijana pada: ${report.date}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            ${report.columns.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      ${summarySection}
      
      <div class="footer">
        <p>Laporan ini dijana secara automatik oleh AbangBob Dashboard</p>
        <p>© ${new Date().getFullYear()} AbangBob. Hak cipta terpelihara.</p>
      </div>
    </body>
    </html>
  `;
}

export function printReport(report: ReportData): void {
  const html = generatePrintableReport(report);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// Pre-defined report generators
export function generateDailySalesReport(orders: Array<{
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  orderType: string;
  status: string;
  createdAt: string;
}>, date: string): ReportData {
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  return {
    title: 'Laporan Jualan Harian',
    subtitle: date,
    date: new Date().toLocaleString('ms-MY'),
    columns: [
      { key: 'orderNumber', label: 'No. Pesanan' },
      { key: 'items', label: 'Items' },
      { key: 'total', label: 'Jumlah', format: 'currency' },
      { key: 'orderType', label: 'Jenis' },
      { key: 'status', label: 'Status' },
      { key: 'time', label: 'Masa' },
    ],
    data: orders.map(o => ({
      orderNumber: o.orderNumber,
      items: o.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
      total: o.total,
      orderType: o.orderType,
      status: o.status,
      time: new Date(o.createdAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
    })),
    summary: {
      'Jumlah Pesanan': orders.length,
      'Pesanan Selesai': completedOrders,
      'Jumlah Jualan': `BND ${totalSales.toFixed(2)}`,
      'Purata Per Pesanan': `BND ${(totalSales / orders.length || 0).toFixed(2)}`,
    },
  };
}

export function generateInventoryReport(inventory: Array<{
  name: string;
  category: string;
  currentQuantity: number;
  minQuantity: number;
  unit: string;
  cost: number;
}>): ReportData {
  const totalValue = inventory.reduce((sum, i) => sum + (i.currentQuantity * i.cost), 0);
  const lowStockCount = inventory.filter(i => i.currentQuantity <= i.minQuantity).length;

  return {
    title: 'Laporan Inventori',
    date: new Date().toLocaleString('ms-MY'),
    columns: [
      { key: 'name', label: 'Item' },
      { key: 'category', label: 'Kategori' },
      { key: 'currentQuantity', label: 'Kuantiti', format: 'number' },
      { key: 'minQuantity', label: 'Minimum', format: 'number' },
      { key: 'unit', label: 'Unit' },
      { key: 'value', label: 'Nilai', format: 'currency' },
      { key: 'status', label: 'Status' },
    ],
    data: inventory.map(i => ({
      name: i.name,
      category: i.category,
      currentQuantity: i.currentQuantity,
      minQuantity: i.minQuantity,
      unit: i.unit,
      value: i.currentQuantity * i.cost,
      status: i.currentQuantity <= i.minQuantity ? '⚠️ Rendah' : '✓ OK',
    })),
    summary: {
      'Jumlah Item': inventory.length,
      'Item Stok Rendah': lowStockCount,
      'Jumlah Nilai Inventori': `BND ${totalValue.toFixed(2)}`,
    },
  };
}

export function generateStaffAttendanceReport(staff: Array<{
  name: string;
  role: string;
}>, attendance: Array<{
  staffId: string;
  date: string;
  clockInTime?: string;
  clockOutTime?: string;
}>, month: string): ReportData {
  const staffAttendance = staff.map(s => {
    const records = attendance.filter(a => a.staffId === s.name && a.date.startsWith(month));
    const daysPresent = records.filter(r => r.clockInTime).length;
    
    let totalHours = 0;
    records.forEach(r => {
      if (r.clockInTime && r.clockOutTime) {
        const [inH, inM] = r.clockInTime.split(':').map(Number);
        const [outH, outM] = r.clockOutTime.split(':').map(Number);
        totalHours += ((outH * 60 + outM) - (inH * 60 + inM)) / 60;
      }
    });

    return {
      name: s.name,
      role: s.role,
      daysPresent,
      totalHours: Math.round(totalHours),
    };
  });

  return {
    title: 'Laporan Kehadiran Staf',
    subtitle: month,
    date: new Date().toLocaleString('ms-MY'),
    columns: [
      { key: 'name', label: 'Nama' },
      { key: 'role', label: 'Jawatan' },
      { key: 'daysPresent', label: 'Hari Hadir', format: 'number' },
      { key: 'totalHours', label: 'Jumlah Jam', format: 'number' },
    ],
    data: staffAttendance,
    summary: {
      'Jumlah Staf': staff.length,
    },
  };
}

export function generateExpenseReport(expenses: Array<{
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
}>, month: string): ReportData {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Group by category
  const byCategory: Record<string, number> = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  return {
    title: 'Laporan Perbelanjaan',
    subtitle: month,
    date: new Date().toLocaleString('ms-MY'),
    columns: [
      { key: 'date', label: 'Tarikh', format: 'date' },
      { key: 'category', label: 'Kategori' },
      { key: 'description', label: 'Keterangan' },
      { key: 'amount', label: 'Jumlah', format: 'currency' },
      { key: 'paymentMethod', label: 'Cara Bayaran' },
    ],
    data: expenses,
    summary: {
      'Jumlah Transaksi': expenses.length,
      'Jumlah Perbelanjaan': `BND ${totalExpenses.toFixed(2)}`,
      ...Object.fromEntries(
        Object.entries(byCategory).map(([cat, amt]) => [cat, `BND ${amt.toFixed(2)}`])
      ),
    },
  };
}

