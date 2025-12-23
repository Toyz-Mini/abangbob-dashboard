import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (!token || !email) {
            return NextResponse.redirect(new URL('/verification-failed?error=missing', request.url));
        }

        // Check if token is valid
        const verification = await query(
            `SELECT * FROM "verification" 
       WHERE identifier = $1 AND value = $2 AND "expiresAt" > NOW()`,
            [email, token]
        );

        if (verification.rowCount === 0) {
            return NextResponse.redirect(new URL('/verification-failed?error=invalid', request.url));
        }

        // Update user emailVerified status
        await query(
            `UPDATE "user" 
       SET "emailVerified" = true, "updatedAt" = NOW()
       WHERE email = $1`,
            [email]
        );

        // Delete used verification token
        await query(
            `DELETE FROM "verification" WHERE identifier = $1`,
            [email]
        );

        // Redirect to success page
        return NextResponse.redirect(new URL('/verification-success', request.url));
    } catch (error) {
        console.error('Email verification error:', error);
        return NextResponse.redirect(new URL('/verification-failed?error=server', request.url));
    }
}
