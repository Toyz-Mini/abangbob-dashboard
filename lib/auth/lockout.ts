import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

interface LockoutStatus {
    isLocked: boolean;
    lockedUntil?: Date;
    remainingAttempts: number;
}

/**
 * Check if account is locked
 */
export async function checkAccountLockout(email: string): Promise<LockoutStatus> {
    try {
        const result = await pool.query(
            `SELECT "lockedUntil", "failedLoginAttempts" FROM "user" WHERE email = $1`,
            [email]
        );

        if (result.rowCount === 0) {
            return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
        }

        const user = result.rows[0];
        const now = new Date();

        // Check if currently locked
        if (user.lockedUntil && new Date(user.lockedUntil) > now) {
            return {
                isLocked: true,
                lockedUntil: new Date(user.lockedUntil),
                remainingAttempts: 0,
            };
        }

        // If lock expired, reset
        if (user.lockedUntil && new Date(user.lockedUntil) <= now) {
            await pool.query(
                `UPDATE "user" SET "lockedUntil" = NULL, "failedLoginAttempts" = 0 WHERE email = $1`,
                [email]
            );
            return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
        }

        const remaining = MAX_FAILED_ATTEMPTS - (user.failedLoginAttempts || 0);
        return { isLocked: false, remainingAttempts: Math.max(0, remaining) };
    } catch (error) {
        console.error('Check lockout error:', error);
        return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
    }
}

/**
 * Record failed login attempt
 */
export async function recordFailedLogin(
    email: string,
    ipAddress?: string,
    reason?: string
): Promise<LockoutStatus> {
    try {
        // Record the attempt
        await pool.query(
            `INSERT INTO "failed_login_attempts" (email, "ipAddress", reason) VALUES ($1, $2, $3)`,
            [email, ipAddress || 'unknown', reason || 'Invalid credentials']
        );

        // Increment failed attempts
        const result = await pool.query(
            `UPDATE "user" 
       SET "failedLoginAttempts" = COALESCE("failedLoginAttempts", 0) + 1,
           "lastFailedLogin" = NOW()
       WHERE email = $1
       RETURNING "failedLoginAttempts"`,
            [email]
        );

        if (result.rowCount === 0) {
            return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
        }

        const attempts = result.rows[0].failedLoginAttempts;

        // Lock account if max attempts reached
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);

            await pool.query(
                `UPDATE "user" SET "lockedUntil" = $1 WHERE email = $2`,
                [lockUntil, email]
            );

            return {
                isLocked: true,
                lockedUntil: lockUntil,
                remainingAttempts: 0,
            };
        }

        return {
            isLocked: false,
            remainingAttempts: MAX_FAILED_ATTEMPTS - attempts,
        };
    } catch (error) {
        console.error('Record failed login error:', error);
        return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
    }
}

/**
 * Reset failed login attempts on successful login
 */
export async function resetFailedAttempts(email: string): Promise<void> {
    try {
        await pool.query(
            `UPDATE "user" 
       SET "failedLoginAttempts" = 0, "lockedUntil" = NULL, "lastFailedLogin" = NULL
       WHERE email = $1`,
            [email]
        );
    } catch (error) {
        console.error('Reset failed attempts error:', error);
    }
}

/**
 * Unlock an account (admin function)
 */
export async function unlockAccount(email: string): Promise<boolean> {
    try {
        await pool.query(
            `UPDATE "user" 
       SET "failedLoginAttempts" = 0, "lockedUntil" = NULL
       WHERE email = $1`,
            [email]
        );
        return true;
    } catch (error) {
        console.error('Unlock account error:', error);
        return false;
    }
}
