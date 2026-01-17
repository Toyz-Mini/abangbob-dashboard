'use server';

import { getServerSession } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

// ============ CASH FLOWS ACTIONS ============

export async function fetchCashFlowsAction(startDate?: string, endDate?: string) {
    const session = await getServerSession();
    if (!session) return [];

    const adminClient = getSupabaseAdmin();
    let query = adminClient
        .from('cash_flows')
        .select(`
            *,
            category:cash_flow_categories(name, type)
        `)
        .order('date', { ascending: false });

    if (startDate) {
        query = query.gte('date', startDate);
    }
    if (endDate) {
        query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching cash flows:', error);
        throw new Error(error.message);
    }

    return toCamelCase(data || []);
}

export async function upsertCashFlowAction(cashFlow: any) {
    const session = await getServerSession();
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedCashFlow = toSnakeCase(cashFlow);

    const { data, error } = await adminClient
        .from('cash_flows')
        // @ts-ignore
        .upsert(snakeCasedCashFlow)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

// ============ CASH REGISTERS ACTIONS ============

export async function fetchCashRegistersAction() {
    const session = await getServerSession();
    if (!session) return [];

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
        .from('cash_registers')
        .select('*')
        .order('opened_at', { ascending: false });

    if (error) {
        console.error('Error fetching cash registers:', error);
        throw new Error(error.message);
    }

    return toCamelCase(data || []);
}
