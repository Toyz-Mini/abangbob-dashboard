// Admin Security Module
// Handles admin-specific protections (no IP whitelist, no time restrictions, email-based roles)

import { Pool, PoolClient } from 'pg';

// Create a shared pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const ADMIN_CONFIG = {
  mfaRequired: true,               // Required for all admins (from your answer)
  maxConcurrentSessions: 2,           // Max 2 concurrent admin sessions
  sessionTimeoutMinutes: 30           // 30 min idle timeout for admins
};

export interface AdminSession {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity?: string;
  isExpired: boolean;
}

/**
 * Check if user is admin (from user table)
 */
export async function checkIsAdmin(email: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT role FROM "user" WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return false;
    }

    const user = result.rows[0];
    const userRole = (user?.role || '').toLowerCase();
    const adminRoles = ['admin', 'towkay'];

    return adminRoles.includes(userRole);
  } catch (error) {
    console.error('[AdminSecurity] Error checking admin status:', error);
    return false;
  }
}

/**
 * Create admin session
 */
export async function createAdminSession(
  email: string,
  request: Request
): Promise<string> {
  try {
    const sessionId = crypto.randomUUID();
    const ipAddress = request.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers?.get('user-agent') || 'unknown';

    // Get current user data
    const userResult = await pool.query(
      `SELECT id, extended_data FROM "user" WHERE email = $1`,
      [email]
    );

    if (userResult.rowCount === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    const extendedData = user.extended_data || {};

    // Initialize sessions if not present
    let sessions: AdminSession[] = (extendedData.sessions as AdminSession[]) || [];

    // Check concurrent session limit
    const maxSessions = ADMIN_CONFIG.maxConcurrentSessions;
    if (sessions.length >= maxSessions) {
      // Remove oldest session
      sessions = sessions.slice(1); // Remove first (oldest) session
    }

    // Add new session
    sessions.push({
      id: sessionId,
      email,
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
      isExpired: false
    });

    // Update extended_data with new session
    extendedData.sessions = sessions;

    const updateResult = await pool.query(
      `UPDATE "user" SET extended_data = $1 WHERE email = $2`,
      [JSON.stringify(extendedData), email]
    );

    if (updateResult.rowCount === 0) {
      throw new Error('Failed to create session');
    }

    // Log admin login
    try {
      const { createAuditLog } = await import('../audit-log');
      await createAuditLog({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'user',
        details: { ipAddress, adminSession: true }
      });
    } catch (auditError) {
      console.warn('[AdminSecurity] Failed to create audit log:', auditError);
    }

    console.log('[AdminSecurity] Admin session created for:', email);
    return sessionId;
  } catch (error) {
    console.error('[AdminSecurity] Error in admin login:', error);
    throw error;
  }
}

/**
 * Check if admin session is expired
 */
export async function isAdminSessionExpired(email: string, sessionId: string): Promise<boolean> {
  try {
    // Get user sessions
    const result = await pool.query(
      `SELECT extended_data FROM "user" WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return true; // User not found = expired
    }

    const user = result.rows[0];
    const sessions = user.extended_data?.sessions as AdminSession[] | undefined;

    if (!sessions || sessions.length === 0) {
      return true; // No sessions = expired
    }

    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
      return true; // Session not found = expired
    }

    const lastActivity = new Date(session.lastActivity || session.createdAt).getTime();
    const timeoutMs = ADMIN_CONFIG.sessionTimeoutMinutes * 60 * 1000; // 30 min = 1800000ms

    return (Date.now() - lastActivity) > timeoutMs;
  } catch (error) {
    console.error('[AdminSecurity] Error checking session expiry:', error);
    return true; // Fail safe - consider expired
  }
}

/**
 * Invalidate specific admin session
 */
export async function invalidateAdminSession(email: string, sessionId: string): Promise<void> {
  try {
    // Get user data
    const result = await pool.query(
      `SELECT id, extended_data FROM "user" WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      console.warn('[AdminSecurity] User not found for session invalidation');
      return;
    }

    const user = result.rows[0];
    const extendedData = user.extended_data || {};
    const sessions = extendedData.sessions as AdminSession[] | undefined;

    if (!sessions || sessions.length === 0) {
      console.warn('[AdminSecurity] No sessions to invalidate');
      return;
    }

    // Filter out the session
    extendedData.sessions = sessions.filter(s => s.id !== sessionId);

    const updateResult = await pool.query(
      `UPDATE "user" SET extended_data = $1 WHERE email = $2`,
      [JSON.stringify(extendedData), email]
    );

    if (updateResult.rowCount === 0) {
      throw new Error('Failed to invalidate session');
    }

    // Log session invalidated
    try {
      const { createAuditLog } = await import('../audit-log');
      await createAuditLog({
        userId: user.id,
        action: 'LOGOUT',
        resource: 'user_sessions',
        details: { sessionId }
      });
    } catch (auditError) {
      console.warn('[AdminSecurity] Failed to create audit log:', auditError);
    }
  } catch (error) {
    console.error('[AdminSecurity] Error invalidating session:', error);
    throw new Error('Failed to invalidate session');
  }
}

/**
 * Invalidate all admin sessions
 */
export async function invalidateAllAdminSessions(email: string): Promise<void> {
  try {
    // Get user data
    const result = await pool.query(
      `SELECT id, extended_data FROM "user" WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      console.warn('[AdminSecurity] User not found for session invalidation');
      return;
    }

    const user = result.rows[0];
    const extendedData = user.extended_data || {};

    if (!extendedData.sessions || extendedData.sessions.length === 0) {
      console.warn('[AdminSecurity] No sessions to invalidate');
      return;
    }

    // Clear all sessions
    extendedData.sessions = [];

    const updateResult = await pool.query(
      `UPDATE "user" SET extended_data = $1 WHERE email = $2`,
      [JSON.stringify(extendedData), email]
    );

    if (updateResult.rowCount === 0) {
      throw new Error('Failed to invalidate all sessions');
    }

    // Log sessions invalidated
    try {
      const { createAuditLog } = await import('../audit-log');
      await createAuditLog({
        userId: user.id,
        action: 'LOGOUT',
        resource: 'user_sessions',
        details: { allSessions: true }
      });
    } catch (auditError) {
      console.warn('[AdminSecurity] Failed to create audit log:', auditError);
    }
  } catch (error) {
    console.error('[AdminSecurity] Error invalidating all sessions:', error);
    throw new Error('Failed to invalidate all sessions');
  }
}

/**
 * Detect suspicious activity (IP change between sessions)
 */
export async function detectAdminSuspiciousActivity(
  email: string,
  currentIP: string,
  sessionId: string
): Promise<{ suspicious: boolean; reason?: string }> {
  try {
    // Get user sessions
    const result = await pool.query(
      `SELECT id, extended_data FROM "user" WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return { suspicious: false };
    }

    const user = result.rows[0];
    const sessions = user.extended_data?.sessions as AdminSession[] | undefined;

    if (!sessions || sessions.length === 0) {
      return { suspicious: false };
    }

    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
      return { suspicious: false };
    }

    // Check for suspicious IP changes
    const originalIP = session.ipAddress;
    const ipChanged = originalIP !== currentIP && currentIP !== 'unknown' && originalIP !== 'unknown';

    if (ipChanged) {
      // Log suspicious activity
      try {
        const { createAuditLog } = await import('../audit-log');
        await createAuditLog({
          userId: user.id,
          action: 'LOGIN_SUCCESS', // Using existing action type
          resource: 'user_sessions',
          details: {
            suspicious: true,
            reason: 'IP address changed',
            previousIP: originalIP,
            currentIP
          }
        });
      } catch (auditError) {
        console.warn('[AdminSecurity] Failed to create audit log:', auditError);
      }

      return {
        suspicious: true,
        reason: 'IP address changed between sessions'
      };
    }

    return { suspicious: false };
  } catch (error) {
    console.error('[AdminSecurity] Error detecting suspicious activity:', error);
    return { suspicious: false };
  }
}

