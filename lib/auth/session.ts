import { query } from '@/lib/db';

const SESSION_IDLE_TIMEOUT_MINUTES = 30;
const MAX_SESSIONS_PER_USER = 3; // Allow multiple devices up to limit

interface ActiveSession {
    id: string;
    userId: string;
    deviceInfo: string;
    ipAddress: string;
    lastActive: Date;
    createdAt: Date;
}

/**
 * Create or update a session
 */
export async function createSession(
    sessionId: string,
    userId: string,
    deviceInfo?: string,
    ipAddress?: string
): Promise<void> {
    try {
        // First, cleanup old sessions for this user if over limit
        await enforceSessionLimit(userId);

        // Create/update session
        await query(
            `INSERT INTO "active_sessions" ("id", "user_id", "device_info", "ip_address", "last_active")
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT ("id") DO UPDATE SET "last_active" = NOW()`,
            [sessionId, userId, deviceInfo || 'Unknown Device', ipAddress || 'unknown']
        );
    } catch (error) {
        console.error('Create session error:', error);
    }
}

/**
 * Update session last active time
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
    try {
        await query(
            `UPDATE "active_sessions" SET "last_active" = NOW() WHERE "id" = $1`,
            [sessionId]
        );
    } catch (error) {
        console.error('Update session error:', error);
    }
}

/**
 * Check if session is still valid (not idle for too long)
 */
export async function validateSession(sessionId: string): Promise<boolean> {
    try {
        const result = await query(
            `SELECT "last_active" FROM "active_sessions" WHERE "id" = $1`,
            [sessionId]
        );

        if (result.rowCount === 0) return false;

        const lastActive = new Date(result.rows[0].last_active);
        const idleTime = (Date.now() - lastActive.getTime()) / 1000 / 60;

        if (idleTime > SESSION_IDLE_TIMEOUT_MINUTES) {
            // Session expired, delete it
            await deleteSession(sessionId);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Validate session error:', error);
        return false;
    }
}

/**
 * Delete a specific session
 */
export async function deleteSession(sessionId: string): Promise<void> {
    try {
        await query(`DELETE FROM "active_sessions" WHERE "id" = $1`, [sessionId]);
    } catch (error) {
        console.error('Delete session error:', error);
    }
}

/**
 * Delete all sessions for a user (logout everywhere)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
    try {
        await query(`DELETE FROM "active_sessions" WHERE "user_id" = $1`, [userId]);
    } catch (error) {
        console.error('Delete all sessions error:', error);
    }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<ActiveSession[]> {
    try {
        const result = await query(
            `SELECT * FROM "active_sessions" 
       WHERE "user_id" = $1 
       ORDER BY "last_active" DESC`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error('Get user sessions error:', error);
        return [];
    }
}

/**
 * Enforce max sessions per user
 */
async function enforceSessionLimit(userId: string): Promise<void> {
    try {
        const result = await query(
            `SELECT id FROM "active_sessions" 
       WHERE "user_id" = $1 
       ORDER BY "last_active" ASC`,
            [userId]
        );

        const rowCount = result.rowCount ?? 0;
        if (rowCount >= MAX_SESSIONS_PER_USER) {
            // Delete oldest sessions to make room
            const sessionsToDelete = result.rows.slice(0, rowCount - MAX_SESSIONS_PER_USER + 1);
            for (const session of sessionsToDelete) {
                await deleteSession(session.id);
            }
        }
    } catch (error) {
        console.error('Enforce session limit error:', error);
    }
}

/**
 * Cleanup expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
    try {
        const result = await query(
            `DELETE FROM "active_sessions" 
       WHERE "last_active" < NOW() - INTERVAL '${SESSION_IDLE_TIMEOUT_MINUTES} minutes'
       RETURNING id`
        );
        return result.rowCount || 0;
    } catch (error) {
        console.error('Cleanup sessions error:', error);
        return 0;
    }
}
