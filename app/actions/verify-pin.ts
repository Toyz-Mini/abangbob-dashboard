'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function verifyPin(pin: string) {
    try {
        const supabase = await createServerSupabaseClient();
        if (!supabase) return { success: false, error: 'Database connection failed' };

        // 1. Check if PIN matches any active staff member
        // Using a direct query to find the user with this PIN
        // Note: In a real secure env, PINs should be hashed. 
        // Assuming for now they might be plain text based on older context, 
        // OR we check against a hashed version if the schema supports it.
        // Given the lack of schema info, we'll try a simple match first.

        const { data, error } = await supabase
            .from('staff')
            .select('id, name, role')
            .eq('pin', pin)
            .eq('status', 'active')
            .single();

        if (error || !data) {
            return { success: false, error: 'Invalid PIN' };
        }

        const staffData = data as any;

        return {
            success: true,
            role: staffData.role,
            name: staffData.name
        };

    } catch (error) {
        console.error('PIN Verification Error:', error);
        return { success: false, error: 'Verification failed' };
    }
}
