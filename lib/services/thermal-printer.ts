// Thermal Printer Service using Web Serial API and ESC/POS commands
// Supports USB thermal printers like Epson, XPrinter, etc.

import { ReceiptSettings, Order, PrinterSettings, DEFAULT_PRINTER_SETTINGS } from '@/lib/types';

// Web Serial API type declarations (not included in default TypeScript)
declare global {
  interface Navigator {
    serial: Serial;
  }

  interface Serial {
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPortType>;
    getPorts(): Promise<SerialPortType[]>;
  }

  interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
  }

  interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
  }

  interface SerialPortType {
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
  }

  interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: 'none' | 'even' | 'odd';
    flowControl?: 'none' | 'hardware';
  }
}

// ==================== ESC/POS COMMANDS ====================

const ESC = 0x1B;
const GS = 0x1D;
const FS = 0x1C;
const DLE = 0x10;

export const ESCPOS = {
  // Initialize printer
  INIT: new Uint8Array([ESC, 0x40]),

  // Text alignment
  ALIGN_LEFT: new Uint8Array([ESC, 0x61, 0x00]),
  ALIGN_CENTER: new Uint8Array([ESC, 0x61, 0x01]),
  ALIGN_RIGHT: new Uint8Array([ESC, 0x61, 0x02]),

  // Text formatting
  BOLD_ON: new Uint8Array([ESC, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([ESC, 0x45, 0x00]),
  UNDERLINE_ON: new Uint8Array([ESC, 0x2D, 0x01]),
  UNDERLINE_OFF: new Uint8Array([ESC, 0x2D, 0x00]),
  DOUBLE_HEIGHT_ON: new Uint8Array([ESC, 0x21, 0x10]),
  DOUBLE_WIDTH_ON: new Uint8Array([ESC, 0x21, 0x20]),
  DOUBLE_SIZE_ON: new Uint8Array([ESC, 0x21, 0x30]),
  NORMAL_SIZE: new Uint8Array([ESC, 0x21, 0x00]),

  // Font selection
  FONT_A: new Uint8Array([ESC, 0x4D, 0x00]),
  FONT_B: new Uint8Array([ESC, 0x4D, 0x01]),

  // Line spacing
  LINE_SPACING_DEFAULT: new Uint8Array([ESC, 0x32]),
  LINE_SPACING_SET: (n: number) => new Uint8Array([ESC, 0x33, n]),

  // Paper control
  LINE_FEED: new Uint8Array([0x0A]),
  CARRIAGE_RETURN: new Uint8Array([0x0D]),
  FEED_LINES: (n: number) => new Uint8Array([ESC, 0x64, n]),

  // Cut paper
  PARTIAL_CUT: new Uint8Array([GS, 0x56, 0x01]),
  FULL_CUT: new Uint8Array([GS, 0x56, 0x00]),
  FULL_CUT_FEED: new Uint8Array([GS, 0x56, 0x41, 0x03]),

  // Cash drawer
  KICK_DRAWER_PIN2: new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xFA]),
  KICK_DRAWER_PIN5: new Uint8Array([ESC, 0x70, 0x01, 0x19, 0xFA]),

  // Character set
  CHARSET_PC437: new Uint8Array([ESC, 0x74, 0x00]),
  CHARSET_PC850: new Uint8Array([ESC, 0x74, 0x02]),
  CHARSET_PC860: new Uint8Array([ESC, 0x74, 0x03]),

  // Barcode
  BARCODE_HEIGHT: (n: number) => new Uint8Array([GS, 0x68, n]),
  BARCODE_WIDTH: (n: number) => new Uint8Array([GS, 0x77, n]),
  BARCODE_POSITION: (n: number) => new Uint8Array([GS, 0x48, n]), // 0=none, 1=above, 2=below, 3=both

  // QR Code
  QR_MODEL: new Uint8Array([GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]),
  QR_SIZE: (n: number) => new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, n]),
  QR_ERROR: new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]),
  QR_STORE: (data: string) => {
    const len = data.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);
    return new Uint8Array([GS, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...new TextEncoder().encode(data)]);
  },
  QR_PRINT: new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]),
};

// ==================== PRINTER CONNECTION ====================

export interface ThermalPrinterConnection {
  type: 'serial' | 'usb';
  port?: SerialPortType;
  writer?: WritableStreamDefaultWriter<Uint8Array>;
  reader?: ReadableStreamDefaultReader<Uint8Array>;
}

