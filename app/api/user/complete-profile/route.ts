import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
            district,
            kampung,
            address,
            emergencyContact,
            bankName,
            bankAccountNo,
            bankAccountHolder,
            tshirtSize,
            shoeSize
        } = body;

        console.log('[CompleteProfile] UserId:', userId);

        // Combine address fields into one
        const fullAddress = [kampung, district, address].filter(Boolean).join(', ');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Create Supabase client with service role for database operations
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
        );

        // Also create auth client to verify session
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
        );
        const { data: { session } } = await supabaseAuth.auth.getSession();

        if (!session || session.user.id !== userId) {
            console.error('[CompleteProfile] Unauthorized - session mismatch');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check current user status using Supabase client
        const { data: existingUser, error: fetchError } = await supabase
            .from('user')
            .select('status, phone, icNumber, extendedData')
            .eq('id', userId)
            .single();

        if (fetchError || !existingUser) {
            console.error('[CompleteProfile] Fetch error:', fetchError);
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const currentStatus = existingUser.status;
        const currentExtendedData = existingUser.extendedData || {};
        console.log('[CompleteProfile] Current status:', currentStatus);

        // Determine new status
        let newStatus = currentStatus;
        if (currentStatus === 'incomplete_profile' || currentStatus === 'pending_approval') {
            newStatus = 'pending_approval';
        }

        console.log('[CompleteProfile] New status will be:', newStatus);

        // Prepare new extendedData
        const newExtendedData = {
            ...currentExtendedData,
            bankName: bankName || currentExtendedData.bankName,
            bankAccountNo: bankAccountNo || currentExtendedData.bankAccountNo,
            bankAccountHolder: bankAccountHolder || currentExtendedData.bankAccountHolder,
            tshirtSize: tshirtSize || currentExtendedData.tshirtSize,
            shoeSize: shoeSize || currentExtendedData.shoeSize,
            district: district || currentExtendedData.district,
            kampung: kampung || currentExtendedData.kampung,
        };

        // Update user profile using Supabase client
        const { data: updatedUser, error: updateError } = await supabase
            .from('user')
            .update({
                phone: phone || existingUser.phone,
                icNumber: icNumber || existingUser.icNumber,
                dateOfBirth: dateOfBirth || null,
                address: fullAddress || null,
                emergencyContact: emergencyContact || null,
                status: newStatus,
                extendedData: newExtendedData,
                updatedAt: new Date().toISOString(),
            })
            .eq('id', userId)
            .select('id, name, email, status')
            .single();

        if (updateError) {
            console.error('[CompleteProfile] Update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update profile', details: updateError.message },
                { status: 500 }
            );
        }

        console.log('[CompleteProfile] ✅ Profile updated:', updatedUser);

        return NextResponse.json({
            success: true,
            user: updatedUser,
        });
    } catch (error: any) {
        console.error('[CompleteProfile] Error:', error.message || error);
        return NextResponse.json(
            { error: 'Failed to update profile', details: error.message },
            { status: 500 }
        );
    }
}
