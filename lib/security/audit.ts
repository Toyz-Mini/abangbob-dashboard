import { query } from '@/lib/db';

export type AuditAction =
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'PASSWORD_RESET_REQUEST'
    | 'PASSWORD_RESET_SUCCESS'
    | 'PROFILE_UPDATE'
    | 'ACCOUNT_LOCKED'
    | 'ACCOUNT_UNLOCKED'
    | 'USER_CREATED'
    | 'USER_APPROVED'
    | 'USER_REJECTED'
    | 'SETTINGS_CHANGED'
    | 'DATA_EXPORT'
    | 'DATA_DELETE';

interface AuditLogEntry {
    userId?: string;
    action: AuditAction;
    resource?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
        await query(
            `INSERT INTO "audit_logs" 
       ("user_id", "action", "resource", "resource_id", "details", "ip_address", "user_agent")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                entry.userId || null,
                entry.action,
                entry.resource || null,
                entry.resourceId || null,
                entry.details ? JSON.stringify(entry.details) : null,
                entry.ipAddress || null,
                entry.userAgent || null,
            ]
        );
    } catch (error) {
        console.error('Create audit log error:', error);
        // Don't throw - audit logging should not break main flows
    }
}

/**
 * Get audit logs for a user
 */
export async function getAuditLogsForUser(
    userId: string,
    limit: number = 50
): Promise<AuditLogEntry[]> {
    try {
        const result = await query(
            `SELECT * FROM "audit_logs" 
       WHERE "user_id" = $1 
       ORDER BY "created_at" DESC 
       LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    } catch (error) {
        console.error('Get audit logs error:', error);
        return [];
    }
}

/**
 * Get all audit logs (admin function)
 */
export async function getAllAuditLogs(
    filters?: {
        action?: AuditAction;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
    },
    limit: number = 100
): Promise<AuditLogEntry[]> {
    try {
        let sqlQuery = `SELECT * FROM "audit_logs" WHERE 1=1`;
        const params: (string | Date)[] = [];
        let paramIndex = 1;

        if (filters?.action) {
            sqlQuery += ` AND "action" = $${paramIndex++}`;
            params.push(filters.action);
        }
        if (filters?.userId) {
            sqlQuery += ` AND "user_id" = $${paramIndex++}`;
            params.push(filters.userId);
        }
        if (filters?.startDate) {
            sqlQuery += ` AND "created_at" >= $${paramIndex++}`;
            params.push(filters.startDate);
        }
        if (filters?.endDate) {
            sqlQuery += ` AND "created_at" <= $${paramIndex++}`;
            params.push(filters.endDate);
        }

        sqlQuery += ` ORDER BY "createdAt" DESC LIMIT $${paramIndex}`;
        params.push(limit.toString());

        const result = await query(sqlQuery, params);
        return result.rows;
    } catch (error) {
        console.error('Get all audit logs error:', error);
        return [];
    }
}

/**
 * Helper to extract client info from request
 */
export function getClientInfo(request: Request): { ipAddress: string; userAgent: string } {
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    return { ipAddress, userAgent };
}
