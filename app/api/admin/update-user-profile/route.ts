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
            bloodType,
            allergies,
            medicalConditions,
            bankName,
            bankAccountNo,
            bankAccountName,
            uniformSize,
            shoeSize,
        } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
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

        // Check if required fields are complete to determine new status
        const isProfileComplete = phone && icNumber;
        const newStatus = isProfileComplete ? 'pending_approval' : 'profile_incomplete';

        // Build extended data JSON
        const extendedData = JSON.stringify({
            bloodType: bloodType || null,
            allergies: allergies || null,
            medicalConditions: medicalConditions || null,
            bankName: bankName || null,
            bankAccountNo: bankAccountNo || null,
            bankAccountName: bankAccountName || null,
            uniformSize: uniformSize || null,
            shoeSize: shoeSize || null,
        });

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
               "extendedData" = COALESCE($7::jsonb, "extendedData"),
               "updatedAt" = NOW()
             WHERE id = $8
             RETURNING id, name, email, phone, "icNumber", "dateOfBirth", address, "emergencyContact", status, "extendedData"`,
            [
                phone || null,
                icNumber || null,
                dateOfBirth || null,
                address || null,
                emergencyContact ? JSON.stringify(emergencyContact) : null,
                newStatus,
                extendedData,
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
            message: isProfileComplete
                ? 'Profile lengkap! Sedia untuk diluluskan.'
                : 'Profile dikemaskini. Sila lengkapkan phone dan IC untuk approve.',
            user: result.rows[0],
            isComplete: isProfileComplete,
        });
    } catch (error) {
        console.error('Admin profile update error:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
