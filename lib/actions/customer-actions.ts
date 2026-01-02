'use server';

import { auth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

// ============ CUSTOMERS ACTIONS ============

export async function fetchCustomersAction() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return [];

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
        .from('customers')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching customers:', error);
        throw new Error(error.message);
    }

    return toCamelCase(data || []);
}

export async function insertCustomerAction(customer: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    // Customers can potentially be created by public (e.g. self-registration during order)?
    // But this action is likely for staff managing customers. 
    // If public needs it, we use `create_public_order` RPC usually.
    // For now, let's enforce session as this replaces `insertCustomer` which failed for staff.
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedCustomer = toSnakeCase(customer);

    const { data, error } = await adminClient
        .from('customers')
        // @ts-ignore
        .insert(snakeCasedCustomer)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function updateCustomerAction(id: string, updates: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedUpdates = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('customers')
        // @ts-ignore
        .update(snakeCasedUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}
