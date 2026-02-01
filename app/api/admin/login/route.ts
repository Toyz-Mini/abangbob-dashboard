import { NextRequest, NextResponse } from 'next/server';
import { checkIsAdmin, createAdminSession, isAdminSessionExpired } from '@/lib/security/admin-security';
import { verifyMFAForLogin, getMFAStatus } from '@/lib/auth/mfa';
import { getSupabaseClient } from '@/lib/supabase/client';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  try {
    const { email, password, totpCode } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // 1. Authenticate with Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Log failed login attempt
      try {
        await createAuditLog({
          action: 'LOGIN_FAILED',
          resource: 'user',
          details: {
            email,
            reason: authError.message,
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
          }
        });
      } catch (auditError) {
        console.warn('[AdminLogin] Failed to log failed login:', auditError);
      }

      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 401 }
      );
    }

    const user = data.user;
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // 2. Check if user is admin
    const isAdminUser = await checkIsAdmin(email);
    if (!isAdminUser) {
      return NextResponse.json(
        { success: false, error: 'Not authorized as admin' },
        { status: 403 }
      );
    }

    // 3. Check if MFA is required for this admin
    const mfaStatus = await getMFAStatus(user.id);

    // If MFA is enabled but no code provided, ask for it
    if (mfaStatus.enabled && mfaStatus.verified && !totpCode) {
      return NextResponse.json({
        success: false,
        requiresMFA: true,
        error: 'MFA code required'
      }, { status: 200 });
    }

    // If MFA code provided, verify it
    if (mfaStatus.enabled && mfaStatus.verified && totpCode) {
      const mfaValid = await verifyMFAForLogin(user.id, totpCode);
      if (!mfaValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid MFA code' },
          { status: 401 }
        );
      }
    }

    // 4. Create admin session
    const sessionId = await createAdminSession(email, request);

    // 5. Log successful login
    try {
      await createAuditLog({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'user',
        details: {
          email,
          sessionId,
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
          mfaUsed: mfaStatus.enabled && mfaStatus.verified
        }
      });
    } catch (auditError) {
      console.warn('[AdminLogin] Failed to log successful login:', auditError);
    }

    // 6. Return session info
    return NextResponse.json({
      success: true,
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || ''
      },
      mfaEnabled: mfaStatus.enabled
    });

  } catch (error) {
    console.error('[AdminLogin] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
