// Receipt Generator Service
// Builds receipt data structure and handles receipt-related operations

import {
  Order,
  ReceiptSettings,
  DEFAULT_RECEIPT_SETTINGS,
  CartItem
} from '@/lib/types';

// ==================== RECEIPT DATA STRUCTURE ====================

export interface ReceiptLine {
  type: 'text' | 'divider' | 'item' | 'total' | 'qrcode' | 'logo' | 'spacer';
  content?: string;
  rightContent?: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  doubleWidth?: boolean;
  doubleHeight?: boolean;
  small?: boolean;
  modifiers?: string[];
  imageUrl?: string;
  qrData?: string;
}

export interface ReceiptData {
  orderNumber: string;
  timestamp: string;
  lines: ReceiptLine[];
  settings: ReceiptSettings;
  order: Order;
}

// ==================== RECEIPT GENERATOR ====================

export function generateReceiptData(
  order: Order,
  settings: Partial<ReceiptSettings> = {}
): ReceiptData {
  const mergedSettings: ReceiptSettings = {
    ...DEFAULT_RECEIPT_SETTINGS,
    ...settings,
  };

  const lines: ReceiptLine[] = [];

  // Logo Top
  if (mergedSettings.showLogoTop && mergedSettings.logoTopUrl) {
    lines.push({ type: 'logo', imageUrl: mergedSettings.logoTopUrl, align: 'center' });
    lines.push({ type: 'spacer' });
  }

  // Business Name
  lines.push({
    type: 'text',
    content: mergedSettings.businessName,
    align: 'center',
    bold: true,
    doubleWidth: true,
  });

  // Tagline
  if (mergedSettings.businessTagline) {
    lines.push({
      type: 'text',
      content: mergedSettings.businessTagline,
      align: 'center'
    });
  }

  // Address
  if (mergedSettings.businessAddress) {
    lines.push({
      type: 'text',
      content: mergedSettings.businessAddress,
      align: 'center',
      small: true,
    });
  }

  // Phone
  if (mergedSettings.businessPhone) {
    lines.push({
      type: 'text',
      content: `Tel: ${mergedSettings.businessPhone}`,
      align: 'center',
      small: true,
    });
  }

  // Header Text
  if (mergedSettings.headerText) {
    lines.push({ type: 'spacer' });
    const headerLines = mergedSettings.headerText.split('\n');
    for (const line of headerLines) {
      lines.push({ type: 'text', content: line, align: 'center' });
    }
  }

  // Divider
  lines.push({ type: 'divider' });

  // Order Number
  lines.push({
    type: 'text',
    content: `No: ${order.orderNumber}`,
    bold: true
  });

  // Date/Time
  lines.push({
    type: 'text',
    content: formatDateTime(order.createdAt),
    small: true
  });

  // Customer Name
  if (mergedSettings.showCustomerName && order.customerName) {
    lines.push({
      type: 'text',
      content: `Pelanggan: ${order.customerName}`
    });
  }

  // Customer Phone
  if (mergedSettings.showCustomerPhone && order.customerPhone) {
    lines.push({
      type: 'text',
      content: `Tel: ${order.customerPhone}`,
      small: true,
    });
  }

  // Order Type
  lines.push({
    type: 'text',
    content: order.orderType === 'takeaway' ? 'Bungkus (Takeaway)' : 'GoMamam'
  });

  // Divider
  lines.push({ type: 'divider' });

  // Items
  for (const item of order.items) {
    const itemTotal = (item.itemTotal * item.quantity).toFixed(2);
    lines.push({
      type: 'item',
      content: `${item.quantity}x ${item.name}`,
      rightContent: `BND ${itemTotal}`,
      modifiers: item.selectedModifiers?.map(m => `+ ${m.optionName}`),
    });
  }

  // Divider
  lines.push({ type: 'divider' });

  // Subtotal
  const subtotal = calculateSubtotal(order.items);
  lines.push({
    type: 'item',
    content: 'Subtotal:',
    rightContent: `BND ${subtotal.toFixed(2)}`,
    small: true,
  });

  // Total
  lines.push({
    type: 'total',
    content: 'JUMLAH:',
    rightContent: `BND ${order.total.toFixed(2)}`,
    bold: true,
  });

  // Payment Method
  if (order.paymentMethod) {
    const paymentLabel = getPaymentMethodLabel(order.paymentMethod);
    lines.push({ type: 'spacer' });
    lines.push({
      type: 'text',
      content: `Bayar: ${paymentLabel}`,
      align: 'center'
    });
  }

  // Divider
  lines.push({ type: 'divider' });

  // Custom Message
  if (mergedSettings.customMessage) {
    const messageLines = mergedSettings.customMessage.split('\n');
    for (const line of messageLines) {
      lines.push({ type: 'text', content: line, align: 'center' });
    }
    lines.push({ type: 'spacer' });
  }

  // Footer Text
  if (mergedSettings.footerText) {
    const footerLines = mergedSettings.footerText.split('\n');
    for (const line of footerLines) {
      lines.push({ type: 'text', content: line, align: 'center', bold: true });
    }
  }

  // Social Media
  if (mergedSettings.showSocialMedia) {
    lines.push({ type: 'spacer' });
    if (mergedSettings.instagram) {
      lines.push({ type: 'text', content: `IG: ${mergedSettings.instagram}`, align: 'center', small: true });
    }
    if (mergedSettings.facebook) {
      lines.push({ type: 'text', content: `FB: ${mergedSettings.facebook}`, align: 'center', small: true });
    }
    if (mergedSettings.tiktok) {
      lines.push({ type: 'text', content: `TikTok: ${mergedSettings.tiktok}`, align: 'center', small: true });
    }
    if (mergedSettings.whatsapp) {
      lines.push({ type: 'text', content: `WA: ${mergedSettings.whatsapp}`, align: 'center', small: true });
    }
  }

  // QR Code
  if (mergedSettings.showQrCode && mergedSettings.qrCodeUrl) {
    lines.push({ type: 'spacer' });
    lines.push({ type: 'qrcode', qrData: mergedSettings.qrCodeUrl, align: 'center' });
    if (mergedSettings.qrCodeLabel) {
      lines.push({ type: 'text', content: mergedSettings.qrCodeLabel, align: 'center', small: true });
    }
  }

  // Logo Bottom
  if (mergedSettings.showLogoBottom && mergedSettings.logoBottomUrl) {
    lines.push({ type: 'spacer' });
    lines.push({ type: 'logo', imageUrl: mergedSettings.logoBottomUrl, align: 'center' });
  }

  // End
  lines.push({ type: 'spacer' });
  lines.push({ type: 'text', content: '*** TERIMA KASIH ***', align: 'center', small: true });

  return {
    orderNumber: order.orderNumber,
    timestamp: order.createdAt,
    lines,
    settings: mergedSettings,
    order,
  };
}

