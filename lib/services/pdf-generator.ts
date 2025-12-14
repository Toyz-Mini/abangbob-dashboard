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

// Payslip PDF Generator
export interface PayslipData {
  staffName: string;
  staffId?: string;
  role: string;
  period: string;
  daysWorked: number;
  regularHours: number;
  otHours: number;
  hourlyRate: number;
  otRate: number;
  regularPay: number;
  otPay: number;
  kpiScore?: number;
  kpiBonus?: number;
  grossPay: number;
  deductions: {
    tap: number;
    scp: number;
    advances?: number;
    other?: number;
  };
  netPay: number;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
  };
}

export function generatePayslipHTML(payslip: PayslipData): string {
  const totalDeductions = payslip.deductions.tap + payslip.deductions.scp + 
    (payslip.deductions.advances || 0) + (payslip.deductions.other || 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payslip - ${payslip.staffName} - ${payslip.period}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
          background: white;
          font-size: 12px;
        }
        .payslip {
          border: 1px solid #333;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #333;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .company-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .company-sub {
          font-size: 10px;
          color: #666;
        }
        .title {
          font-size: 14px;
          font-weight: bold;
          margin-top: 10px;
        }
        .section {
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px dashed #ccc;
        }
        .section-title {
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
          font-size: 10px;
          color: #666;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .row.indent {
          padding-left: 15px;
          font-size: 11px;
          color: #666;
        }
        .row.total {
          font-weight: bold;
          border-top: 1px solid #333;
          padding-top: 5px;
          margin-top: 5px;
        }
        .earnings {
          color: #059669;
        }
        .deduction {
          color: #dc2626;
        }
        .net-pay {
          background: #d1fae5;
          padding: 10px;
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          color: #059669;
          border-radius: 4px;
          margin: 15px 0;
        }
        .net-pay-label {
          font-size: 10px;
          color: #333;
          font-weight: normal;
        }
        .kpi-bonus {
          background: #fef3c7;
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #999;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed #ccc;
        }
        @media print {
          body { padding: 0; }
          .payslip { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="payslip">
        <div class="header">
          <div class="company-name">ABANGBOB</div>
          <div class="company-sub">Nasi Lemak & Burger</div>
          <div class="title">SLIP GAJI</div>
        </div>

        <div class="section">
          <div class="section-title">Maklumat Pekerja</div>
          <div class="row">
            <span>Nama</span>
            <span>${payslip.staffName}</span>
          </div>
          <div class="row">
            <span>Jawatan</span>
            <span>${payslip.role}</span>
          </div>
          <div class="row">
            <span>Tempoh</span>
            <span>${payslip.period}</span>
          </div>
          <div class="row">
            <span>Hari Bekerja</span>
            <span>${payslip.daysWorked} hari</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Pendapatan</div>
          <div class="row earnings">
            <span>Gaji Biasa (${payslip.regularHours.toFixed(1)}h × BND ${payslip.hourlyRate.toFixed(2)})</span>
            <span>BND ${payslip.regularPay.toFixed(2)}</span>
          </div>
          ${payslip.otHours > 0 ? `
          <div class="row earnings">
            <span>OT (${payslip.otHours.toFixed(1)}h × BND ${(payslip.hourlyRate * payslip.otRate).toFixed(2)})</span>
            <span>BND ${payslip.otPay.toFixed(2)}</span>
          </div>
          ` : ''}
          ${payslip.kpiBonus && payslip.kpiBonus > 0 ? `
          <div class="kpi-bonus">
            <div class="row">
              <span>🏆 Bonus KPI (${payslip.kpiScore}%)</span>
              <span>+ BND ${payslip.kpiBonus.toFixed(2)}</span>
            </div>
          </div>
          ` : ''}
          <div class="row total">
            <span>Jumlah Pendapatan</span>
            <span>BND ${payslip.grossPay.toFixed(2)}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Potongan</div>
          <div class="row deduction">
            <span>TAP</span>
            <span>- BND ${payslip.deductions.tap.toFixed(2)}</span>
          </div>
          <div class="row deduction">
            <span>SCP</span>
            <span>- BND ${payslip.deductions.scp.toFixed(2)}</span>
          </div>
          ${payslip.deductions.advances && payslip.deductions.advances > 0 ? `
          <div class="row deduction">
            <span>Pendahuluan</span>
            <span>- BND ${payslip.deductions.advances.toFixed(2)}</span>
          </div>
          ` : ''}
          ${payslip.deductions.other && payslip.deductions.other > 0 ? `
          <div class="row deduction">
            <span>Lain-lain</span>
            <span>- BND ${payslip.deductions.other.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="row total">
            <span>Jumlah Potongan</span>
            <span class="deduction">- BND ${totalDeductions.toFixed(2)}</span>
          </div>
        </div>

        <div class="net-pay">
          <div class="net-pay-label">GAJI BERSIH</div>
          BND ${payslip.netPay.toFixed(2)}
        </div>

        ${payslip.bankDetails ? `
        <div class="section" style="border-bottom: none;">
          <div class="section-title">Maklumat Bank</div>
          <div class="row">
            <span>Bank</span>
            <span>${payslip.bankDetails.bankName}</span>
          </div>
          <div class="row">
            <span>No. Akaun</span>
            <span>${payslip.bankDetails.accountNumber}</span>
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Dijana pada: ${new Date().toLocaleString('ms-MY')}</p>
          <p>© ${new Date().getFullYear()} AbangBob Dashboard</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function printPayslip(payslip: PayslipData): void {
  const html = generatePayslipHTML(payslip);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

export function downloadPayslipPDF(payslip: PayslipData): void {
  const html = generatePayslipHTML(payslip);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Set title for PDF filename
    printWindow.document.title = `Payslip_${payslip.staffName.replace(/\s+/g, '_')}_${payslip.period.replace(/\s+/g, '_')}`;
    
    printWindow.onload = () => {
      // Trigger print dialog (user can save as PDF)
      printWindow.print();
    };
  }
}

