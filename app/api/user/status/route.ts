import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
    let userId: string | null = null;
    try {
        const { searchParams } = new URL(request.url);
        userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Verify session
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Security Check: Only allow if own ID or Admin
        if (session.user.id !== userId && (session.user as any).role !== 'Admin') {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch user from database - include emailVerified
        console.log('[API] Fetching status for userId:', userId);
        const { data, error } = await supabase
            .from('user')
            .select('id, status, role, phone, "icNumber", "emailVerified"')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[API] Supabase error fetching user:', error);
        }

        if (error || !data) {
            console.log('[API] User not found or error, defaulting to Staff');
            // If user not found in 'user' table, treat as new/incomplete user
            // DO NOT default to Admin/Approved as that bypasses security
            console.error('Error fetching user status or user not found:', error);
            return NextResponse.json({
                status: 'incomplete_profile',
                role: 'Staff',
                emailVerified: false
            });
        }

        console.log('[API] Found user:', { id: data.id, role: data.role, status: data.status, emailVerified: data.emailVerified });

        const emailVerified = data.emailVerified === true;
        let userStatus = data.status;

        // PRIORITY 1: Check email verification first
        // If email is not verified, block access regardless of other status
        if (!emailVerified) {
            console.log('[API] Email not verified, returning email_not_verified status');
            return NextResponse.json({
                status: 'email_not_verified',
                role: data.role || 'Staff',
                emailVerified: false
            });
        }

        // PRIORITY 2: If status is null (new user) or no phone (incomplete), flag as incomplete
        if (!userStatus && (!data.phone || !(data as any).icNumber)) {
            userStatus = 'incomplete_profile';
        } else if (!userStatus) {
            // If status null but has details, maybe pending?
            userStatus = 'pending_approval';
        }

        const finalRole = data.role || 'Staff';
        console.log('[API] Returning:', { status: userStatus, role: finalRole, emailVerified });

        return NextResponse.json({
            status: userStatus || 'approved',
            role: finalRole,
            emailVerified: true
        });
    } catch (error) {
        console.error('[API] Error fetching user status:', error);
        return NextResponse.json({
            status: 'incomplete_profile',
            role: 'Staff',
            emailVerified: false
        });
    }
}

