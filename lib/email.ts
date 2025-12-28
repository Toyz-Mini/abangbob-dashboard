import { Resend } from 'resend';

// Lazy initialize Resend to avoid build-time errors
let resend: Resend | null = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Use verified domain abangbobeat.store for sending emails
const FROM_EMAIL = process.env.FROM_EMAIL || 'AbangBob <no-reply@abangbobeat.store>';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  console.log('[Email] Attempting to send email:', { to, subject, from: FROM_EMAIL });

  try {
    const client = getResendClient();

    if (!client) {
      console.error('[Email] Resend client not initialized. Missing RESEND_API_KEY.');
      return { success: false, error: 'Email service not configured' };
    }

    console.log('[Email] Sending via Resend...');
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Send error:', error);
      return { success: false, error };
    }

    console.log('[Email] ✅ Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Service error:', error);
    return { success: false, error };
  }
}

// Email Templates
export function getVerificationEmailTemplate(name: string, verificationUrl: string) {
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
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0; font-size: 14px;">Dashboard</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 22px;">Sahkan Email Anda</h2>
            <p style="color: #666; line-height: 1.6; margin: 0 0 15px;">
              Assalamualaikum ${name},
            </p>
            <p style="color: #666; line-height: 1.6; margin: 0 0 25px;">
              Terima kasih kerana mendaftar dengan AbangBob. Sila klik butang di bawah untuk mengesahkan alamat email anda.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 25px;">
              <tr>
                <td style="background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%); border-radius: 10px;">
                  <a href="${verificationUrl}" style="display: inline-block; padding: 15px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                    Sahkan Email
                  </a>
                </td>
              </tr>
            </table>
            <p style="color: #999; font-size: 13px; margin: 0 0 10px;">
              Atau copy link ini ke browser anda:
            </p>
            <p style="color: #CC1512; font-size: 12px; word-break: break-all; margin: 0 0 25px;">
              ${verificationUrl}
            </p>
            <p style="color: #999; font-size: 13px; margin: 0;">
              Link ini akan tamat tempoh dalam 24 jam.
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

export function getApprovalEmailTemplate(name: string, approved: boolean, reason?: string) {
  const statusColor = approved ? '#22c55e' : '#ef4444';
  const statusText = approved ? 'DILULUSKAN' : 'DITOLAK';
  const message = approved
    ? 'Tahniah! Akaun anda telah diluluskan. Anda kini boleh log masuk ke dashboard.'
    : `Maaf, permohonan anda telah ditolak.${reason ? ` Sebab: ${reason}` : ''}`;

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
          <td style="padding: 40px 30px; text-align: center;">
            <div style="width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 50%; background-color: ${statusColor}; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 40px;">${approved ? '✓' : '✕'}</span>
            </div>
            <h2 style="color: ${statusColor}; margin: 0 0 15px; font-size: 24px;">${statusText}</h2>
            <p style="color: #666; line-height: 1.6; margin: 0 0 25px;">
              ${name}, ${message}
            </p>
            ${approved ? `
              <a href="${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/login" 
                 style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%); color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 10px;">
                Log Masuk Sekarang
              </a>
            ` : ''}
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
