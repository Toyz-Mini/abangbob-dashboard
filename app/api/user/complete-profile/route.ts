import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            userId,
            phone,
            icNumber,
            dateOfBirth,
            address,
            emergencyContact,
        } = body;

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

        if (!session || session.user.id !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user is already approved/active
        const existingUser = await query(
            'SELECT status FROM "user" WHERE id = $1',
            [userId]
        );

        if (existingUser.rows.length > 0) {
            const status = existingUser.rows[0].status;
            if (status === 'active' || status === 'approved') {
                return NextResponse.json(
                    { error: 'Profile already completed and approved' },
                    { status: 403 }
                );
            }
        }

        // Update user profile
        const result = await query(
            `UPDATE "user" 
       SET 
         phone = $1,
         "icNumber" = $2,
         "dateOfBirth" = $3,
         address = $4,
         "emergencyContact" = $5,
         status = 'pending_approval',
         "updatedAt" = NOW()
       WHERE id = $6
       RETURNING id, name, email, status`,
            [
                phone,
                icNumber,
                dateOfBirth || null,
                address,
                JSON.stringify(emergencyContact),
                userId,
            ]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user: result.rows[0],
        });
    } catch (error) {
        console.error('Profile completion error:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
