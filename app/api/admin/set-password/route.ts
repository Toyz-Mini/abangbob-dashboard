import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

// Simple password hashing (consistent with reset-password API)
function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email dan password diperlukan' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password mestilah sekurang-kurangnya 8 aksara' },
                { status: 400 }
            );
        }

        // Check if user exists
        const userResult = await query(
            `SELECT id FROM "user" WHERE email = $1`,
            [email]
        );

        if (userResult.rowCount === 0) {
            return NextResponse.json(
                { error: 'User dengan email ini tidak wujud' },
                { status: 404 }
            );
        }

        const userId = userResult.rows[0].id;
        const hashedPassword = hashPassword(password);

        // Check if credential account exists
        const accountResult = await query(
            `SELECT id FROM "account" WHERE "userId" = $1 AND "providerId" = 'credential'`,
            [userId]
        );

        if (accountResult.rowCount === 0) {
            // Create new credential account
            const accountId = crypto.randomUUID();
            await query(
                `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
                 VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
                [accountId, email, userId, hashedPassword]
            );
        } else {
            // Update existing account password
            await query(
                `UPDATE "account" 
                 SET password = $1, "updatedAt" = NOW()
                 WHERE "userId" = $2 AND "providerId" = 'credential'`,
                [hashedPassword, userId]
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password berjaya ditetapkan',
        });
    } catch (error) {
        console.error('Set password error:', error);
        return NextResponse.json(
            { error: 'Ralat berlaku semasa menetapkan password' },
            { status: 500 }
        );
    }
}
