import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Verify session and admin role
        const session = await auth.api.getSession({
            headers: request.headers
        });

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
