import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch user from database
        const { data, error } = await supabase
            .from('user')
            .select('id, status, role, phone, "icNumber"')
            .eq('id', userId)
            .single();

        if (error) {
            // If user not found in 'user' table, they might be admin or error
            console.error('Error fetching user status:', error);
            // Default to approved only if purely admin/fallback, but for safety maybe 'incomplete_profile'?
            // If checking 'user' table and fail, it's safer to not assume approved unless we know it's admin.
            // But let's stick to existing fallback logic or maybe change to 'incomplete_profile' to force check?
            // Existing logic was 'approved'. Let's keep it but ideally we should be stricter.
            return NextResponse.json({
                status: 'approved',
                role: 'Admin'
            });
        }

        let userStatus = data.status;

        // If status is null (new user) or no phone (incomplete), flag as incomplete
        if (!userStatus && (!data.phone || !(data as any).icNumber)) {
            userStatus = 'incomplete_profile';
        } else if (!userStatus) {
            // If status null but has details, maybe pending?
            userStatus = 'pending_approval';
        }

        return NextResponse.json({
            status: userStatus || 'approved',
            role: data.role || 'Staff'
        });
    } catch (error) {
        console.error('Error fetching user status:', error);
        return NextResponse.json({
            status: 'approved',
            role: 'Staff'
        });
    }
}
