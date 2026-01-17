import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        // Rate limiting: 5 requests per 15 minutes
        const clientIP = getClientIP(request);
        const rateLimitResult = rateLimit(`reset-password:${clientIP}`, {
            windowMs: 15 * 60 * 1000,
            maxRequests: 5,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: `Terlalu banyak percubaan. Cuba lagi dalam ${rateLimitResult.retryAfter} saat.` },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { token, email, password } = body;

        if (!token || !email || !password) {
            return NextResponse.json(
                { error: 'Token, email, dan password diperlukan' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password mestilah sekurang-kurangnya 8 aksara' },
                { status: 400 }
            );
        }

        // Verify token
        const verification = await query(
            `SELECT * FROM "verification" 
       WHERE identifier = $1 AND value = $2 AND "expiresAt" > NOW()`,
            [`reset:${email}`, token]
        );

        if (verification.rowCount === 0) {
            return NextResponse.json(
                { error: 'Link tidak sah atau telah tamat tempoh' },
                { status: 400 }
            );
        }

        // Delete the verification token
        await query(
            `DELETE FROM "verification" WHERE identifier = $1`,
            [`reset:${email}`]
        );

        // Get user ID from auth.users to update password via Supabase Admin
        const adminClient = getSupabaseAdmin();

        // Find user by email in auth.users
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
        const authUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (authUser) {
            // Update password using Supabase Admin API
            const { error: updateError } = await adminClient.auth.admin.updateUserById(
                authUser.id,
                { password }
            );

            if (updateError) {
                console.error('Supabase password update error:', updateError);
                return NextResponse.json(
                    { error: 'Gagal menukar password' },
                    { status: 500 }
                );
            }
        } else {
            // User not in auth.users yet - this is expected for legacy Better Auth users
            // They will need to re-register with Supabase
            return NextResponse.json(
                { error: 'User perlu mendaftar semula kerana sistem telah dikemaskini' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password berjaya ditukar',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Ralat berlaku' },
            { status: 500 }
        );
    }
}
