import { NextRequest, NextResponse } from 'next/server';
import { verifyAndConfirmMFA, verifyMFAForLogin, getMFAStatus } from '@/lib/auth/mfa';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  try {
    const { userId, code, isLogin } = await request.json();

    if (!userId || !code) {
      return NextResponse.json(
        { success: false, error: 'User ID and code required' },
        { status: 400 }
      );
    }

    let result;

    if (isLogin) {
      // Verify MFA during login
      const isValid = await verifyMFAForLogin(userId, code);
      result = { success: isValid };

      if (isValid) {
        try {
          await createAuditLog({
            userId,
            action: 'LOGIN_SUCCESS',
            resource: 'mfa',
            details: { verified: true }
          });
        } catch (auditError) {
          console.warn('[MFAVerify] Failed to log MFA verification:', auditError);
        }
      }
    } else {
      // Verify and confirm MFA setup
      result = await verifyAndConfirmMFA(userId, code);

      if (result.success) {
        try {
          await createAuditLog({
            userId,
            action: 'SETTINGS_CHANGED',
            resource: 'mfa',
            details: { action: 'MFA_VERIFIED' }
          });
        } catch (auditError) {
          console.warn('[MFAVerify] Failed to log MFA verification:', auditError);
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[MFAVerify] Error:', error);
    return NextResponse.json(
      { success: false, error: 'MFA verification failed' },
      { status: 500 }
    );
  }
}
