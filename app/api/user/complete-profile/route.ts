import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    console.log('[CompleteProfile] Received request');

    try {
        const body = await request.json();
        const {
            userId,
            phone,
            icNumber,
            dateOfBirth,
            address,
            emergencyContact,
            // New fields
            bankName,
            bankAccountNo,
            bankAccountHolder,
            tshirtSize,
            shoeSize
        } = body;

        console.log('[CompleteProfile] UserId:', userId);

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
            console.error('[CompleteProfile] Unauthorized - session mismatch');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check current user status and fetch extendedData
        const existingUser = await query(
            'SELECT status, phone, "icNumber", "extendedData" FROM "user" WHERE id = $1',
            [userId]
        );

        if (existingUser.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const currentStatus = existingUser.rows[0].status;
        const currentExtendedData = existingUser.rows[0].extendedData || {}; // Get existing JSONB
        console.log('[CompleteProfile] Current status:', currentStatus);

        // Determine new status:
        // - If user is already approved/active, keep that status (don't revert to pending)
        // - If user is incomplete_profile or pending_approval, set to pending_approval
        let newStatus = currentStatus;
        if (currentStatus === 'incomplete_profile' || currentStatus === 'pending_approval') {
            newStatus = 'pending_approval';
        }
        // If already 'approved' or 'active', keep the current status

        console.log('[CompleteProfile] New status will be:', newStatus);

        // Prepare new extendedData
        const newExtendedData = {
            ...currentExtendedData,
            bankName: bankName || currentExtendedData.bankName,
            bankAccountNo: bankAccountNo || currentExtendedData.bankAccountNo,
            bankAccountHolder: bankAccountHolder || currentExtendedData.bankAccountHolder,
            tshirtSize: tshirtSize || currentExtendedData.tshirtSize,
            shoeSize: shoeSize || currentExtendedData.shoeSize,
        };

        // Update user profile
        const result = await query(
            `UPDATE "user" 
             SET 
               phone = COALESCE($1, phone),
               "icNumber" = COALESCE($2, "icNumber"),
               "dateOfBirth" = COALESCE($3, "dateOfBirth"),
               address = COALESCE($4, address),
               "emergencyContact" = COALESCE($5, "emergencyContact"),
               status = $6,
               "extendedData" = $7,
               "updatedAt" = NOW()
             WHERE id = $8
             RETURNING id, name, email, status`,
            [
                phone || null,
                icNumber || null,
                dateOfBirth || null,
                address || null,
                emergencyContact ? JSON.stringify(emergencyContact) : null,
                newStatus,
                JSON.stringify(newExtendedData), // Create json string for the column
                userId,
            ]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        console.log('[CompleteProfile] ✅ Profile updated:', result.rows[0]);

        return NextResponse.json({
            success: true,
            user: result.rows[0],
        });
    } catch (error: any) {
        console.error('[CompleteProfile] Error:', error.message || error);
        return NextResponse.json(
            { error: 'Failed to update profile', details: error.message },
            { status: 500 }
        );
    }
}


