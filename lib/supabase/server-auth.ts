// Server-side authentication helper
// Use this in Server Actions and API routes to get the current session

import { createServerSupabaseClient } from './server';

export interface ServerSession {
    user: {
        id: string;
        email: string;
        name?: string;
    };
}

/**
 * Get the current user session from Supabase Auth
 * Use this in Server Actions to verify authentication
 * 
 * @returns Session object or null if not authenticated
 */
export async function getServerSession(): Promise<ServerSession | null> {
    try {
        const supabase = await createServerSupabaseClient();

        if (!supabase) {
            console.warn('[ServerAuth] Supabase client not available');
            return null;
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('[ServerAuth] Error getting session:', error.message);
            return null;
        }

        if (!session?.user) {
            return null;
        }

        return {
            user: {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email,
            }
        };
    } catch (error) {
        console.error('[ServerAuth] Unexpected error:', error);
        return null;
    }
}

/**
 * Require authentication - throws if not authenticated
 * Use this at the start of protected Server Actions
 */
export async function requireAuth(): Promise<ServerSession> {
    const session = await getServerSession();

    if (!session) {
        throw new Error('Unauthorized');
    }

    return session;
}

/**
 * Require specific role - throws if not authenticated or authorized
 * Checks against the 'staff' table using the user's email
 */
export async function requireRole(allowedRoles: string[]) {
    const session = await getServerSession();
    if (!session?.user?.email) throw new Error('Unauthorized');

    // We must use admin client to read staff roles as the user might not have permissions to read all staff
    const { getSupabaseAdmin } = await import('./admin');
    const admin = getSupabaseAdmin();

    console.log('[RequireRole] Checking access for:', session.user.email);

    // Check staff table for role
    const { data: staff, error } = await admin
        .from('staff')
        .select('role, extended_data')
        .ilike('email', session.user.email)
        .single();

    if (error || !staff) {
        console.error('[RequireRole] Staff lookup failed:', error?.message);
        console.error('[RequireRole] Searched for email:', session.user.email);
        throw new Error('Unauthorized: Staff profile not found');
    }

    const { role, extended_data } = staff;
    const access_level = (extended_data as any)?.accessLevel;

    // Normalize roles for comparison (DB might be 'Manager', allowed might be 'manager')
    const userRole = (role as unknown as string)?.toLowerCase();
    const userAccess = (access_level as unknown as string)?.toLowerCase();
    const userRoles = [userRole, userAccess].filter(Boolean);

    const hasRole = allowedRoles.some(allowed =>
        userRoles.includes(allowed.toLowerCase())
    );

    if (!hasRole) {
        console.warn(`[RequireRole] Access denied. User roles: ${userRoles.join(', ')}. Required: ${allowedRoles.join(', ')}`);
        throw new Error('Forbidden: Insufficient permissions');
    }

    return { session, staff };
}
