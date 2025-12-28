import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import {
    getLeaveResultEmailTemplate,
    getOTClaimResultEmailTemplate,
    getClaimResultEmailTemplate,
    getSalaryAdvanceResultEmailTemplate,
    getStaffRequestResultEmailTemplate,
    RequestType,
} from '@/lib/email/approval-notification-templates';
import { LeaveType, ClaimType, RequestCategory } from '@/lib/types';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[NotifyStaffResult] Missing Supabase credentials');
        return null;
    }
    return createClient(supabaseUrl, supabaseServiceKey);
}

// Request body types
interface BaseNotificationRequest {
    type: RequestType;
    staffId: string;
    staffName: string;
    isApproved: boolean;
    approverName: string;
    rejectionReason?: string;
}

interface LeaveResultRequest extends BaseNotificationRequest {
    type: 'leave';
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
}

interface OTClaimResultRequest extends BaseNotificationRequest {
    type: 'ot_claim';
    date: string;
    totalAmount: number;
}

interface ClaimResultRequest extends BaseNotificationRequest {
    type: 'claim';
    claimType: ClaimType;
    amount: number;
}

interface SalaryAdvanceResultRequest extends BaseNotificationRequest {
    type: 'salary_advance';
    amount: number;
}

interface StaffRequestResultRequest extends BaseNotificationRequest {
    type: 'staff_request';
    category: RequestCategory;
    title: string;
}

type NotifyStaffResultRequest =
    | LeaveResultRequest
    | OTClaimResultRequest
    | ClaimResultRequest
    | SalaryAdvanceResultRequest
    | StaffRequestResultRequest;

// Email subject lines
function getSubjectLine(type: RequestType, isApproved: boolean, staffName: string): string {
    const status = isApproved ? '✅ Diluluskan' : '❌ Ditolak';
    const typeLabels: Record<RequestType, string> = {
        leave: 'Permohonan Cuti',
        ot_claim: 'Tuntutan OT',
        claim: 'Tuntutan Perbelanjaan',
        salary_advance: 'Pendahuluan Gaji',
        staff_request: 'Permintaan Staff',
    };
    return `${status} - ${typeLabels[type]}`;
}

export async function POST(request: NextRequest) {
    console.log('[NotifyStaffResult] Received notification request');

    try {
        const body: NotifyStaffResultRequest = await request.json();
        const { type, staffId, staffName, isApproved, approverName, rejectionReason } = body;

        console.log('[NotifyStaffResult] Type:', type, 'Staff:', staffName, 'Approved:', isApproved);

        // Validate request
        if (!type || !staffId || !staffName || isApproved === undefined || !approverName) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get staff email from database
        const supabase = getSupabaseAdmin();
        if (!supabase) {
            console.error('[NotifyStaffResult] Supabase not available');
            return NextResponse.json(
                { success: false, error: 'Database not available' },
                { status: 500 }
            );
        }

        // Try to get email from staff table
        const { data: staffData, error: staffError } = await supabase
            .from('staff')
            .select('email')
            .eq('id', staffId)
            .single();

        if (staffError) {
            console.log('[NotifyStaffResult] Staff lookup error:', staffError);
        }

        let staffEmail = staffData?.email;

        // If not found in staff table, try user table (for users who registered via better-auth)
        if (!staffEmail) {
            const { data: userData, error: userError } = await supabase
                .from('user')
                .select('email')
                .eq('id', staffId)
                .single();

            if (userError) {
                console.log('[NotifyStaffResult] User lookup error:', userError);
            }

            staffEmail = userData?.email;
        }

        if (!staffEmail) {
            console.warn('[NotifyStaffResult] No email found for staff:', staffId);
            return NextResponse.json({
                success: true,
                message: 'No email found for staff',
                emailSent: false,
            });
        }

        console.log('[NotifyStaffResult] Staff email found:', staffEmail);

        // Generate email template based on type
        let html: string;

        switch (type) {
            case 'leave':
                const leaveBody = body as LeaveResultRequest;
                html = getLeaveResultEmailTemplate(
                    staffName,
                    isApproved,
                    approverName,
                    leaveBody.leaveType,
                    leaveBody.startDate,
                    leaveBody.endDate,
                    rejectionReason
                );
                break;

            case 'ot_claim':
                const otBody = body as OTClaimResultRequest;
                html = getOTClaimResultEmailTemplate(
                    staffName,
                    isApproved,
                    approverName,
                    otBody.date,
                    otBody.totalAmount,
                    rejectionReason
                );
                break;

            case 'claim':
                const claimBody = body as ClaimResultRequest;
                html = getClaimResultEmailTemplate(
                    staffName,
                    isApproved,
                    approverName,
                    claimBody.claimType,
                    claimBody.amount,
                    rejectionReason
                );
                break;

            case 'salary_advance':
                const advanceBody = body as SalaryAdvanceResultRequest;
                html = getSalaryAdvanceResultEmailTemplate(
                    staffName,
                    isApproved,
                    approverName,
                    advanceBody.amount,
                    rejectionReason
                );
                break;

            case 'staff_request':
                const requestBody = body as StaffRequestResultRequest;
                html = getStaffRequestResultEmailTemplate(
                    staffName,
                    isApproved,
                    approverName,
                    requestBody.category,
                    requestBody.title,
                    rejectionReason
                );
                break;

            default:
                return NextResponse.json(
                    { success: false, error: `Unknown notification type: ${type}` },
                    { status: 400 }
                );
        }

        // Send email
        const subject = getSubjectLine(type, isApproved, staffName);
        const result = await sendEmail({
            to: staffEmail,
            subject,
            html,
        });

        if (result.success) {
            console.log(`[NotifyStaffResult] ✅ Email sent to ${staffEmail}`);
            return NextResponse.json({
                success: true,
                message: 'Email sent successfully',
                emailSent: true,
            });
        } else {
            console.error(`[NotifyStaffResult] ❌ Failed to send email:`, result.error);
            return NextResponse.json({
                success: false,
                error: result.error,
                emailSent: false,
            });
        }

    } catch (error) {
        console.error('[NotifyStaffResult] Error:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
