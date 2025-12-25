// Settings Sync Service for Supabase
// Handles loading and saving all settings to/from Supabase

import { getSupabaseClient } from './client';

// Types for settings
export interface OutletSettings {
    name: string;
    address: string;
    phone: string;
    email: string;
    logoUrl: string;
    currency: string;
    timezone: string;
    taxRate: number;
    mileageRate: number;
}

export interface OperatingHours {
    [day: string]: {
        open: string;
        close: string;
        closed?: boolean;
        isOpen?: boolean;
    };
}

export interface ReceiptSettings {
    headerText: string;
    footerText: string;
    showLogo: boolean;
    autoPrint: boolean;
    printKitchenSlip: boolean;
}

export interface NotificationSettings {
    lowStock: boolean;
    orderReminder: boolean;
    equipmentReminder: boolean;
}

export interface SocialMedia {
    instagram: string;
    facebook: string;
    tiktok: string;
    whatsapp: string;
}

export interface PaymentMethods {
    cash: boolean;
    card: boolean;
    qr: boolean;
    ewallet: boolean;
}

export interface AppearanceSettings {
    sidebarCollapsed: boolean;
}

export interface SecuritySettings {
    requirePIN: boolean;
    autoLogout: boolean;
    autoLogoutMinutes: number;
}

export interface AllSettings {
    outlet: OutletSettings;
    operatingHours: OperatingHours;
    receipt: ReceiptSettings;
    notification: NotificationSettings;
    socialMedia: SocialMedia;
    paymentMethods: PaymentMethods;
    appearance: AppearanceSettings;
    security: SecuritySettings;
}

// Default outlet ID (Rimba Point)
const DEFAULT_OUTLET_ID = 'b1000000-0000-0000-0000-000000000001';

/**
 * Load all settings from Supabase
 * Falls back to localStorage if Supabase is not available
 */
export async function loadSettingsFromSupabase(): Promise<AllSettings | null> {
    const supabase = getSupabaseClient();

    if (!supabase) {
        console.log('[Settings] Supabase not configured, using localStorage');
        return null;
    }

    try {
        // Load outlet settings
        // Use type assertion since outlet_settings has custom columns not in generated types
        const { data: outletData, error: outletError } = await supabase
            .from('outlet_settings')
            .select('*')
            .eq('outlet_id', DEFAULT_OUTLET_ID)
            .single() as { data: Record<string, any> | null; error: any };

        if (outletError && outletError.code !== 'PGRST116') {
            console.error('[Settings] Error loading outlet settings:', outletError);
            return null;
        }

        if (!outletData) {
            console.log('[Settings] No outlet settings found in Supabase');
            return null;
        }

        console.log('[Settings] Loaded settings from Supabase');

        return {
            outlet: {
                name: outletData.outlet_name || 'AbangBob',
                address: outletData.outlet_address || '',
                phone: outletData.outlet_phone || '',
                email: outletData.outlet_email || '',
                logoUrl: outletData.outlet_logo_url || '',
                currency: outletData.currency || 'BND',
                timezone: outletData.timezone || 'Asia/Brunei',
                taxRate: outletData.tax_rate || 0,
                mileageRate: outletData.mileage_rate || 0.60,
            },
            operatingHours: outletData.operating_hours || {},
            receipt: outletData.receipt_settings || {
                headerText: '',
                footerText: 'Terima kasih!',
                showLogo: true,
                autoPrint: false,
                printKitchenSlip: true,
            },
            notification: outletData.notification_settings || {
                lowStock: true,
                orderReminder: true,
                equipmentReminder: true,
            },
            socialMedia: outletData.social_media || {
                instagram: '@abangbob.bn',
                facebook: '',
                tiktok: '',
                whatsapp: '',
            },
            paymentMethods: outletData.payment_methods || {
                cash: true,
                card: true,
                qr: true,
                ewallet: false,
            },
            appearance: outletData.appearance || {
                sidebarCollapsed: false,
            },
            security: outletData.security || {
                requirePIN: true,
                autoLogout: false,
                autoLogoutMinutes: 30,
            },
        };
    } catch (error) {
        console.error('[Settings] Failed to load from Supabase:', error);
        return null;
    }
}

