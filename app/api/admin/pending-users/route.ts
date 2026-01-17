import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Verify session and admin role
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
        );
        const { data: { session } } = await supabaseAuth.auth.getSession();


        if (!session || (session.user as any).role !== 'Admin') {
            return NextResponse.json(
                { error: 'Unauthorized: Admin access required' },
                { status: 401 }
            );
        }
        const result = await query(
            `SELECT 
        id, name, email, phone, "icNumber", "dateOfBirth", 
        address, "emergencyContact", status, "createdAt"
       FROM "user" 
       WHERE status IN ('pending_approval', 'profile_incomplete')
       AND role != 'Admin'
       ORDER BY "createdAt" DESC`
        );

        return NextResponse.json({
            users: result.rows,
        });
    } catch (error) {
        console.error('Error fetching pending users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pending users' },
            { status: 500 }
        );
    }
}