/**
 * Get all active admin sessions
 */
export async function getActiveAdminSessions(email: string): Promise<AdminSession[]> {
  try {
    const result = await pool.query(
      `SELECT extended_data FROM "user" WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return [];
    }

    const user = result.rows[0];
    const sessions = user.extended_data?.sessions as AdminSession[] | undefined;

    if (!sessions || sessions.length === 0) {
      return [];
    }

    const now = Date.now();
    const timeoutMs = ADMIN_CONFIG.sessionTimeoutMinutes * 60 * 1000;

    return sessions.map(session => {
      const lastActivity = new Date(session.lastActivity || session.createdAt).getTime();
      const isExpired = (now - lastActivity) > timeoutMs;

      return {
        id: session.id,
        email,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        lastActivity: session.lastActivity || session.createdAt,
        createdAt: session.createdAt,
        isExpired
      };
    });
  } catch (error) {
    console.error('[AdminSecurity] Error getting active sessions:', error);
    return [];
  }
}

/**
 * Update session last activity
 */
export async function updateSessionActivity(email: string, sessionId: string): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT extended_data FROM "user" WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return;
    }

    const user = result.rows[0];
    const extendedData = user.extended_data || {};
    const sessions = extendedData.sessions as AdminSession[] | undefined;

    if (!sessions) {
      return;
    }

    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      return;
    }

    sessions[sessionIndex].lastActivity = new Date().toISOString();
    extendedData.sessions = sessions;

    await pool.query(
      `UPDATE "user" SET extended_data = $1 WHERE email = $2`,
      [JSON.stringify(extendedData), email]
    );
  } catch (error) {
    console.error('[AdminSecurity] Error updating session activity:', error);
  }
}

/**
 * Verify re-authentication for sensitive operations
 */
export async function verifyReauthForSensitiveOp(
  email: string,
  password: string,
  sessionId: string,
  request: Request
): Promise<boolean> {
  try {
    // Check if MFA is required
    const mfaRequired = ADMIN_CONFIG.mfaRequired;

    if (mfaRequired) {
      // MFA module not yet implemented - planned for Phase 2
      // For now, log and continue to standard re-auth
      console.log('[AdminSecurity] MFA required but module not yet implemented');
    }

    // Require re-auth if suspicious activity detected
    const currentIP = request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const suspicious = await detectAdminSuspiciousActivity(email, currentIP, sessionId);

    if (suspicious?.suspicious) {
      // Force re-auth
      console.log('[AdminSecurity] Forcing re-auth for suspicious user:', email);
      return false;
    }

    // Check if last session was recent enough
    const result = await pool.query(
      `SELECT extended_data FROM "user" WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return false;
    }

    const user = result.rows[0];
    const sessions = user.extended_data?.sessions as AdminSession[] | undefined;
    const session = sessions?.find(s => s.id === sessionId);

    if (!session) {
      return false;
    }

    const lastActivity = new Date(session.lastActivity || session.createdAt);
    const minutesSinceLastActivity = Date.now() - lastActivity.getTime();
    const REAUTH_TIMEOUT_MINUTES = 60; // Force re-auth if idle for 1+ hours
    const REAUTH_TIMEOUT_MS = REAUTH_TIMEOUT_MINUTES * 60 * 1000;

    // Need re-auth if idle too long
    if (minutesSinceLastActivity > REAUTH_TIMEOUT_MS) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('[AdminSecurity] Error verifying re-auth:', error);
    return false;
  }
}

/**
 * Helper: Get client info
 */
export function getClientInfo(request: Request): { ipAddress: string; userAgent: string } {
  const forwarded = request?.headers?.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0]?.trim() : 'unknown';
  const userAgent = request?.headers?.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}
