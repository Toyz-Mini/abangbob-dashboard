'use server';

import { getServerSession } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

export async function addInventoryItemAction(item: any) {
    console.log('[addInventoryItemAction] Starting...', item.name);

    // 1. Verify Role
    const { requireRole } = await import('@/lib/supabase/server-auth');
    const { session } = await requireRole(['admin', 'manager', 'staff']);

    const user = session.user;
    console.log('[addInventoryItemAction] User verified:', user.email);

    // 2. Insert into Supabase (Bypassing RLS with Admin Client)
    const adminClient = getSupabaseAdmin();
    const snakeCasedItem = toSnakeCase(item);

    const { data, error } = await adminClient
        .from('inventory')
        .insert(snakeCasedItem)
        .select()
        .single();

    if (error) {
        console.error('[addInventoryItemAction] Insert Error:', error);
        throw new Error(`Database Error: ${error.message}`);
    }

    console.log('[addInventoryItemAction] Success:', (data as any)?.id);
    return toCamelCase(data);
}

export async function fetchInventoryAction() {
    console.log('[fetchInventoryAction] Starting...');

    // 1. Verify User Session
    // Any authenticated user requires at least staff role
    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager', 'staff']);

    // 2. Fetch from Supabase (Bypassing RLS with Admin Client)
    const adminClient = getSupabaseAdmin();

    const { data, error } = await adminClient
        .from('inventory')
        .select('*')
        .order('name');

    if (error) {
        console.error('[fetchInventoryAction] Fetch Error:', error);
        throw new Error(`Database Error: ${error.message}`);
    }

    console.log('[fetchInventoryAction] Success, count:', data?.length);
    return toCamelCase(data || []);
}

export async function updateInventoryItemAction(id: string, updates: any) {
    console.log('[updateInventoryItemAction] Starting...', id);

    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager', 'staff']);

    const adminClient = getSupabaseAdmin();
    const snakeCasedUpdates = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('inventory')
        // @ts-ignore
        .update(snakeCasedUpdates as any)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[updateInventoryItemAction] Error:', error);
        throw new Error(`Database Error: ${error.message}`);
    }

    return toCamelCase(data);
}

export async function deleteInventoryItemAction(id: string) {
    console.log('[deleteInventoryItemAction] Starting...', id);

    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager']); // Only Manager/Admin can delete

    const adminClient = getSupabaseAdmin();

    const { error } = await adminClient
        .from('inventory')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[deleteInventoryItemAction] Error:', error);
        throw new Error(`Database Error: ${error.message}`);
    }

    return id;
}
