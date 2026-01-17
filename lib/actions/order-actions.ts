'use server';

import { getServerSession } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

// ============ ORDERS ============

export async function fetchOrdersAction(limit?: number) {
    // 1. Verify Role
    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager', 'staff']);

    const adminClient = getSupabaseAdmin();

    let query = adminClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (limit) {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching orders:', error);
        throw new Error(error.message);
    }

    return toCamelCase(data || []);
}

export async function insertOrderAction(order: any) {
    // 1. Verify Role
    const { requireRole } = await import('@/lib/supabase/server-auth');
    const { session } = await requireRole(['admin', 'manager', 'staff']);

    console.log('[insertOrderAction] Authenticated user inserting order:', session.user.email);

    const adminClient = getSupabaseAdmin();
    const snakeCasedOrder = toSnakeCase(order);

    const { data, error } = await adminClient
        .from('orders')
        // @ts-ignore
        .insert(snakeCasedOrder as any)
        .select()
        .single();

    if (error) {
        console.error('[insertOrderAction] Error:', error);
        throw new Error(error.message);
    }

    return toCamelCase(data);
}

export async function updateOrderAction(id: string, updates: any) {
    // 1. Verify Role
    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager', 'staff']);

    const adminClient = getSupabaseAdmin();
    const snakeCasedUpdates = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('orders')
        // @ts-ignore
        .update(snakeCasedUpdates as any)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}
