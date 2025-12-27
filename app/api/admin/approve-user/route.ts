import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    console.log('[approve-user] API called');
    try {
        const body = await request.json();
        const { userId, action, reason } = body;
        console.log('[approve-user] Request body:', { userId, action, reason: reason ? '[REDACTED]' : undefined });

        if (!userId || !action) {
            console.log('[approve-user] Missing userId or action');
            return NextResponse.json(
                { error: 'User ID and action are required' },
                { status: 400 }
            );
        }

        // Verify session and admin role
        console.log('[approve-user] Verifying session...');
        const session = await auth.api.getSession({
            headers: request.headers
        });
        console.log('[approve-user] Session:', session ? { userId: session.user?.id, role: (session.user as any)?.role } : 'null');

        if (!session || (session.user as any).role !== 'Admin') {
            console.log('[approve-user] Unauthorized - session:', !!session, 'role:', (session?.user as any)?.role);
            return NextResponse.json(
                { error: 'Unauthorized: Admin access required' },
                { status: 401 }
            );
        }

        if (action === 'approve') {
            console.log('[approve-user] Processing approve action for userId:', userId);
            // First get user data including phone and extendedData
            const userResult = await query(
                `SELECT id, name, email, phone, "icNumber", "extendedData" FROM "user" WHERE id = $1`,
                [userId]
            );
            console.log('[approve-user] User query result:', userResult.rowCount, 'rows');

            if (userResult.rowCount === 0) {
                console.log('[approve-user] User not found');
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            const userData = userResult.rows[0];
            console.log('[approve-user] User data:', { name: userData.name, email: userData.email });
            const extendedData = userData.extendedData || {};

            // Construct bank details from extended data
            const bankDetails = {
                bankName: extendedData.bankName || '',
                accountNumber: extendedData.bankAccountNo || '',
                accountName: extendedData.bankAccountName || '',
            };

            // Update user status to approved
            console.log('[approve-user] Updating user status to approved...');
            await query(
                `UPDATE "user" 
                 SET 
                   status = 'approved',
                   "approvedAt" = NOW(),
                   "updatedAt" = NOW()
                 WHERE id = $1`,
                [userId]
            );
            console.log('[approve-user] User status updated');

            // Create staff record using direct insert to public.staff
            // This ensures it goes to the same table that Supabase reads from
            console.log('[approve-user] Inserting into public.staff...');
            const staffInsertResult = await query(
                `INSERT INTO public.staff (
                    id, name, email, phone, role, status, pin, 
                    hourly_rate, employment_type, join_date, 
                    bank_details,
                    created_at, updated_at
                )
                 VALUES ($1, $2, $3, $4, 'Staff', 'active', '0000', 0, 'part-time', NOW(), $5, NOW(), NOW())
                 ON CONFLICT (id) DO UPDATE SET
                   name = EXCLUDED.name,
                   email = EXCLUDED.email,
                   phone = EXCLUDED.phone,
                   bank_details = EXCLUDED.bank_details,
                   status = 'active',
                   updated_at = NOW()
                 RETURNING id, name, email`,
                [
                    userId,
                    userData.name,
                    userData.email,
                    userData.phone || '',
                    JSON.stringify(bankDetails)
                ]
            );

            console.log('[approve-user] Staff insert result:', staffInsertResult.rows);


            // TODO: Send approval email notification

            return NextResponse.json({
                success: true,
                message: 'User approved successfully',
                user: userData,
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
