import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { auth } from '@/lib/auth';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

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

        // Fetch user from database
        const { data, error } = await supabase
            .from('user')
            .select('id, status, role, phone, "icNumber"')
            .eq('id', userId)
            .single();

        if (error || !data) {
            // If user not found in 'user' table, treat as new/incomplete user
            // DO NOT default to Admin/Approved as that bypasses security
            console.error('Error fetching user status or user not found:', error);
            return NextResponse.json({
                status: 'incomplete_profile',
                role: 'Staff'
            });
        }

        let userStatus = data.status;

        // If status is null (new user) or no phone (incomplete), flag as incomplete
        if (!userStatus && (!data.phone || !(data as any).icNumber)) {
            userStatus = 'incomplete_profile';
        } else if (!userStatus) {
            // If status null but has details, maybe pending?
            userStatus = 'pending_approval';
        }

        return NextResponse.json({
            status: userStatus || 'approved',
            role: data.role || 'Staff'
        });
    } catch (error) {
        console.error('Error fetching user status:', error);
        return NextResponse.json({
            status: 'approved',
            role: 'Staff'
        });
    }
}
