'use server';

import { auth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

// ============ SUPPLIERS ACTIONS ============

export async function fetchSuppliersAction() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return [];

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
        .from('suppliers')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching suppliers:', error);
        throw new Error(error.message);
    }

    return toCamelCase(data || []);
}

export async function insertSupplierAction(supplier: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedSupplier = toSnakeCase(supplier);

    const { data, error } = await adminClient
        .from('suppliers')
        // @ts-ignore
        .insert(snakeCasedSupplier)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function updateSupplierAction(id: string, updates: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedUpdates = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('suppliers')
        // @ts-ignore
        .update(snakeCasedUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function deleteSupplierAction(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient
        .from('suppliers')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}

// ============ PURCHASE ORDERS ACTIONS ============

export async function fetchPurchaseOrdersAction() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return [];

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
        .from('purchase_orders')
        .select('*, items:purchase_order_items(*)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching purchase orders:', error);
        throw new Error(error.message);
    }

    return toCamelCase(data || []);
}

export async function insertPurchaseOrderAction(po: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedPO = toSnakeCase(po);

    const { data, error } = await adminClient
        .from('purchase_orders')
        // @ts-ignore
        .insert(snakeCasedPO)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function updatePurchaseOrderAction(id: string, updates: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedUpdates = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('purchase_orders')
        // @ts-ignore
        .update(snakeCasedUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}
