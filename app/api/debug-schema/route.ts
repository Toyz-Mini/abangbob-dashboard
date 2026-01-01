import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            // Check 'user' table schema
            const res = await client.query(`
                SELECT table_name, column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name IN ('user', 'session') AND column_name = 'id'
            `);

            return NextResponse.json({
                success: true,
                schema: res.rows
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
