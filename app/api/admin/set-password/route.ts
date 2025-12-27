import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth/server';


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

        // Check if user exists
        const userResult = await query(
            `SELECT id FROM "user" WHERE email = $1`,
            [email]
        );

        if (userResult.rowCount === 0) {
            return NextResponse.json(
                { error: 'User dengan email ini tidak wujud' },
                { status: 404 }
            );
        }

        const userId = userResult.rows[0].id;

        // Update password using Better Auth's internal adapter
        // This ensures the hash is in the correct format (bcrypt)
        await (auth as any).internalAdapter.updatePassword({
            userId: userId,
            newPassword: password
        });

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
