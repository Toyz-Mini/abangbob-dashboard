import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Debug endpoint to check verification tokens and user status
// Usage: GET /api/debug-verification?email=test@example.com
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({
            error: 'Missing email parameter'
        }, { status: 400 });
    }

    try {
        // Check verification tokens
        const tokens = await query(
            `SELECT id, identifier, 
                    LEFT(value, 10) as token_prefix,
                    "expiresAt", 
                    "createdAt",
                    CASE WHEN "expiresAt" > NOW() THEN 'valid' ELSE 'expired' END as status
             FROM "verification" 
             WHERE LOWER(identifier) = LOWER($1)
             ORDER BY "createdAt" DESC`,
            [email]
        );

        // Check user status
        const user = await query(
            `SELECT id, name, email, "emailVerified", status, "createdAt"
             FROM "user" 
             WHERE LOWER(email) = LOWER($1)`,
            [email]
        );

        return NextResponse.json({
            email,
            verificationTokens: tokens.rows,
            tokenCount: tokens.rowCount,
            user: user.rows[0] || null,
            userFound: (user.rowCount || 0) > 0,
            currentTime: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
