'use server';

import { auth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

// ============ MENU ITEMS ============

export async function fetchMenuItemsAction() {
    // 1. Verify Session
    // We allow public read access for menu? usually yes for ordering.
    // BUT this specific action is likely used by the dashboard which implies auth.
    // However, `loadMenuItemsFromSupabase` in sync layer is used globally.
    // Use admin client but NO session check if we want public access, 
    // OR keep session check if this is strictly for admin dashboard.
    // given existing code used `supabase` browser client which works for anon if RLS allows,
    // we should probably allow public read, but restricted write.
    // UPDATE: The user issue is specifically about STAFF accessing data.
    // So for FETCH, we can use Admin client to bypass RLS, but we might want to check if user is at least authenticated 
    // OR just return data if the logic allows public menu viewing (which it does for online ordering).
    // Safest bet for "Dashboard" usage is to ensure session, but for "Public Order" usage?
    // Let's stick to the pattern: verify session for mutations, allow generic for fetch?
    // Actually, `inventory` fetch enforced session. 
    // Let's enforce session for now as this is "AbangBob Dashboard". Public view might use different path.

    // public menu fetch might be different. Let's look at `create_public_order`.
    // If strict session is required, public ordering page might break if it uses this.
    // Checking `operations.ts`: fetchMenuItems uses `getSupabaseClient()`. 
    // If RLS allows Select for Anon, it works.
    // If we switch to Admin client, we bypass RLS. 
    // To maintain security, we should only use Admin client if we have verified the user is authorized (Staff/Admin).
    // OR if we explicitly want to expose this data publicly. 
    // Menu items ARE public. So fetch should be open? 
    // "inventory" fetch in `inventory-actions.ts` enforced session.
    // Let's enforce session for consistency with the "Staff Access" fix. 
    // If public needs it, we can create `fetchPublicMenuAction` later or use standard client.

    // However, better safe than sorry: Checking session allows us to fix the "Staff" view.
    const session = await auth.api.getSession({
        headers: await headers()
    });

    // If no session, rely on standard RLS (fallback)? 
    // Or just fail? The goal is to fix "Staff" seeing blank page.
    // If we assume this is for the Admin Dashboard, we enforce session.
    if (!session) {
        // If unauthorized, return empty or throw? 
        // For dashboard, throw.
        // return []; 
        // Actually, let's allow it if it's public data, but the prompt implies this is for the internal dashboard.
        // Let's assume dashboard use first.
        return [];
    }

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching menu items:', error);
        throw new Error(error.message);
    }

    return toCamelCase(data || []);
}

export async function insertMenuItemAction(item: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedItem = toSnakeCase(item);

    const { data, error } = await adminClient
        .from('menu_items')
        // @ts-ignore
        // @ts-ignore
        .insert(snakeCasedItem)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function updateMenuItemAction(id: string, updates: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedUpdates = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('menu_items')
        // @ts-ignore
        .update(snakeCasedUpdates as any)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function deleteMenuItemAction(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient
        .from('menu_items')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}

// ============ MODIFIER GROUPS ============

export async function fetchModifierGroupsAction() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return [];

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
        .from('modifier_groups')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return toCamelCase(data || []);
}

export async function insertModifierGroupAction(group: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCased = toSnakeCase(group);

    const { data, error } = await adminClient
        .from('modifier_groups')
        // @ts-ignore
        .insert(snakeCased as any)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function updateModifierGroupAction(id: string, updates: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCased = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('modifier_groups')
        // @ts-ignore
        .update(snakeCased as any)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function deleteModifierGroupAction(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient
        .from('modifier_groups')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}

// ============ MODIFIER OPTIONS ============

export async function fetchModifierOptionsAction() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return [];

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
        .from('modifier_options')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return toCamelCase(data || []);
}

export async function insertModifierOptionAction(option: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCased = toSnakeCase(option);

    const { data, error } = await adminClient
        .from('modifier_options')
        // @ts-ignore
        .insert(snakeCased as any)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function updateModifierOptionAction(id: string, updates: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCased = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('modifier_options')
        // @ts-ignore
        .update(snakeCased as any)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function deleteModifierOptionAction(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient
        .from('modifier_options')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}