/**
 * Save all settings to Supabase
 * Also saves to localStorage as backup
 */
export async function saveSettingsToSupabase(settings: AllSettings): Promise<boolean> {
    const supabase = getSupabaseClient();

    // Always save to localStorage as backup
    saveSettingsToLocalStorage(settings);

    if (!supabase) {
        console.log('[Settings] Supabase not configured, saved to localStorage only');
        return false;
    }

    try {
        // Use type assertion since outlet_settings has custom columns not in generated types
        const { error } = await (supabase
            .from('outlet_settings') as any)
            .upsert({
                outlet_id: DEFAULT_OUTLET_ID,
                outlet_name: settings.outlet.name,
                outlet_address: settings.outlet.address,
                outlet_phone: settings.outlet.phone,
                outlet_email: settings.outlet.email,
                outlet_logo_url: settings.outlet.logoUrl,
                currency: settings.outlet.currency,
                timezone: settings.outlet.timezone,
                tax_rate: settings.outlet.taxRate,
                mileage_rate: settings.outlet.mileageRate,
                operating_hours: settings.operatingHours,
                receipt_settings: settings.receipt,
                notification_settings: settings.notification,
                social_media: settings.socialMedia,
                payment_methods: settings.paymentMethods,
                appearance: settings.appearance,
                security: settings.security,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'outlet_id',
            });

        if (error) {
            console.error('[Settings] Error saving to Supabase:', error);
            return false;
        }

        console.log('[Settings] Saved settings to Supabase successfully');
        return true;
    } catch (error) {
        console.error('[Settings] Failed to save to Supabase:', error);
        return false;
    }
}

/**
 * Save settings to localStorage (backup)
 */
function saveSettingsToLocalStorage(settings: AllSettings): void {
    try {
        localStorage.setItem('abangbob_outlet_settings', JSON.stringify(settings.outlet));
        localStorage.setItem('abangbob_operating_hours', JSON.stringify(settings.operatingHours));
        localStorage.setItem('abangbob_receipt_settings', JSON.stringify(settings.receipt));
        localStorage.setItem('abangbob_notification_settings', JSON.stringify(settings.notification));
        localStorage.setItem('abangbob_social_media', JSON.stringify(settings.socialMedia));
        localStorage.setItem('abangbob_payment_settings', JSON.stringify(settings.paymentMethods));
        localStorage.setItem('abangbob_appearance_settings', JSON.stringify(settings.appearance));
        localStorage.setItem('abangbob_security_settings', JSON.stringify(settings.security));
        console.log('[Settings] Saved to localStorage as backup');
    } catch (error) {
        console.error('[Settings] Failed to save to localStorage:', error);
    }
}

/**
 * Load settings from localStorage (fallback)
 */
export function loadSettingsFromLocalStorage(): AllSettings {
    const getFromStorage = <T>(key: string, defaultValue: T): T => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    };

    return {
        outlet: getFromStorage('abangbob_outlet_settings', {
            name: 'AbangBob',
            address: '',
            phone: '',
            email: '',
            logoUrl: '',
            currency: 'BND',
            timezone: 'Asia/Brunei',
            taxRate: 0,
            mileageRate: 0.60,
        }),
        operatingHours: getFromStorage('abangbob_operating_hours', {}),
        receipt: getFromStorage('abangbob_receipt_settings', {
            headerText: '',
            footerText: 'Terima kasih!',
            showLogo: true,
            autoPrint: false,
            printKitchenSlip: true,
        }),
        notification: getFromStorage('abangbob_notification_settings', {
            lowStock: true,
            orderReminder: true,
            equipmentReminder: true,
        }),
        socialMedia: getFromStorage('abangbob_social_media', {
            instagram: '@abangbob.bn',
            facebook: '',
            tiktok: '',
            whatsapp: '',
        }),
        paymentMethods: getFromStorage('abangbob_payment_settings', {
            cash: true,
            card: true,
            qr: true,
            ewallet: false,
        }),
        appearance: getFromStorage('abangbob_appearance_settings', {
            sidebarCollapsed: false,
        }),
        security: getFromStorage('abangbob_security_settings', {
            requirePIN: true,
            autoLogout: false,
            autoLogoutMinutes: 30,
        }),
    };
}
