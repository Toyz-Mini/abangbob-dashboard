import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

        // Fetch current user role from database
        const { data: currentUser, error: userError } = await supabase
            .from('user')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (userError || !currentUser || !['Admin', 'Manager'].includes(currentUser.role)) {
            console.log('[approve-user] Unauthorized - role:', currentUser?.role);
            return NextResponse.json(
                { error: 'Unauthorized: Admin/Manager access required' },
                { status: 401 }
            );
        }

        if (action === 'approve') {
            console.log('[approve-user] Processing approve action for userId:', userId);

            // Fetch user data using Supabase client
            const { data: userData, error: fetchError } = await supabase
                .from('user')
                .select('id, name, email, phone, icNumber, extendedData')
                .eq('id', userId)
                .single();

            if (fetchError || !userData) {
                console.log('[approve-user] User not found');
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            console.log('[approve-user] User data:', { name: userData.name, email: userData.email });
            const extendedData = userData.extendedData || {};

            // Construct bank details from extended data
            const bankDetails = {
                bankName: extendedData.bankName || '',
                accountNumber: extendedData.bankAccountNo || '',
                accountName: extendedData.bankAccountHolder || '',
            };

            // Update user status to approved
            console.log('[approve-user] Updating user status to approved...');
            const { error: updateError } = await supabase
                .from('user')
                .update({
                    status: 'approved',
                    approvedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                })
                .eq('id', userId);

            if (updateError) {
                console.error('[approve-user] Update error:', updateError);
                throw updateError;
            }

            // Check if staff already exists with this email (different ID)
            console.log('[approve-user] Checking for existing staff with email...');
            const { data: existingStaff } = await supabase
                .from('staff')
                .select('id')
                .eq('email', userData.email)
                .single();

            if (existingStaff && existingStaff.id !== userId) {
                // Update the existing staff record to use the new user ID
                console.log('[approve-user] Found existing staff, deleting old record...');
                await supabase.from('staff').delete().eq('id', existingStaff.id);
            }

            // Create/update staff record using Supabase client
            console.log('[approve-user] Upserting staff record...');
            const { error: staffError } = await supabase
                .from('staff')
                .upsert({
                    id: userId,
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone || '',
                    role: 'Staff',
                    status: 'active',
                    pin: '0000',
                    hourly_rate: 0,
                    employment_type: 'part-time',
                    join_date: new Date().toISOString().split('T')[0],
                    bank_details: bankDetails,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (staffError) {
                console.error('[approve-user] Staff upsert error:', staffError);
                // Don't throw - user is already approved, staff record is secondary
            }

            console.log('[approve-user] ✅ User approved successfully');

            return NextResponse.json({
                success: true,
                message: 'User approved successfully',
                user: userData,
            });
        } else if (action === 'reject') {
            // Update user status to rejected
            const { data: updatedUser, error: updateError } = await supabase
                .from('user')
                .update({
                    status: 'rejected',
                    rejectionReason: reason || null,
                    updatedAt: new Date().toISOString(),
                })
                .eq('id', userId)
                .select('id, name, email, status')
                .single();

            if (updateError || !updatedUser) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'User rejected',
                user: updatedUser,
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('User approval error:', error);
        return NextResponse.json(
            { error: 'Failed to process approval', details: error.message },
            { status: 500 }
        );
    }
}
