'use server';

import { auth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

// ============ INVENTORY LOGS ACTIONS ============

export async function fetchInventoryLogsAction(stockItemId?: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return [];

    const adminClient = getSupabaseAdmin();
    let query = adminClient
        .from('inventory_logs')
        .select(`
            *,
            stock_item:inventory(name, sku),
            staff:staff(name)
        `)
        .order('created_at', { ascending: false });

    if (stockItemId) {
        query = query.eq('stock_item_id', stockItemId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching inventory logs:', error);
        throw new Error(error.message);
    }

    return toCamelCase(data || []);
}

export async function insertInventoryLogAction(log: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedLog = toSnakeCase(log);

    const { data, error } = await adminClient
        .from('inventory_logs')
        // @ts-ignore
        .insert(snakeCasedLog)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}
