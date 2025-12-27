import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, action, reason } = body;

        if (!userId || !action) {
            return NextResponse.json(
                { error: 'User ID and action are required' },
                { status: 400 }
            );
        }

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

        if (action === 'approve') {
            // Update user status to approved
            const result = await query(
                `UPDATE "user" 
         SET 
           status = 'approved',
           "approvedAt" = NOW(),
           "updatedAt" = NOW()
         WHERE id = $1
         RETURNING id, name, email, status`,
                [userId]
            );

            if (result.rowCount === 0) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            // Create staff record
            const staffData = {
                id: userId,
                name: result.rows[0].name,
                email: result.rows[0].email,
                role: 'Staff',
                status: 'active',
                phone: '', // Phone might not be in user table or different field?
                // Default values needed for staff table constraints
                pin: '000000',
                hourly_rate: 0,
                employment_type: 'part-time',
                join_date: new Date().toISOString().split('T')[0]
            };

            // Fetch phone from user table if available (it was selected in previous query? No, only id,name,email,status)
            // Let's perform a direct insert using parameters from body if available or just update the previous query to return phone

            // Re-query user to get phone if needed? Or update previous query.
            // Actually, let's update previous query to return phone.

            await query(
                `INSERT INTO staff (id, name, email, role, status, pin, hourly_rate, employment_type, join_date)
                 VALUES ($1, $2, $3, 'Staff', 'active', '000000', 0, 'part-time', NOW())
                 ON CONFLICT (id) DO NOTHING`,
                [userId, result.rows[0].name, result.rows[0].email]
            );

            // TODO: Send approval email notification

            return NextResponse.json({
                success: true,
                message: 'User approved successfully',
                user: result.rows[0],
            });
        } else if (action === 'reject') {
            // Update user status to rejected
            const result = await query(
                `UPDATE "user" 
         SET 
           status = 'rejected',
           "rejectionReason" = $1,
           "updatedAt" = NOW()
         WHERE id = $2
         RETURNING id, name, email, status`,
                [reason || null, userId]
            );

            if (result.rowCount === 0) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            // TODO: Send rejection email notification

            return NextResponse.json({
                success: true,
                message: 'User rejected',
                user: result.rows[0],
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('User approval error:', error);
        return NextResponse.json(
            { error: 'Failed to process approval' },
            { status: 500 }
        );
    }
}