// ==================== KITCHEN SLIP GENERATOR ====================

export function generateKitchenSlipData(order: Order): ReceiptLine[] {
  const lines: ReceiptLine[] = [];

  // Header
  lines.push({
    type: 'text',
    content: 'SLIP DAPUR',
    align: 'center',
    bold: true,
    doubleWidth: true,
  });

  lines.push({ type: 'divider' });

  // Order Number (BIG)
  lines.push({
    type: 'text',
    content: order.orderNumber,
    align: 'center',
    bold: true,
    doubleWidth: true,
    doubleHeight: true,
  });

  // Order Type
  lines.push({
    type: 'text',
    content: order.orderType === 'takeaway' ? '[ BUNGKUS ]' : '[ GOMAMAM ]',
    align: 'center',
    bold: true,
  });

  // Customer Name
  if (order.customerName) {
    lines.push({
      type: 'text',
      content: `Pelanggan: ${order.customerName}`,
      align: 'center',
    });
  }

  // Time
  lines.push({
    type: 'text',
    content: formatTime(order.createdAt),
    align: 'center',
    small: true,
  });

  lines.push({ type: 'divider' });

  // Items (large)
  for (const item of order.items) {
    lines.push({
      type: 'text',
      content: `${item.quantity}x ${item.name}`,
      bold: true,
      doubleHeight: true,
    });

    // Modifiers
    if (item.selectedModifiers?.length > 0) {
      for (const mod of item.selectedModifiers) {
        lines.push({
          type: 'text',
          content: `  → ${mod.optionName}`,
          bold: true,
        });
      }
    }

    lines.push({ type: 'spacer' });
  }

  lines.push({ type: 'divider' });

  // Total items count
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  lines.push({
    type: 'text',
    content: `Total: ${totalItems} item${totalItems > 1 ? 's' : ''}`,
    align: 'center',
    bold: true,
  });

  return lines;
}

