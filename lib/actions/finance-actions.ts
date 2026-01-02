'use server';

import { auth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

// ============ EXPENSES ============

export async function fetchExpensesAction() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching expenses:', error);
        throw new Error(error.message);
    }

    return toCamelCase(data || []);
}

export async function insertExpenseAction(expense: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCased = toSnakeCase(expense);

    const { data, error } = await adminClient
        .from('expenses')
        // @ts-ignore
        .insert(snakeCased as any)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function updateExpenseAction(id: string, updates: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCased = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('expenses')
        // @ts-ignore
        .update(snakeCased as any)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function deleteExpenseAction(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient
        .from('expenses')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}