class ThermalPrinterService {
  private connection: ThermalPrinterConnection | null = null;
  private settings: PrinterSettings = DEFAULT_PRINTER_SETTINGS;
  private encoder = new TextEncoder();
  private charsPerLine: { '58mm': number; '80mm': number } = { '58mm': 32, '80mm': 48 };

  // Check if Web Serial API is supported
  isSupported(): boolean {
    return 'serial' in navigator;
  }

  // Get current connection status
  isConnected(): boolean {
    return this.connection !== null;
  }

  // Request and connect to a serial printer
  async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Web Serial API not supported in this browser');
      return false;
    }

    try {
      // Request port from user
      const port = await navigator.serial.requestPort();

      // Open the port with configurable baud rate
      await port.open({
        baudRate: this.settings.baudRate || 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      });

      const writer = port.writable?.getWriter();
      const reader = port.readable?.getReader();

      if (!writer) {
        throw new Error('Failed to get writer');
      }

      this.connection = {
        type: 'serial',
        port,
        writer,
        reader,
      };

      // Initialize printer
      await this.sendCommand(ESCPOS.INIT);

      this.settings = {
        ...this.settings,
        isConnected: true,
        connectionType: 'usb',
      };

      return true;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      return false;
    }
  }

  // Disconnect from printer
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        if (this.connection.writer) {
          await this.connection.writer.close();
        }
        if (this.connection.reader) {
          await this.connection.reader.cancel();
        }
        if (this.connection.port) {
          await this.connection.port.close();
        }
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
      this.connection = null;
      this.settings.isConnected = false;
    }
  }

  private buffer: Uint8Array[] = [];
  private captureMode: boolean = false;

  // Send raw command to printer
  async sendCommand(command: Uint8Array): Promise<void> {
    if (this.captureMode) {
      this.buffer.push(command);
      return;
    }

    if (!this.connection?.writer) {
      throw new Error('Printer not connected');
    }
    await this.connection.writer.write(command);
  }

  // Send text to printer
  async sendText(text: string): Promise<void> {
    const data = this.encoder.encode(text);
    await this.sendCommand(data);
  }

  // ==================== PRINT HELPERS ====================

  // Print text with alignment
  async printText(text: string, options?: {
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    underline?: boolean;
    doubleWidth?: boolean;
    doubleHeight?: boolean;
  }): Promise<void> {
    // Set alignment
    if (options?.align === 'center') {
      await this.sendCommand(ESCPOS.ALIGN_CENTER);
    } else if (options?.align === 'right') {
      await this.sendCommand(ESCPOS.ALIGN_RIGHT);
    } else {
      await this.sendCommand(ESCPOS.ALIGN_LEFT);
    }

    // Set formatting
    if (options?.bold) await this.sendCommand(ESCPOS.BOLD_ON);
    if (options?.underline) await this.sendCommand(ESCPOS.UNDERLINE_ON);
    if (options?.doubleWidth && options?.doubleHeight) {
      await this.sendCommand(ESCPOS.DOUBLE_SIZE_ON);
    } else if (options?.doubleWidth) {
      await this.sendCommand(ESCPOS.DOUBLE_WIDTH_ON);
    } else if (options?.doubleHeight) {
      await this.sendCommand(ESCPOS.DOUBLE_HEIGHT_ON);
    }

    // Print text
    await this.sendText(text);
    await this.sendCommand(ESCPOS.LINE_FEED);

    // Reset formatting
    await this.sendCommand(ESCPOS.NORMAL_SIZE);
    await this.sendCommand(ESCPOS.BOLD_OFF);
    await this.sendCommand(ESCPOS.UNDERLINE_OFF);
    await this.sendCommand(ESCPOS.ALIGN_LEFT);
  }

  // Print dashed line divider
  async printDivider(width: '58mm' | '80mm' = '80mm'): Promise<void> {
    const chars = this.charsPerLine[width];
    const line = '-'.repeat(chars);
    await this.sendText(line);
    await this.sendCommand(ESCPOS.LINE_FEED);
  }

  // Print two-column line (left and right aligned)
  async printTwoColumn(left: string, right: string, width: '58mm' | '80mm' = '80mm'): Promise<void> {
    const chars = this.charsPerLine[width];
    const spaces = chars - left.length - right.length;
    const line = left + ' '.repeat(Math.max(1, spaces)) + right;
    await this.sendText(line);
    await this.sendCommand(ESCPOS.LINE_FEED);
  }

  // Print QR Code
  async printQRCode(data: string, size: number = 6): Promise<void> {
    await this.sendCommand(ESCPOS.ALIGN_CENTER);
    await this.sendCommand(ESCPOS.QR_MODEL);
    await this.sendCommand(ESCPOS.QR_SIZE(size));
    await this.sendCommand(ESCPOS.QR_ERROR);
    await this.sendCommand(ESCPOS.QR_STORE(data));
    await this.sendCommand(ESCPOS.QR_PRINT);
    await this.sendCommand(ESCPOS.ALIGN_LEFT);
  }

  // Feed paper lines
  async feedLines(lines: number = 1): Promise<void> {
    await this.sendCommand(ESCPOS.FEED_LINES(lines));
  }

  // Cut paper
  async cutPaper(partial: boolean = true): Promise<void> {
    await this.feedLines(3);
    await this.sendCommand(partial ? ESCPOS.PARTIAL_CUT : ESCPOS.FULL_CUT);
  }

  // ==================== CASH DRAWER ====================

  // Kick open the cash drawer
  async openCashDrawer(pin: 2 | 5 = 2): Promise<void> {
    if (!this.connection && !this.captureMode) { // Added captureMode check
      throw new Error('Printer not connected');
    }

    const command = pin === 2 ? ESCPOS.KICK_DRAWER_PIN2 : ESCPOS.KICK_DRAWER_PIN5;
    await this.sendCommand(command);
  }

  // ==================== RECEIPT PRINTING ====================

  // Print a full receipt
  async printReceipt(order: Order, receiptSettings: ReceiptSettings): Promise<void> {
    const width = receiptSettings.receiptWidth;

    // Initialize
    await this.sendCommand(ESCPOS.INIT);

    // Business name
    await this.printText(receiptSettings.businessName, {
      align: 'center',
      bold: true,
      doubleWidth: true
    });

    // Tagline
    if (receiptSettings.businessTagline) {
      await this.printText(receiptSettings.businessTagline, { align: 'center' });
    }

    // Address
    if (receiptSettings.businessAddress) {
      await this.printText(receiptSettings.businessAddress, { align: 'center' });
    }

    // Phone
    if (receiptSettings.businessPhone) {
      await this.printText(`Tel: ${receiptSettings.businessPhone}`, { align: 'center' });
    }

    // Header text
    if (receiptSettings.headerText) {
      await this.feedLines(1);
      const lines = receiptSettings.headerText.split('\n');
      for (const line of lines) {
        await this.printText(line, { align: 'center' });
      }
    }

    await this.printDivider(width);

    // Order info
    await this.printText(`No: ${order.orderNumber}`, { bold: true });
    await this.printText(new Date(order.createdAt).toLocaleString('ms-MY'));

    // Customer info
    if (receiptSettings.showCustomerName && order.customerName) {
      await this.printText(`Pelanggan: ${order.customerName}`);
    }
    if (receiptSettings.showCustomerPhone && order.customerPhone) {
      await this.printText(`Tel: ${order.customerPhone}`);
    }

    await this.printText(order.orderType === 'takeaway' ? 'Bungkus (Takeaway)' : 'GoMamam');

    await this.printDivider(width);

    // Items
    for (const item of order.items) {
      const itemTotal = (item.itemTotal * item.quantity).toFixed(2);
      await this.printTwoColumn(`${item.quantity}x ${item.name}`, `BND ${itemTotal}`, width);

      // Modifiers
      if (item.selectedModifiers?.length > 0) {
        for (const mod of item.selectedModifiers) {
          await this.printText(`  + ${mod.optionName}`);
        }
      }
    }

    await this.printDivider(width);

    // Total
    await this.printTwoColumn('JUMLAH:', `BND ${order.total.toFixed(2)}`, width);
    await this.sendCommand(ESCPOS.BOLD_ON);
    await this.printTwoColumn('JUMLAH:', `BND ${order.total.toFixed(2)}`, width);
    await this.sendCommand(ESCPOS.BOLD_OFF);

    // Payment method
    if (order.paymentMethod) {
      const paymentLabel = order.paymentMethod === 'cash' ? 'TUNAI' :
        order.paymentMethod === 'card' ? 'KAD' :
          order.paymentMethod === 'qr' ? 'QR CODE' : 'E-WALLET';
      await this.printText(`Bayar: ${paymentLabel}`, { align: 'center' });
    }

    await this.printDivider(width);

    // Custom message
    if (receiptSettings.customMessage) {
      const lines = receiptSettings.customMessage.split('\n');
      for (const line of lines) {
        await this.printText(line, { align: 'center' });
      }
      await this.feedLines(1);
    }

    // Footer text
    if (receiptSettings.footerText) {
      const lines = receiptSettings.footerText.split('\n');
      for (const line of lines) {
        await this.printText(line, { align: 'center', bold: true });
      }
    }

    // Social media
    if (receiptSettings.showSocialMedia) {
      await this.feedLines(1);
      if (receiptSettings.instagram) {
        await this.printText(`IG: ${receiptSettings.instagram}`, { align: 'center' });
      }
      if (receiptSettings.facebook) {
        await this.printText(`FB: ${receiptSettings.facebook}`, { align: 'center' });
      }
      if (receiptSettings.whatsapp) {
        await this.printText(`WA: ${receiptSettings.whatsapp}`, { align: 'center' });
      }
    }

    // QR Code
    if (receiptSettings.showQrCode && receiptSettings.qrCodeUrl) {
      await this.feedLines(1);
      await this.printQRCode(receiptSettings.qrCodeUrl, 6);
      if (receiptSettings.qrCodeLabel) {
        await this.printText(receiptSettings.qrCodeLabel, { align: 'center' });
      }
    }

    // End
    await this.printText('*** TERIMA KASIH ***', { align: 'center' });

    // Cut paper
    await this.cutPaper();
  }

  // ==================== RAW BT PRINTING ====================

  // Convert buffer to Base64 string safely
  private getBufferBase64(): string {
    // Combine all chunks into one Uint8Array
    const totalLength = this.buffer.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.buffer) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to binary string
    let binary = '';
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i]);
    }

    // Convert to Base64
    return window.btoa(binary);
  }

  // Print using RawBT App (Android)
  async printWithRawBT(order: Order, receiptSettings: ReceiptSettings): Promise<void> {
    try {
      // Enable capture mode
      this.captureMode = true;
      this.buffer = [];

      // Generate receipt commands in memory
      await this.printReceipt(order, receiptSettings);

      // Open cash drawer if enabled
      if (receiptSettings.openCashDrawer && order.paymentMethod === 'cash') {
        await this.openCashDrawer();
      }

      // Get Base64 data
      const base64Data = this.getBufferBase64();

      // Construct RawBT intent URL
      // S.data = base64 data
      const intentUrl = `intent:${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.data=${base64Data};end;`;

      // Open intent
      window.location.href = intentUrl;
    } catch (error) {
      console.error('RawBT Print Error:', error);
      alert('Gagal membuka RawBT. Sila pastikan app RawBT installed.');
    } finally {
      // Disable capture mode
      this.captureMode = false;
      this.buffer = [];
    }
  }

  // ==================== FALLBACK BROWSER PRINTING ====================

  // Generate HTML for browser printing (fallback when no thermal printer)
  generatePrintHTML(order: Order, receiptSettings: ReceiptSettings): string {
    const width = receiptSettings.receiptWidth === '58mm' ? '58mm' : '80mm';

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleString('ms-MY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${order.orderNumber}</title>
  <style>
    @page { size: ${width} auto; margin: 0; }
    body {
      font-family: 'Courier New', monospace;
      width: ${width};
      margin: 0 auto;
      padding: 10px;
      font-size: ${width === '58mm' ? '10px' : '12px'};
      line-height: 1.4;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; }
    .small { font-size: ${width === '58mm' ? '8px' : '10px'}; color: #666; }
    .modifier { padding-left: 12px; font-size: ${width === '58mm' ? '8px' : '9px'}; color: #666; }
    .total { font-weight: bold; font-size: ${width === '58mm' ? '12px' : '14px'}; }
    .logo { max-width: 80%; max-height: 60px; object-fit: contain; }
    .qr { width: ${width === '58mm' ? '60px' : '80px'}; height: ${width === '58mm' ? '60px' : '80px'}; background: #f0f0f0; margin: 8px auto; display: flex; align-items: center; justify-content: center; font-size: 8px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${receiptSettings.showLogoTop && receiptSettings.logoTopUrl ? `<div class="center"><img src="${receiptSettings.logoTopUrl}" class="logo" alt="Logo"></div>` : ''}
  
  <div class="center bold" style="font-size: ${width === '58mm' ? '14px' : '16px'};">${receiptSettings.businessName}</div>
  ${receiptSettings.businessTagline ? `<div class="center small">${receiptSettings.businessTagline}</div>` : ''}
  ${receiptSettings.businessAddress ? `<div class="center small">${receiptSettings.businessAddress}</div>` : ''}
  ${receiptSettings.businessPhone ? `<div class="center small">Tel: ${receiptSettings.businessPhone}</div>` : ''}
  
  ${receiptSettings.headerText ? `<div class="center" style="margin-top: 8px; white-space: pre-line;">${receiptSettings.headerText}</div>` : ''}
  
  <div class="divider"></div>
  
  <div class="bold">No: ${order.orderNumber}</div>
  <div class="small">${formatDate(order.createdAt)}</div>
  ${receiptSettings.showCustomerName && order.customerName ? `<div>Pelanggan: <strong>${order.customerName}</strong></div>` : ''}
  ${receiptSettings.showCustomerPhone && order.customerPhone ? `<div class="small">Tel: ${order.customerPhone}</div>` : ''}
  <div>${order.orderType === 'takeaway' ? 'Bungkus (Takeaway)' : 'GoMamam'}</div>
  
  <div class="divider"></div>
  
  ${order.items.map(item => `
    <div class="row">
      <span>${item.quantity}x ${item.name}</span>
      <span>BND ${(item.itemTotal * item.quantity).toFixed(2)}</span>
    </div>
    ${item.selectedModifiers?.map(mod => `<div class="modifier">+ ${mod.optionName}</div>`).join('') || ''}
  `).join('')}
  
  <div class="divider"></div>
  
  <div class="row total">
    <span>JUMLAH:</span>
    <span>BND ${order.total.toFixed(2)}</span>
  </div>
  
  ${order.paymentMethod ? `
  <div class="center" style="margin-top: 8px; padding: 4px; background: #f0f0f0;">
    Bayar: ${order.paymentMethod === 'cash' ? 'TUNAI' : order.paymentMethod === 'card' ? 'KAD' : order.paymentMethod === 'qr' ? 'QR CODE' : 'E-WALLET'}
  </div>
  ` : ''}
  
  <div class="divider"></div>
  
  ${receiptSettings.customMessage ? `<div class="center" style="font-style: italic; padding: 6px; background: #f5f5f5; white-space: pre-line;">${receiptSettings.customMessage}</div>` : ''}
  
  ${receiptSettings.footerText ? `<div class="center bold" style="white-space: pre-line;">${receiptSettings.footerText}</div>` : ''}
  
  ${receiptSettings.showSocialMedia ? `
  <div class="center small" style="margin-top: 8px;">
    ${receiptSettings.instagram ? `<div>IG: ${receiptSettings.instagram}</div>` : ''}
    ${receiptSettings.facebook ? `<div>FB: ${receiptSettings.facebook}</div>` : ''}
    ${receiptSettings.whatsapp ? `<div>WA: ${receiptSettings.whatsapp}</div>` : ''}
  </div>
  ` : ''}
  
  ${receiptSettings.showQrCode && receiptSettings.qrCodeUrl ? `
  <div class="qr">[QR CODE]</div>
  ${receiptSettings.qrCodeLabel ? `<div class="center small">${receiptSettings.qrCodeLabel}</div>` : ''}
  ` : ''}
  
  ${receiptSettings.showLogoBottom && receiptSettings.logoBottomUrl ? `<div class="center" style="margin-top: 8px;"><img src="${receiptSettings.logoBottomUrl}" class="logo" style="max-height: 40px;" alt="Logo"></div>` : ''}
  
  <div class="center small" style="margin-top: 12px;">*** TERIMA KASIH ***</div>
</body>
</html>
    `;
  }

  // Print using browser (fallback)
  printWithBrowser(order: Order, receiptSettings: ReceiptSettings): void {
    const html = this.generatePrintHTML(order, receiptSettings);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  // Smart print - use thermal if connected, else browser
  async print(order: Order, receiptSettings: ReceiptSettings): Promise<void> {
    if (this.settings.useRawbt) {
      await this.printWithRawBT(order, receiptSettings);
      return;
    }

    if (this.isConnected()) {
      await this.printReceipt(order, receiptSettings);

      // Open cash drawer for cash payments
      if (receiptSettings.openCashDrawer && order.paymentMethod === 'cash') {
        await this.openCashDrawer();
      }
    } else {
      this.printWithBrowser(order, receiptSettings);
    }
  }

  // Get settings
  getSettings(): PrinterSettings {
    return this.settings;
  }

  // Update settings
  updateSettings(updates: Partial<PrinterSettings>): void {
    this.settings = { ...this.settings, ...updates };
  }
}

// Export singleton instance
export const thermalPrinter = new ThermalPrinterService();

// Export class for testing
export { ThermalPrinterService };

