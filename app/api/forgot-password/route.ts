import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmail, getVerificationEmailTemplate } from '@/lib/email';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 requests per 15 minutes
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`forgot-password:${clientIP}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 3,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percubaan. Cuba lagi dalam ${rateLimitResult.retryAfter} saat.`
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email diperlukan' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userResult = await query(
      `SELECT id, name, email FROM "user" WHERE email = $1`,
      [email]
    );

    // Always return success to prevent email enumeration
    if (userResult.rowCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'Jika email wujud, anda akan menerima link reset password.',
      });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token - first delete any existing token for this email, then insert new
    await query(
      `DELETE FROM "verification" WHERE identifier = $1`,
      [`reset:${email}`]
    );

    await query(
      `INSERT INTO "verification" (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [`reset-${crypto.randomUUID()}`, `reset:${email}`, token, expiresAt]
    );

    // Create reset URL
    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Send reset email (don't fail if email service is unavailable)
    try {
      const emailHtml = getPasswordResetEmailTemplate(user.name, resetUrl);
      const emailResult = await sendEmail({
        to: email,
        subject: 'Reset Password - AbangBob',
        html: emailHtml,
      });

      if (!emailResult.success) {
        console.warn('Failed to send reset email:', emailResult.error);
        // Log but don't fail - for security don't reveal email status
      }
    } catch (emailError) {
      console.warn('Email service error:', emailError);
      // Continue anyway - don't reveal if email was sent
    }

    return NextResponse.json({
      success: true,
      message: 'Jika email wujud, anda akan menerima link reset password.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Ralat berlaku' },
      { status: 500 }
    );
  }
}

function getPasswordResetEmailTemplate(name: string, resetUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
          <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%);">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">AbangBob</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 22px;">Reset Password</h2>
            <p style="color: #666; line-height: 1.6; margin: 0 0 15px;">
              Assalamualaikum ${name},
            </p>
            <p style="color: #666; line-height: 1.6; margin: 0 0 25px;">
              Kami menerima permintaan untuk reset password akaun anda. Klik butang di bawah untuk menetapkan password baru.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 25px;">
              <tr>
                <td style="background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%); border-radius: 10px;">
                  <a href="${resetUrl}" style="display: inline-block; padding: 15px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>
            <p style="color: #999; font-size: 13px; margin: 0 0 10px;">
              Link ini akan tamat tempoh dalam 1 jam.
            </p>
            <p style="color: #999; font-size: 13px; margin: 0;">
              Jika anda tidak meminta reset password, abaikan email ini.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
              © ${new Date().getFullYear()} AbangBob. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
