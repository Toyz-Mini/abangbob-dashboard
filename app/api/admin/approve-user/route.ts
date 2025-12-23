import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { auth } from '@/lib/auth';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

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

        if (action === 'approve') {
            // Update user status to approved
            const result = await pool.query(
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

            // TODO: Send approval email notification

            return NextResponse.json({
                success: true,
                message: 'User approved successfully',
                user: result.rows[0],
            });
        } else if (action === 'reject') {
            // Update user status to rejected
            const result = await pool.query(
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
