import { NextRequest, NextResponse } from 'next/server';
import { invalidateAllAdminSessions } from '@/lib/security/admin-security';
import { getSupabaseClient } from '@/lib/supabase/client';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email required' },
        { status: 400 }
      );
    }

    // Invalidate all admin sessions
    await invalidateAllAdminSessions(email);

    // Log logout
    try {
      await createAuditLog({
        action: 'LOGOUT',
        resource: 'user_sessions',
        details: {
          email,
          allSessions: true,
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        }
      });
    } catch (auditError) {
      console.warn('[AdminLogout] Failed to log logout:', auditError);
    }

    // Also sign out from Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AdminLogout] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
