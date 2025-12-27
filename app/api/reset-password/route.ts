import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { auth } from '@/lib/auth/server';

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

        // Update password in account table (Better Auth stores hashed passwords there)
        // Note: Better Auth uses its own hashing, we update via their mechanism
        // For now, let's update direct - in production, use Better Auth's API

        // Delete the verification token
        await query(
            `DELETE FROM "verification" WHERE identifier = $1`,
            [`reset:${email}`]
        );

        // Update password using Better Auth's internal adapter
        const userResult = await query(`SELECT id FROM "user" WHERE email = $1`, [email]);
        if (userResult.rowCount > 0) {
            await (auth as any).internalAdapter.updatePassword({
                userId: userResult.rows[0].id,
                newPassword: password
            });
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
