'use server';

import { auth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

export async function addInventoryItemAction(item: any) {
    console.log('[addInventoryItemAction] Starting...', item.name);

    // 1. Verify User Session
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        throw new Error('Unauthorized');
    }

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
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        throw new Error('Unauthorized');
    }

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
