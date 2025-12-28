import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import {
    getLeaveApprovalEmailTemplate,
    getOTClaimApprovalEmailTemplate,
    getClaimApprovalEmailTemplate,
    getSalaryAdvanceApprovalEmailTemplate,
    getStaffRequestApprovalEmailTemplate,
    LeaveApprovalEmailParams,
    OTClaimApprovalEmailParams,
    ClaimApprovalEmailParams,
    SalaryAdvanceApprovalEmailParams,
    StaffRequestApprovalEmailParams,
} from '@/lib/email/approval-notification-templates';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[NotifyApproval] Missing Supabase credentials');
        return null;
    }
    return createClient(supabaseUrl, supabaseServiceKey);
}

// Request types
type NotificationType = 'leave' | 'ot_claim' | 'claim' | 'salary_advance' | 'staff_request';

interface NotifyApprovalRequest {
    type: NotificationType;
    staffName: string;
    details: LeaveApprovalEmailParams | OTClaimApprovalEmailParams | ClaimApprovalEmailParams | SalaryAdvanceApprovalEmailParams | StaffRequestApprovalEmailParams;
}

// Email subject lines
const subjectLines: Record<NotificationType, string> = {
    leave: '🏖️ Permohonan Cuti Baru - Perlu Kelulusan',
    ot_claim: '⏰ Tuntutan OT Baru - Perlu Kelulusan',
    claim: '💰 Tuntutan Perbelanjaan Baru - Perlu Kelulusan',
    salary_advance: '💵 Permohonan Pendahuluan Gaji - Perlu Kelulusan',
    staff_request: '📝 Permintaan Staff Baru - Perlu Tindakan',
};

export async function POST(request: NextRequest) {
    console.log('[NotifyApproval] Received notification request');

    try {
        const body: NotifyApprovalRequest = await request.json();
        const { type, staffName, details } = body;

        console.log('[NotifyApproval] Type:', type, 'Staff:', staffName);

        // Validate request
        if (!type || !staffName || !details) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get Supabase client
        const supabase = getSupabaseAdmin();
        if (!supabase) {
            console.error('[NotifyApproval] Supabase not available');
            return NextResponse.json(
                { success: false, error: 'Database not available' },
                { status: 500 }
            );
        }

        // Get all staff with Manager role (from staff table)
        const { data: managers, error: managersError } = await supabase
            .from('staff')
            .select('id, name, email')
            .eq('role', 'Manager')
            .eq('status', 'active')
            .not('email', 'is', null);

        if (managersError) {
            console.error('[NotifyApproval] Error fetching managers:', managersError);
        }

        // Get admin users (from user table - better-auth)
        const { data: admins, error: adminsError } = await supabase
            .from('user')
            .select('id, name, email')
            .eq('role', 'admin')
            .eq('emailVerified', true);

        if (adminsError) {
            console.error('[NotifyApproval] Error fetching admins:', adminsError);
        }

        // Combine and dedupe approvers
        const approversMap = new Map<string, { name: string; email: string }>();

        // Add managers
        if (managers) {
            for (const m of managers) {
                if (m.email) {
                    approversMap.set(m.email.toLowerCase(), { name: m.name, email: m.email });
                }
            }
        }

        // Add admins
        if (admins) {
            for (const a of admins) {
                if (a.email) {
                    approversMap.set(a.email.toLowerCase(), { name: a.name || 'Admin', email: a.email });
                }
            }
        }

        const approvers = Array.from(approversMap.values());

        console.log('[NotifyApproval] Found approvers:', approvers.length);

        if (approvers.length === 0) {
            console.warn('[NotifyApproval] No approvers found to notify');
            return NextResponse.json({
                success: true,
                message: 'No approvers found to notify',
                emailsSent: 0,
            });
        }

        // Generate email template based on type
        const results: { email: string; success: boolean; error?: string }[] = [];

        for (const approver of approvers) {
            let html: string;

            try {
                switch (type) {
                    case 'leave':
                        html = getLeaveApprovalEmailTemplate({
                            ...details as LeaveApprovalEmailParams,
                            approverName: approver.name,
                        });
                        break;
                    case 'ot_claim':
                        html = getOTClaimApprovalEmailTemplate({
                            ...details as OTClaimApprovalEmailParams,
                            approverName: approver.name,
                        });
                        break;
                    case 'claim':
                        html = getClaimApprovalEmailTemplate({
                            ...details as ClaimApprovalEmailParams,
                            approverName: approver.name,
                        });
                        break;
                    case 'salary_advance':
                        html = getSalaryAdvanceApprovalEmailTemplate({
                            ...details as SalaryAdvanceApprovalEmailParams,
                            approverName: approver.name,
                        });
                        break;
                    case 'staff_request':
                        html = getStaffRequestApprovalEmailTemplate({
                            ...details as StaffRequestApprovalEmailParams,
                            approverName: approver.name,
                        });
                        break;
                    default:
                        throw new Error(`Unknown notification type: ${type}`);
                }

                // Send email
                const result = await sendEmail({
                    to: approver.email,
                    subject: `${subjectLines[type]} - ${staffName}`,
                    html,
                });

                results.push({
                    email: approver.email,
                    success: result.success,
                    error: result.error ? String(result.error) : undefined,
                });

                console.log(`[NotifyApproval] Email to ${approver.email}:`, result.success ? 'SUCCESS' : 'FAILED');

            } catch (emailError) {
                console.error(`[NotifyApproval] Failed to send to ${approver.email}:`, emailError);
                results.push({
                    email: approver.email,
                    success: false,
                    error: String(emailError),
                });
            }
        }

        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            success: true,
            message: `Sent ${successCount} of ${approvers.length} notification emails`,
            emailsSent: successCount,
            results,
        });

    } catch (error) {
        console.error('[NotifyApproval] Error:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
