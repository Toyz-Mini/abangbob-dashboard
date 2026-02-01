// Session Security Module
// Handles session timeout, tracking, concurrent session limits

import { createServerSupabaseClient } from '../supabase/server';

export interface SessionConfig {
  adminSessionTimeout: number;      // in milliseconds (30 min = 1800000)
  maxConcurrentSessions: number;    // Max sessions per user
  adminMaxConcurrent: number;       // Max for admin users (2)
}

export interface SessionData {
  id: string;
  ipAddress: string;
  userAgent: string;
  isAdmin: boolean;
  createdAt: string;
  lastActivity: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  isAdmin: boolean;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  createdAt: string;
  isExpired: boolean;
}

interface StaffExtendedData {
  sessions?: SessionData[];
  [key: string]: unknown;
}

interface StaffRecord {
  id: string;
  email?: string;
  name?: string;
  accessLevel?: string;
  extended_data: StaffExtendedData | null;
}

export const SESSION_CONFIG: SessionConfig = {
  adminSessionTimeout: 30 * 60 * 1000,  // 30 minutes
  maxConcurrentSessions: 5,
  adminMaxConcurrent: 2
};

/**
 * Helper to get supabase client with null check
 */
async function getSupabase() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  return supabase;
}

/**
 * Get client IP address
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers?.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

/**
 * Get user agent
 */
export function getUserAgent(request: Request): string {
  return request.headers?.get('user-agent') || 'unknown';
}

/**
 * Create new session from login
 */
