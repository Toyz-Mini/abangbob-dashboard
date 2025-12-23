import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function GET() {
    try {
        const result = await pool.query(
            `SELECT 
        id, name, email, phone, "icNumber", "dateOfBirth", 
        address, "emergencyContact", status, "createdAt"
       FROM "user" 
       WHERE status = 'pending_approval'
       ORDER BY "createdAt" DESC`
        );

        return NextResponse.json({
            users: result.rows,
        });
    } catch (error) {
        console.error('Error fetching pending users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pending users' },
            { status: 500 }
        );
    }
}
