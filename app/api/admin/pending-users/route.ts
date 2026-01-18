import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Create Supabase clients
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
        );

        // Use service role for database queries
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
        );

        const { data: { session } } = await supabaseAuth.auth.getSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized: Not logged in' },
                { status: 401 }
            );
        }

        // Fetch user role from database (not JWT)
        const { data: currentUser, error: userError } = await supabase
            .from('user')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (userError || !currentUser) {
            console.error('Error fetching user role:', userError);
            return NextResponse.json(
                { error: 'Unauthorized: User not found' },
                { status: 401 }
            );
        }

        // Check if user is Admin or Manager
        if (!['Admin', 'Manager'].includes(currentUser.role)) {
            return NextResponse.json(
                { error: 'Unauthorized: Admin/Manager access required' },
                { status: 401 }
            );
        }

        // Fetch pending users using Supabase client
        const { data: users, error: fetchError } = await supabase
            .from('user')
            .select('id, name, email, phone, icNumber, dateOfBirth, address, emergencyContact, status, createdAt')
            .in('status', ['pending_approval', 'profile_incomplete', 'incomplete_profile'])
            .neq('role', 'Admin')
            .order('createdAt', { ascending: false });

        if (fetchError) {
            console.error('Error fetching pending users:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch pending users' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            users: users || [],
        });
    } catch (error) {
        console.error('Error fetching pending users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pending users' },
            { status: 500 }
        );
    }
}
