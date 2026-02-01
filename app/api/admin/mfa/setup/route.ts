import { NextRequest, NextResponse } from 'next/server';
import { enableMFA, verifyAndConfirmMFA, getMFAStatus } from '@/lib/auth/mfa';
import { checkIsAdmin } from '@/lib/security/admin-security';
import { createAuditLog } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  try {
    // Get user from session cookie or header
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    const status = await getMFAStatus(userId);
    return NextResponse.json({
      success: true,
      mfa: status
    });
  } catch (error) {
    console.error('[MFAStatus] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get MFA status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: 'User ID and email required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const isAdminUser = await checkIsAdmin(email);
    if (!isAdminUser) {
      return NextResponse.json(
        { success: false, error: 'Not authorized as admin' },
        { status: 403 }
      );
    }

    // Enable MFA and generate setup
    const setup = await enableMFA(userId, email);

    // Log MFA enablement
    try {
      await createAuditLog({
        userId,
        action: 'SETTINGS_CHANGED',
        resource: 'mfa',
        details: {
          action: 'MFA_ENABLED',
          email
        }
      });
    } catch (auditError) {
      console.warn('[MFASetup] Failed to log MFA enablement:', auditError);
    }

    return NextResponse.json({
      success: true,
      qrCode: setup.qrCode,
      secret: setup.secret,
      backupCodes: setup.backupCodes
    });
  } catch (error) {
    console.error('[MFASetup] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup MFA' },
      { status: 500 }
    );
  }
}
