'use server';

import { auth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

// ============ ATTENDANCE ACTIONS ============

export async function fetchAttendanceAction(startDate?: string, endDate?: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return [];

    const adminClient = getSupabaseAdmin();
    let query = adminClient
        .from('attendance')
        .select('*')
        .order('date', { ascending: false });

    if (startDate) {
        query = query.gte('date', startDate);
    }
    if (endDate) {
        query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching attendance:', error);
        throw new Error(error.message);
    }

    return toCamelCase(data || []);
}

export async function insertAttendanceAction(attendance: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedAttendance = toSnakeCase(attendance);

    const { data, error } = await adminClient
        .from('attendance')
        // @ts-ignore
        .insert(snakeCasedAttendance)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function updateAttendanceAction(id: string, updates: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedUpdates = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('attendance')
        // @ts-ignore
        .update(snakeCasedUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

// ============ ALLOWED LOCATIONS ACTIONS ============

export async function getAllowedLocationsAction() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return { success: false, error: 'Unauthorized', data: null };

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
        .from('allowed_locations')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching allowed locations:', error);
        return { success: false, error: error.message, data: null };
    }

    return { success: true, data: toCamelCase(data || []), error: null };
}

export async function addAllowedLocationAction(location: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return { success: false, error: 'Unauthorized', data: null };

    const adminClient = getSupabaseAdmin();
    const snakeCasedLocation = toSnakeCase(location);

    const { data, error } = await adminClient
        .from('allowed_locations')
        // @ts-ignore
        .insert(snakeCasedLocation)
        .select()
        .single();

    if (error) {
        console.error('Error adding location:', error);
        return { success: false, error: error.message, data: null };
    }

    return { success: true, data: toCamelCase(data), error: null };
}

export async function updateAllowedLocationAction(id: string, updates: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return { success: false, error: 'Unauthorized', data: null };

    const adminClient = getSupabaseAdmin();
    const snakeCasedUpdates = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('allowed_locations')
        // @ts-ignore
        .update(snakeCasedUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating location:', error);
        return { success: false, error: error.message, data: null };
    }

    return { success: true, data: toCamelCase(data), error: null };
}

export async function deleteAllowedLocationAction(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return { success: false, error: 'Unauthorized' };

    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient
        .from('allowed_locations')
        // @ts-ignore
        .update({ is_active: false })
        .eq('id', id);

    if (error) {
        console.error('Error deleting location:', error);
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}
