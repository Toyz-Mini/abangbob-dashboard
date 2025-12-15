/**
 * Payment Methods & Tax Rates Supabase Sync
 * Handles CRUD operations for payment methods and tax rates
 */

import { getSupabaseClient } from './client';
import { PaymentMethodConfig, TaxRate } from '../types';

// ============================================
// Payment Methods Functions
// ============================================

export async function getAllPaymentMethods(): Promise<{ success: boolean; data?: PaymentMethodConfig[]; error?: string }> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return { success: false, error: 'Supabase not configured' };
        }

        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('[Supabase] Error fetching payment methods:', error);
            return { success: false, error: error.message };
        }

        // Transform snake_case to camelCase
        const transformed: PaymentMethodConfig[] = (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            color: item.color,
            isEnabled: item.is_enabled,
            sortOrder: item.sort_order,
            isSystem: false, // All DB entries are non-system by default
            createdAt: item.created_at,
        }));

        return { success: true, data: transformed };
    } catch (error) {
        console.error('[Supabase] Exception fetching payment methods:', error);
        return { success: false, error: String(error) };
    }
}

export async function addPaymentMethod(method: PaymentMethodConfig): Promise<{ success: boolean; data?: PaymentMethodConfig; error?: string }> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return { success: false, error: 'Supabase not configured' };
        }

        const { data, error } = await (supabase
            .from('payment_methods') as any)
            .insert({
                id: method.id,
                name: method.name,
                code: method.code,
                color: method.color,
                is_enabled: method.isEnabled,
                sort_order: method.sortOrder,
            })
            .select()
            .single();

        if (error) {
            console.error('[Supabase] Error adding payment method:', error);
            return { success: false, error: error.message };
        }

        // Transform back to client format
        const transformed: PaymentMethodConfig = {
            id: data.id,
            name: data.name,
            code: data.code,
            color: data.color,
            isEnabled: data.is_enabled,
            sortOrder: data.sort_order,
            isSystem: false,
            createdAt: data.created_at,
        };

        return { success: true, data: transformed };
    } catch (error) {
        console.error('[Supabase] Exception adding payment method:', error);
        return { success: false, error: String(error) };
    }
}

export async function updatePaymentMethod(id: string, updates: Partial<PaymentMethodConfig>): Promise<{ success: boolean; data?: PaymentMethodConfig; error?: string }> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return { success: false, error: 'Supabase not configured' };
        }

        // Transform camelCase to snake_case for Supabase
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.code !== undefined) dbUpdates.code = updates.code;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.isEnabled !== undefined) dbUpdates.is_enabled = updates.isEnabled;
        if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

        const { data, error } = await (supabase
            .from('payment_methods') as any)
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Supabase] Error updating payment method:', error);
            return { success: false, error: error.message };
        }

        // Transform back to client format
        const transformed: PaymentMethodConfig = {
            id: data.id,
            name: data.name,
            code: data.code,
            color: data.color,
            isEnabled: data.is_enabled,
            sortOrder: data.sort_order,
            isSystem: false,
            createdAt: data.created_at,
        };

        return { success: true, data: transformed };
    } catch (error) {
        console.error('[Supabase] Exception updating payment method:', error);
        return { success: false, error: String(error) };
    }
}

export async function deletePaymentMethod(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return { success: false, error: 'Supabase not configured' };
        }

        const { error } = await (supabase
            .from('payment_methods') as any)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[Supabase] Error deleting payment method:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('[Supabase] Exception deleting payment method:', error);
        return { success: false, error: String(error) };
    }
}

// ============================================
// Tax Rates Functions
// ============================================

export async function getAllTaxRates(): Promise<{ success: boolean; data?: TaxRate[]; error?: string }> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return { success: false, error: 'Supabase not configured' };
        }

        const { data, error } = await (supabase
            .from('tax_rates') as any)
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('[Supabase] Error fetching tax rates:', error);
            return { success: false, error: error.message };
        }

        // Transform snake_case to camelCase
        const transformed: TaxRate[] = (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            rate: Number(item.rate),
            description: item.description || '',
            isDefault: item.is_default,
            isActive: item.is_active,
            createdAt: item.created_at,
        }));

        return { success: true, data: transformed };
    } catch (error) {
        console.error('[Supabase] Exception fetching tax rates:', error);
        return { success: false, error: String(error) };
    }
}

export async function addTaxRate(taxRate: TaxRate): Promise<{ success: boolean; data?: TaxRate; error?: string }> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return { success: false, error: 'Supabase not configured' };
        }

        const { data, error } = await (supabase
            .from('tax_rates') as any)
            .insert({
                id: taxRate.id,
                name: taxRate.name,
                rate: taxRate.rate,
                description: taxRate.description || '',
                is_default: taxRate.isDefault,
                is_active: taxRate.isActive,
            })
            .select()
            .single();

        if (error) {
            console.error('[Supabase] Error adding tax rate:', error);
            return { success: false, error: error.message };
        }

        // Transform back to client format
        const transformed: TaxRate = {
            id: data.id,
            name: data.name,
            rate: Number(data.rate),
            description: data.description || '',
            isDefault: data.is_default,
            isActive: data.is_active,
            createdAt: data.created_at,
        };

        return { success: true, data: transformed };
    } catch (error) {
        console.error('[Supabase] Exception adding tax rate:', error);
        return { success: false, error: String(error) };
    }
}

export async function updateTaxRate(id: string, updates: Partial<TaxRate>): Promise<{ success: boolean; data?: TaxRate; error?: string }> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return { success: false, error: 'Supabase not configured' };
        }

        // Transform camelCase to snake_case for Supabase
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.rate !== undefined) dbUpdates.rate = updates.rate;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.isDefault !== undefined) dbUpdates.is_default = updates.isDefault;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { data, error } = await (supabase
            .from('tax_rates') as any)
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Supabase] Error updating tax rate:', error);
            return { success: false, error: error.message };
        }

        // Transform back to client format
        const transformed: TaxRate = {
            id: data.id,
            name: data.name,
            rate: Number(data.rate),
            description: data.description || '',
            isDefault: data.is_default,
            isActive: data.is_active,
            createdAt: data.created_at,
        };

        return { success: true, data: transformed };
    } catch (error) {
        console.error('[Supabase] Exception updating tax rate:', error);
        return { success: false, error: String(error) };
    }
}

export async function deleteTaxRate(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return { success: false, error: 'Supabase not configured' };
        }

        const { error } = await (supabase
            .from('tax_rates') as any)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[Supabase] Error deleting tax rate:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('[Supabase] Exception deleting tax rate:', error);
        return { success: false, error: String(error) };
    }
}
