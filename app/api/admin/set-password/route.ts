import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email dan password diperlukan' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password mestilah sekurang-kurangnya 8 aksara' },
                { status: 400 }
            );
        }

        const adminClient = getSupabaseAdmin();

        // Find user by email in auth.users
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
        const authUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!authUser) {
            return NextResponse.json(
                { error: 'User dengan email ini tidak wujud dalam sistem baru' },
                { status: 404 }
            );
        }

        // Update password using Supabase Admin API
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            authUser.id,
            { password }
        );

        if (updateError) {
            console.error('Set password error:', updateError);
            return NextResponse.json(
                { error: 'Ralat berlaku semasa menetapkan password' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password berjaya ditetapkan',
        });
    } catch (error) {
        console.error('Set password error:', error);
        return NextResponse.json(
            { error: 'Ralat berlaku semasa menetapkan password' },
            { status: 500 }
        );
    }
}
