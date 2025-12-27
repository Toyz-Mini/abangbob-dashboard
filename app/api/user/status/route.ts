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
            .select('id, status, role')
            .eq('id', userId)
            .single();

        if (error) {
            // If user not found in 'user' table, they might be admin
            // Check better_auth tables or default to approved
            console.error('Error fetching user status:', error);
            return NextResponse.json({
                status: 'approved',
                role: 'Admin'
            });
        }

        return NextResponse.json({
            status: data.status || 'approved',
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
