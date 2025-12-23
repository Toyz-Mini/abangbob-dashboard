import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query(
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
