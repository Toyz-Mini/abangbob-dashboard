import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    console.log('[VerifyEmail] Received verification request');

    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        console.log('[VerifyEmail] Parameters:', {
            email,
            tokenPrefix: token?.slice(0, 10) + '...',
            tokenLength: token?.length
        });

        if (!token || !email) {
            console.error('[VerifyEmail] Missing token or email');
            return NextResponse.redirect(new URL('/verification-failed?error=missing', request.url));
        }

        // Check if token is valid - use case-insensitive email comparison
        console.log('[VerifyEmail] Checking token in database...');
        const verification = await query(
            `SELECT * FROM "verification" 
             WHERE LOWER(identifier) = LOWER($1) AND value = $2 AND "expiresAt" > NOW()`,
            [email, token]
        );

        console.log('[VerifyEmail] Query result:', {
            rowCount: verification.rowCount,
            rows: verification.rows?.length
        });

        if (!verification.rowCount || verification.rowCount === 0) {
            // Debug: Check if token exists but expired
            const expiredCheck = await query(
                `SELECT id, "expiresAt", 
                        CASE WHEN "expiresAt" > NOW() THEN 'valid' ELSE 'expired' END as status
                 FROM "verification" 
                 WHERE LOWER(identifier) = LOWER($1)`,
                [email]
            );
            console.log('[VerifyEmail] Existing tokens for email:', expiredCheck.rows);

            console.error('[VerifyEmail] Token not found or expired');
            return NextResponse.redirect(new URL('/verification-failed?error=invalid', request.url));
        }

        console.log('[VerifyEmail] Token valid! Updating user...');

        // Update user emailVerified status
        const updateResult = await query(
            `UPDATE "user" 
             SET "emailVerified" = true, "updatedAt" = NOW()
             WHERE LOWER(email) = LOWER($1)
             RETURNING id, email, "emailVerified"`,
            [email]
        );

        console.log('[VerifyEmail] User update result:', updateResult.rows);

        if (!updateResult.rowCount || updateResult.rowCount === 0) {
            console.error('[VerifyEmail] User not found for email:', email);
            return NextResponse.redirect(new URL('/verification-failed?error=user_not_found', request.url));
        }

        // Delete used verification token
        await query(
            `DELETE FROM "verification" WHERE LOWER(identifier) = LOWER($1)`,
            [email]
        );

        console.log('[VerifyEmail] ✅ Verification successful!');

        // Redirect to success page
        return NextResponse.redirect(new URL('/verification-success', request.url));
    } catch (error: any) {
        console.error('[VerifyEmail] Error:', error.message || error);
        return NextResponse.redirect(new URL('/verification-failed?error=server', request.url));
    }
}

