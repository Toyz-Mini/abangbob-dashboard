import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmail, getVerificationEmailTemplate } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    console.log('[SendVerification] Received request');

    try {
        const body = await request.json();
        const { userId, email, name } = body;

        console.log('[SendVerification] Request body:', { userId, email, name: name?.slice(0, 10) });

        if (!userId || !email) {
            console.error('[SendVerification] Missing userId or email');
            return NextResponse.json(
                { error: 'User ID and email are required' },
                { status: 400 }
            );
        }

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const verificationId = crypto.randomUUID();

        console.log('[SendVerification] Generated token, saving to database...');

        // Save verification token - DELETE existing first, then INSERT new
        try {
            // First, delete any existing tokens for this email
            await query(
                `DELETE FROM "verification" WHERE LOWER(identifier) = LOWER($1)`,
                [email]
            );
            console.log('[SendVerification] Cleared old tokens for email');

            // Then insert new token
            const insertResult = await query(
                `INSERT INTO "verification" (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 RETURNING id`,
                [verificationId, email, token, expiresAt]
            );
            console.log('[SendVerification] ✅ Token saved to database:', insertResult.rows[0]);
        } catch (dbError: any) {
            console.error('[SendVerification] ❌ Database error:', dbError.message);
            // Don't continue - if we can't save token, verification won't work
            return NextResponse.json(
                { error: 'Failed to save verification token', details: dbError.message },
                { status: 500 }
            );
        }

        // Create verification URL
        const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/api/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

        console.log('[SendVerification] Verification URL created:', verificationUrl.slice(0, 60) + '...');

        // Send verification email
        const emailHtml = getVerificationEmailTemplate(name || 'Pengguna', verificationUrl);
        console.log('[SendVerification] Sending email to:', email);

        const result = await sendEmail({
            to: email,
            subject: 'Sahkan Email Anda - AbangBob',
            html: emailHtml,
        });

        if (!result.success) {
            console.error('[SendVerification] Email send failed:', result.error);
            return NextResponse.json(
                { error: 'Failed to send verification email', details: result.error },
                { status: 500 }
            );
        }

        console.log('[SendVerification] ✅ Email sent successfully!');
        return NextResponse.json({
            success: true,
            message: 'Verification email sent',
        });
    } catch (error: any) {
        console.error('[SendVerification] Error:', error.message || error);
        return NextResponse.json(
            { error: 'Failed to send verification email', message: error.message },
            { status: 500 }
        );
    }
}

