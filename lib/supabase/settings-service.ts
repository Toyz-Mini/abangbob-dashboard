'use client';

/**
 * Centralized Settings Sync Service
 * Handles syncing application settings between localStorage (cache) and Supabase (persistence)
 */

import { getSupabaseClient } from './client';

// Setting keys
export const SETTING_KEYS = {
    DELIVERY_PLATFORMS: 'delivery_platforms',
    PRINTER_SETTINGS: 'printer_settings',
    RECEIPT_SETTINGS: 'receipt_settings',
    PAYSLIP_BRANDING: 'payslip_branding',
    OUTLET_SETTINGS: 'outlet_settings',
    USER_PREFERENCES: 'user_preferences',
    MULTI_OUTLET: 'multi_outlet',
    CURRENT_OUTLET: 'current_outlet',
} as const;

export type SettingKey = typeof SETTING_KEYS[keyof typeof SETTING_KEYS];

interface SettingRecord {
    id?: string;
    user_id: string;
    setting_key: string;
    setting_value: any;
    created_at?: string;
    updated_at?: string;
}

/**
 * Load a setting from Supabase with localStorage fallback
 */
export async function loadSetting<T>(
    key: SettingKey,
    userId: string = 'global',
    defaultValue: T
): Promise<T> {
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            const { data, error } = await supabase
                .from('settings')
                .select('setting_value')
                .eq('setting_key', key)
                .eq('user_id', userId)
                .single();

            if (data && !error) {
                // Cache to localStorage
                localStorage.setItem(`setting_${key}`, JSON.stringify(data.setting_value));
                return data.setting_value as T;
            }
        }
    } catch (err) {
        console.error(`[SettingsSync] Failed to load ${key}:`, err);
    }

    // Fallback to localStorage
    const cached = localStorage.getItem(`setting_${key}`);
    if (cached) {
        try {
            return JSON.parse(cached) as T;
        } catch {
            return defaultValue;
        }
    }

    return defaultValue;
}

/**
 * Save a setting to Supabase and localStorage
 */
export async function saveSetting<T>(
    key: SettingKey,
    value: T,
    userId: string = 'global'
): Promise<boolean> {
    // Always save to localStorage first (immediate cache)
    localStorage.setItem(`setting_${key}`, JSON.stringify(value));

    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    user_id: userId,
                    setting_key: key,
                    setting_value: value,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,setting_key'
                });

            if (error) {
                console.error(`[SettingsSync] Failed to save ${key}:`, error);
                return false;
            }

            console.log(`[SettingsSync] ✅ Saved ${key} to Supabase`);
            return true;
        }
    } catch (err) {
        console.error(`[SettingsSync] Error saving ${key}:`, err);
    }

    return false;
}

/**
 * Delete a setting
 */
export async function deleteSetting(
    key: SettingKey,
    userId: string = 'global'
): Promise<boolean> {
    localStorage.removeItem(`setting_${key}`);

    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            const { error } = await supabase
                .from('settings')
                .delete()
                .eq('setting_key', key)
                .eq('user_id', userId);

            if (error) {
                console.error(`[SettingsSync] Failed to delete ${key}:`, error);
                return false;
            }
            return true;
        }
    } catch (err) {
        console.error(`[SettingsSync] Error deleting ${key}:`, err);
    }

    return false;
}

/**
 * Load all settings for a user
 */
export async function loadAllSettings(userId: string = 'global'): Promise<Map<string, any>> {
    const settings = new Map<string, any>();

    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            const { data, error } = await supabase
                .from('settings')
                .select('setting_key, setting_value')
                .eq('user_id', userId);

            if (data && !error) {
                data.forEach(row => {
                    settings.set(row.setting_key, row.setting_value);
                    localStorage.setItem(`setting_${row.setting_key}`, JSON.stringify(row.setting_value));
                });
            }
        }
    } catch (err) {
        console.error('[SettingsSync] Failed to load all settings:', err);
    }

    return settings;
}

/**
 * React hook for using a synced setting
 */
import { useState, useEffect, useCallback } from 'react';

export function useSyncedSetting<T>(
    key: SettingKey,
    defaultValue: T,
    userId: string = 'global'
): [T, (value: T) => Promise<void>, boolean] {
    const [value, setValue] = useState<T>(defaultValue);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            const loaded = await loadSetting(key, userId, defaultValue);
            if (mounted) {
                setValue(loaded);
                setLoading(false);
            }
        };

        load();

        return () => { mounted = false; };
    }, [key, userId, defaultValue]);

    const updateValue = useCallback(async (newValue: T) => {
        setValue(newValue);
        await saveSetting(key, newValue, userId);
    }, [key, userId]);

    return [value, updateValue, loading];
}