export async function createSession(
  userId: string,
  isAdmin: boolean,
  request: Request
): Promise<string> {
  try {
    const sessionId = crypto.randomUUID();
    const ipAddress = getClientIP(request);
    const userAgent = getUserAgent(request);
    const now = new Date().toISOString();

    // Store in staff table (add to extended_data JSONB)
    const supabase = await getSupabase();
    const { data: staff, error } = await supabase
      .from('staff')
      .select('extended_data')
      .eq('id', userId)
      .single();

    if (error || !staff) {
      throw new Error('User not found');
    }

    const typedStaff = staff as { extended_data: StaffExtendedData | null };
    const extendedData: StaffExtendedData = typedStaff.extended_data || {};

    // Add session to extended_data
    if (!extendedData.sessions) {
      extendedData.sessions = [];
    }

    extendedData.sessions.push({
      id: sessionId,
      ipAddress,
      userAgent,
      isAdmin,
      createdAt: now,
      lastActivity: now
    });

    // Check concurrent session limit
    const maxSessions = isAdmin ? SESSION_CONFIG.adminMaxConcurrent : SESSION_CONFIG.maxConcurrentSessions;
    if (extendedData.sessions.length > maxSessions) {
      // Remove oldest session - sort with proper types
      extendedData.sessions = extendedData.sessions
        .sort((a: SessionData, b: SessionData) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .slice(1);
    }

    // Update staff with session info
    const { error: updateError } = await supabase
      .from('staff')
      .update({ extended_data: extendedData })
      .eq('id', userId);

    if (updateError) {
      console.error('[SessionSecurity] Error creating session:', updateError);
      throw new Error('Failed to create session');
    }

    // Log to audit log
    try {
      const { createAuditLog } = await import('../audit-log');
      await createAuditLog({
        userId,
        action: 'LOGIN_SUCCESS',
        resource: 'user_sessions',
        details: {
          sessionId,
          isAdmin,
          concurrentSessions: extendedData.sessions.length
        }
      });
    } catch (auditError) {
      console.warn('[SessionSecurity] Failed to create audit log:', auditError);
    }

    return sessionId;
  } catch (error) {
    console.error('[SessionSecurity] Error creating session:', error);
    throw error;
  }
}

/**
 * Check if session is expired
 */
export async function isSessionExpired(userId: string, sessionId: string): Promise<boolean> {
  try {
    const supabase = await getSupabase();
    const { data: staff } = await supabase
      .from('staff')
      .select('extended_data')
      .eq('id', userId)
      .single();

    const typedStaff = staff as { extended_data: StaffExtendedData | null } | null;
    const sessions = typedStaff?.extended_data?.sessions;

    if (!sessions || sessions.length === 0) {
      return true; // No sessions = expired
    }

    const session = sessions.find((s: SessionData) => s.id === sessionId);

    if (!session) {
      return true; // Session not found = expired
    }

    // Check timeout based on admin or regular user
    const timeoutMs = session.isAdmin ? SESSION_CONFIG.adminSessionTimeout : 24 * 60 * 60 * 1000;
    const lastActivity = new Date(session.lastActivity || session.createdAt).getTime();
    const now = Date.now();

    return (now - lastActivity) > timeoutMs;
  } catch (error) {
    console.error('[SessionSecurity] Error checking session expiry:', error);
    return true; // Fail safe - consider expired
  }
}

/**
 * Invalidate specific session
 */
export async function invalidateSession(userId: string, sessionId: string): Promise<void> {
  try {
    const supabase = await getSupabase();
    const { data: staff } = await supabase
      .from('staff')
      .select('extended_data')
      .eq('id', userId)
      .single();

    const typedStaff = staff as { extended_data: StaffExtendedData | null } | null;
    const sessions = typedStaff?.extended_data?.sessions;

    if (!sessions || sessions.length === 0) {
      console.warn('[SessionSecurity] No sessions to invalidate');
      return;
    }

    const filteredSessions = sessions.filter((s: SessionData) => s.id !== sessionId);
    const extendedData: StaffExtendedData = {
      ...typedStaff!.extended_data,
      sessions: filteredSessions
    };

    const { error } = await supabase
      .from('staff')
      .update({ extended_data: extendedData })
      .eq('id', userId);

    if (error) {
      console.error('[SessionSecurity] Error invalidating session:', error);
      throw new Error('Failed to invalidate session');
    }

    // Log session invalidated
    try {
      const { createAuditLog } = await import('../audit-log');
      await createAuditLog({
        userId,
        action: 'LOGOUT',
        resource: 'user_sessions',
        details: { sessionId }
      });
    } catch (auditError) {
      console.warn('[SessionSecurity] Failed to create audit log:', auditError);
    }
  } catch (error) {
    console.error('[SessionSecurity] Error invalidating session:', error);
    throw error;
  }
}

/**
 * Invalidate all user sessions
 */
export async function invalidateAllSessions(userId: string): Promise<void> {
  try {
    const supabase = await getSupabase();

    // First get existing extended_data to preserve other fields
    const { data: staff } = await supabase
      .from('staff')
      .select('extended_data')
      .eq('id', userId)
      .single();

    const typedStaff = staff as { extended_data: StaffExtendedData | null } | null;
    const extendedData: StaffExtendedData = {
      ...typedStaff?.extended_data,
      sessions: []
    };

    const { error } = await supabase
      .from('staff')
      .update({ extended_data: extendedData })
      .eq('id', userId);

    if (error) {
      console.error('[SessionSecurity] Error invalidating all sessions:', error);
      throw new Error('Failed to invalidate all sessions');
    }

    // Log all sessions invalidated
    try {
      const { createAuditLog } = await import('../audit-log');
      await createAuditLog({
        userId,
        action: 'LOGOUT',
        resource: 'user_sessions',
        details: { invalidatedAll: true }
      });
    } catch (auditError) {
      console.warn('[SessionSecurity] Failed to create audit log:', auditError);
    }
  } catch (error) {
    console.error('[SessionSecurity] Error invalidating all sessions:', error);
    throw error;
  }
}

/**
 * Get all active sessions for user
 */
export async function getActiveSessions(userId: string): Promise<SessionInfo[]> {
  try {
    const supabase = await getSupabase();
    const { data: staff } = await supabase
      .from('staff')
      .select('id, email, name, extended_data')
      .eq('id', userId)
      .single();

    const typedStaff = staff as StaffRecord | null;
    const sessions = typedStaff?.extended_data?.sessions;

    if (!sessions || sessions.length === 0) {
      return [];
    }

    const now = Date.now();
    const isAdminUser = typedStaff?.accessLevel === 'admin';
    const timeoutMs = isAdminUser ? SESSION_CONFIG.adminSessionTimeout : 24 * 60 * 60 * 1000;

    return sessions.map((session: SessionData) => {
      const lastActivity = new Date(session.lastActivity || session.createdAt).getTime();
      const isExpired = (now - lastActivity) > timeoutMs;

      return {
        id: session.id,
        userId,
        isAdmin: session.isAdmin || isAdminUser,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        isExpired
      };
    });
  } catch (error) {
    console.error('[SessionSecurity] Error getting active sessions:', error);
    return [];
  }
}

/**
 * Detect suspicious activity (IP or session change)
 */
export async function detectSuspiciousActivity(
  userId: string,
  currentIP: string,
  sessionId: string
): Promise<{ suspicious: boolean; reason?: string }> {
  try {
    const supabase = await getSupabase();
    const { data: staff } = await supabase
      .from('staff')
      .select('extended_data')
      .eq('id', userId)
      .single();

    const typedStaff = staff as { extended_data: StaffExtendedData | null } | null;
    const sessions = typedStaff?.extended_data?.sessions;

    if (!sessions || sessions.length === 0) {
      return { suspicious: false };
    }

    // Find the specific session
    const session = sessions.find((s: SessionData) => s.id === sessionId);

    if (!session) {
      return { suspicious: false };
    }

    // Check for IP changes across sessions
    const ipChanged = sessions.some((s: SessionData) =>
      s.id !== sessionId && s.ipAddress !== currentIP && currentIP !== 'unknown'
    );

    if (ipChanged) {
      // Log suspicious activity
      try {
        const { createAuditLog } = await import('../audit-log');
        await createAuditLog({
          userId,
          action: 'LOGIN_SUCCESS', // Using existing action type with suspicious flag
          resource: 'user_sessions',
          details: {
            suspicious: true,
            sessionId,
            ipChanged: true,
            previousIP: session.ipAddress,
            currentIP
          }
        });
      } catch (auditError) {
        console.warn('[SessionSecurity] Failed to create audit log:', auditError);
      }

      return {
        suspicious: true,
        reason: 'IP address changed between sessions'
      };
    }

    return { suspicious: false };
  } catch (error) {
    console.error('[SessionSecurity] Error detecting suspicious activity:', error);
    return { suspicious: false };
  }
}

/**
 * Update session last activity
 */
export async function updateSessionActivity(userId: string, sessionId: string): Promise<void> {
  try {
    const supabase = await getSupabase();
    const { data: staff } = await supabase
      .from('staff')
      .select('extended_data')
      .eq('id', userId)
      .single();

    const typedStaff = staff as { extended_data: StaffExtendedData | null } | null;
    const sessions = typedStaff?.extended_data?.sessions;

    if (!sessions) {
      return;
    }

    const sessionIndex = sessions.findIndex((s: SessionData) => s.id === sessionId);
    if (sessionIndex === -1) {
      return;
    }

    sessions[sessionIndex].lastActivity = new Date().toISOString();
    const extendedData: StaffExtendedData = {
      ...typedStaff!.extended_data,
      sessions
    };

    await supabase
      .from('staff')
      .update({ extended_data: extendedData })
      .eq('id', userId);
  } catch (error) {
    console.error('[SessionSecurity] Error updating session activity:', error);
  }
}