// ==================== HELPER FUNCTIONS ====================

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.itemTotal * item.quantity), 0);
}

function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'cash': return 'TUNAI';
    case 'card': return 'KAD';
    case 'qr': return 'QR CODE';
    case 'ewallet': return 'E-WALLET';
    default: return method.toUpperCase();
  }
}

// ==================== RECEIPT STORAGE ====================

import { getSupabaseClient } from '@/lib/supabase/client';

const RECEIPT_SETTINGS_KEY = 'abangbob_receipt_settings';
const PRINTER_SETTINGS_KEY = 'abangbob_printer_settings';

export function saveReceiptSettings(settings: ReceiptSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(RECEIPT_SETTINGS_KEY, JSON.stringify(settings));
    // Sync to Supabase
    syncReceiptSettingsToSupabase(settings);
  }
}

export function loadReceiptSettings(): ReceiptSettings {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(RECEIPT_SETTINGS_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_RECEIPT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_RECEIPT_SETTINGS;
      }
    }
  }
  return DEFAULT_RECEIPT_SETTINGS;
}

export function savePrinterSettings(settings: object): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(settings));
    // Sync to Supabase
    syncPrinterSettingsToSupabase(settings);
  }
}

export function loadPrinterSettings(): object | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(PRINTER_SETTINGS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Sync receipt settings to Supabase (async, fire and forget)
async function syncReceiptSettingsToSupabase(settings: ReceiptSettings): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await (supabase.from('app_settings') as any).upsert({
      setting_key: 'receipt_settings',
      setting_value: settings,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'setting_key',
    });
    console.log('[Receipt] Settings synced to Supabase');
  } catch (error) {
    console.error('[Receipt] Failed to sync settings to Supabase:', error);
  }
}

// Sync printer settings to Supabase (async, fire and forget)
async function syncPrinterSettingsToSupabase(settings: object): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await (supabase.from('app_settings') as any).upsert({
      setting_key: 'printer_settings',
      setting_value: settings,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'setting_key',
    });
    console.log('[Printer] Settings synced to Supabase');
  } catch (error) {
    console.error('[Printer] Failed to sync settings to Supabase:', error);
  }
}

// ==================== ASYNC LOAD FROM SUPABASE ====================

// Load receipt settings from Supabase (with localStorage fallback)
export async function loadReceiptSettingsFromSupabase(): Promise<ReceiptSettings> {
  const supabase = getSupabaseClient();

  // Try Supabase first
  if (supabase) {
    try {
      const { data, error } = await (supabase.from('app_settings') as any)
        .select('setting_value')
        .eq('setting_key', 'receipt_settings')
        .single();

      if (!error && data?.setting_value) {
        const settings = { ...DEFAULT_RECEIPT_SETTINGS, ...data.setting_value };
        // Also update localStorage for faster subsequent loads
        if (typeof window !== 'undefined') {
          localStorage.setItem(RECEIPT_SETTINGS_KEY, JSON.stringify(settings));
        }
        console.log('[Receipt] Loaded settings from Supabase');
        return settings;
      }
    } catch (error) {
      console.error('[Receipt] Failed to load from Supabase:', error);
    }
  }

  // Fallback to localStorage
  return loadReceiptSettings();
}

// Load printer settings from Supabase (with localStorage fallback)
export async function loadPrinterSettingsFromSupabase(): Promise<object | null> {
  const supabase = getSupabaseClient();

  // Try Supabase first
  if (supabase) {
    try {
      const { data, error } = await (supabase.from('app_settings') as any)
        .select('setting_value')
        .eq('setting_key', 'printer_settings')
        .single();

      if (!error && data?.setting_value) {
        // Also update localStorage for faster subsequent loads
        if (typeof window !== 'undefined') {
          localStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(data.setting_value));
        }
        console.log('[Printer] Loaded settings from Supabase');
        return data.setting_value;
      }
    } catch (error) {
      console.error('[Printer] Failed to load from Supabase:', error);
    }
  }

  // Fallback to localStorage
  return loadPrinterSettings();
}

// ==================== EXPORTS ====================

export {
  formatDateTime,
  formatTime,
  calculateSubtotal,
  getPaymentMethodLabel,
};

