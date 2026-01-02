'use server';

import { auth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

// ============ ORDERS ============

export async function fetchOrdersAction(limit?: number) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

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
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

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
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

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
