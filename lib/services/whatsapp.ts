// WhatsApp Integration Service
// Structure for WhatsApp Business API integration

import { getSupabaseClient } from '@/lib/supabase/client';

export interface WhatsAppConfig {
  apiKey?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  webhookVerifyToken?: string;
  isConfigured: boolean;
}

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'image' | 'document';
  content: string | WhatsAppTemplate;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components: Array<{
    type: 'header' | 'body' | 'button';
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
      text?: string;
      currency?: { fallback_value: string; code: string; amount_1000: number };
    }>;
  }>;
}

// Check if WhatsApp is configured
export function isWhatsAppConfigured(): boolean {
  const config = getWhatsAppConfig();
  return config.isConfigured && !!config.apiKey && !!config.phoneNumberId;
}

// Get WhatsApp configuration from localStorage (Supabase loaded on app init via Settings)
export function getWhatsAppConfig(): WhatsAppConfig {
  if (typeof window === 'undefined') {
    return { isConfigured: false };
  }

  const stored = localStorage.getItem('abangbob_whatsapp_config');
  if (stored) {
    return JSON.parse(stored);
  }

  return { isConfigured: false };
}

// Get WhatsApp config from Supabase with localStorage fallback (async)
export async function getWhatsAppConfigFromSupabase(): Promise<WhatsAppConfig> {
  const supabase = getSupabaseClient();

  // Try Supabase first
  if (supabase) {
    try {
      const { data, error } = await (supabase.from('app_settings') as any)
        .select('setting_value')
        .eq('setting_key', 'whatsapp_config')
        .single();

      if (!error && data?.setting_value) {
        // Also update localStorage for faster subsequent loads
        if (typeof window !== 'undefined') {
          localStorage.setItem('abangbob_whatsapp_config', JSON.stringify(data.setting_value));
        }
        console.log('[WhatsApp] Loaded config from Supabase');
        return data.setting_value;
      }
    } catch (error) {
      console.error('[WhatsApp] Failed to load from Supabase:', error);
    }
  }

  // Fallback to localStorage
  return getWhatsAppConfig();
}

// Save WhatsApp configuration to localStorage and Supabase
export function saveWhatsAppConfig(config: Partial<WhatsAppConfig>): void {
  const current = getWhatsAppConfig();
  const updated = {
    ...current,
    ...config,
    isConfigured: !!(config.apiKey && config.phoneNumberId)
  };
  localStorage.setItem('abangbob_whatsapp_config', JSON.stringify(updated));

  // Also sync to Supabase app_settings table
  syncWhatsAppConfigToSupabase(updated);
}

// Sync WhatsApp config to Supabase (async, fire and forget)
async function syncWhatsAppConfigToSupabase(config: WhatsAppConfig): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await (supabase.from('app_settings') as any).upsert({
      setting_key: 'whatsapp_config',
      setting_value: config,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'setting_key',
    });
    console.log('[WhatsApp] Config synced to Supabase');
  } catch (error) {
    console.error('[WhatsApp] Failed to sync config to Supabase:', error);
  }
}

// Format phone number for WhatsApp API
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Add Brunei country code if not present
  if (digits.startsWith('673')) {
    // Already has country code
  } else if (digits.startsWith('7') || digits.startsWith('8')) {
    // Brunei mobile number
    digits = '673' + digits;
  }

  return digits;
}

// Generate order receipt message
export function generateOrderReceiptMessage(order: {
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  orderType: string;
}): string {
  const itemsList = order.items
    .map(item => `• ${item.quantity}x ${item.name} - BND ${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  return `
*ABANGBOB*
Nasi Lemak & Burger
━━━━━━━━━━━━━━━

*Resit Pesanan*
No: ${order.orderNumber}
Jenis: ${order.orderType === 'takeaway' ? 'Takeaway' : 'GoMamam'}

━━━━━━━━━━━━━━━
${itemsList}
━━━━━━━━━━━━━━━

*JUMLAH: BND ${order.total.toFixed(2)}*

Terima kasih!
Sila datang lagi 🙏
`.trim();
}

// Generate order ready notification
export function generateOrderReadyMessage(order: {
  orderNumber: string;
  customerName?: string;
}): string {
  return `
*ABANGBOB*
━━━━━━━━━━━━━━━

Hai${order.customerName ? ` ${order.customerName}` : ''}! 👋

Pesanan anda *${order.orderNumber}* sudah siap!

Sila ambil di kaunter.

Selamat menjamu selera! 🍽️
`.trim();
}

// Generate low stock alert message
export function generateLowStockAlertMessage(items: Array<{
  name: string;
  currentQuantity: number;
  unit: string;
}>): string {
  const itemsList = items
    .map(item => `• ${item.name}: ${item.currentQuantity} ${item.unit}`)
    .join('\n');

  return `
*⚠️ AMARAN STOK RENDAH*
━━━━━━━━━━━━━━━

Item berikut perlu diisi semula:

${itemsList}

Sila buat pesanan kepada supplier segera.
`.trim();
}

// Generate daily summary message
export function generateDailySummaryMessage(summary: {
  date: string;
  totalSales: number;
  totalOrders: number;
  topItems: Array<{ name: string; quantity: number }>;
}): string {
  const topItemsList = summary.topItems
    .slice(0, 5)
    .map((item, idx) => `${idx + 1}. ${item.name} (${item.quantity})`)
    .join('\n');

  return `
*📊 RINGKASAN HARIAN*
━━━━━━━━━━━━━━━
${summary.date}

💰 *Jumlah Jualan*
BND ${summary.totalSales.toFixed(2)}

📦 *Jumlah Pesanan*
${summary.totalOrders} pesanan

🏆 *Top 5 Items*
${topItemsList}

━━━━━━━━━━━━━━━
AbangBob Dashboard
`.trim();
}

// Send WhatsApp message (mock implementation)
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const config = getWhatsAppConfig();

  if (!config.isConfigured) {
    return {
      success: false,
      error: 'WhatsApp belum dikonfigurasi. Sila masukkan API key dalam Tetapan.',
    };
  }

  // In real implementation, this would call the WhatsApp Business API
  // For now, we'll simulate the API call
  console.log('📱 WhatsApp Message (Simulated):', {
    to: message.to,
    type: message.type,
    content: message.content,
  });

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // For demo, always return success
  return {
    success: true,
    messageId: `wamid_${Date.now()}`,
  };
}

// Helper to open WhatsApp Web with pre-filled message
export function openWhatsAppWeb(phone: string, message: string): void {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  window.open(url, '_blank');
}

// Send receipt via WhatsApp Web (fallback method)
export function sendReceiptViaWhatsAppWeb(phone: string, order: {
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  orderType: string;
}): void {
  const message = generateOrderReceiptMessage(order);
  openWhatsAppWeb(phone, message);
}

