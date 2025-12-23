import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { sendEmail, getVerificationEmailTemplate } from '@/lib/email';
import crypto from 'crypto';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, email, name } = body;

        if (!userId || !email) {
            return NextResponse.json(
                { error: 'User ID and email are required' },
                { status: 400 }
            );
        }

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Save verification token
        await pool.query(
            `INSERT INTO "verification" (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET value = $3, "expiresAt" = $4, "updatedAt" = NOW()`,
            [crypto.randomUUID(), email, token, expiresAt]
        );

        // Create verification URL
        const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/api/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

        // Send verification email
        const emailHtml = getVerificationEmailTemplate(name || 'Pengguna', verificationUrl);
        const result = await sendEmail({
            to: email,
            subject: 'Sahkan Email Anda - AbangBob',
            html: emailHtml,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: 'Failed to send verification email' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Verification email sent',
        });
    } catch (error) {
        console.error('Send verification error:', error);
        return NextResponse.json(
            { error: 'Failed to send verification email' },
            { status: 500 }
        );
    }
}
