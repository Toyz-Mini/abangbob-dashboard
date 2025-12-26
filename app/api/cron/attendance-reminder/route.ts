import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Cron Job: Attendance Reminder & Auto Clock-Out
 * 
 * Runs daily at 11:00 PM Brunei time (via Vercel Cron or external scheduler)
 * 
 * Actions:
 * 1. Auto clock-out staff who forgot to clock out
 * 2. Log the auto clock-out in notes
 * 3. (Future) Send WhatsApp/notification reminder
 */

// This endpoint should be protected with a cron secret
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        // Find all attendance records for today without clock_out
        const { data: openRecords, error: fetchError } = await supabase
            .from('attendance')
            .select('id, staff_id, clock_in, notes')
            .eq('date', today)
            .is('clock_out', null);

        if (fetchError) {
            console.error('[Cron] Error fetching open records:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!openRecords || openRecords.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No open attendance records found',
                processed: 0,
            });
        }

        // Auto clock-out each record
        const results = [];
        for (const record of openRecords) {
            const currentNotes = record.notes ? `${record.notes}\n` : '';
            const autoClockOutNote = `[AUTO CLOCK-OUT] Sistem auto clock-out pada ${now}. Staff lupa clock out.`;

            const { error: updateError } = await supabase
                .from('attendance')
                .update({
                    clock_out: now,
                    notes: `${currentNotes}${autoClockOutNote}`,
                    clock_in_method: 'auto', // Mark as auto
                })
                .eq('id', record.id);

            if (updateError) {
                console.error(`[Cron] Error updating record ${record.id}:`, updateError);
                results.push({ id: record.id, success: false, error: updateError.message });
            } else {
                results.push({ id: record.id, success: true });

                // TODO: Send notification (WhatsApp/Push)
                // await sendForgotClockOutNotification(record.staff_id);
            }
        }

        // Log summary
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        console.log(`[Cron] Auto clock-out complete: ${successCount} success, ${failCount} failed`);

        return NextResponse.json({
            success: true,
            processed: openRecords.length,
            successCount,
            failCount,
            results,
            timestamp: now,
        });

    } catch (error: any) {
        console.error('[Cron] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Also allow POST for external schedulers
export async function POST(request: Request) {
    return GET(request);
}
