import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Simple test endpoint to verify email sending works
// Usage: GET /api/test-email?to=your@email.com
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to');

    if (!to) {
        return NextResponse.json({
            error: 'Missing "to" parameter. Usage: /api/test-email?to=your@email.com'
        }, { status: 400 });
    }

    console.log('[TestEmail] Testing email to:', to);
    console.log('[TestEmail] FROM_EMAIL env:', process.env.FROM_EMAIL || 'NOT SET');
    console.log('[TestEmail] RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);

    const result = await sendEmail({
        to,
        subject: 'Test Email dari AbangBob',
        html: `
            <div style="font-family: sans-serif; padding: 20px;">
                <h1 style="color: #CC1512;">🎉 Email Berjaya Dihantar!</h1>
                <p>Ini adalah email ujian dari sistem AbangBob.</p>
                <p>Jika anda menerima email ini, bermakna konfigurasi Resend adalah betul.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                    Dihantar pada: ${new Date().toISOString()}<br>
                    From: ${process.env.FROM_EMAIL || 'DEFAULT'}
                </p>
            </div>
        `,
    });

    if (result.success) {
        console.log('[TestEmail] ✅ Success:', result.data);
        return NextResponse.json({
            success: true,
            message: 'Email sent successfully!',
            data: result.data
        });
    } else {
        console.error('[TestEmail] ❌ Failed:', result.error);
        return NextResponse.json({
            success: false,
            error: result.error
        }, { status: 500 });
    }
}
