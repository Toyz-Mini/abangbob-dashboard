import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// NOTE: This client bypasses Row Level Security (RLS) entirely.
// ONLY use this in Server Actions or API routes after verifying the user's session.
// NEVER use this on the client-side.

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
    if (adminClient) return adminClient;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('[Supabase Admin] Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
        throw new Error('Server configuration error: Missing Admin Key');
    }

    adminClient = createClient<Database>(
        supabaseUrl,
        supabaseServiceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

    return adminClient;
}
