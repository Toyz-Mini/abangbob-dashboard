/**
 * Utility functions to send approval notification emails
 * These are called from store.tsx when staff submit requests
 */

import { LeaveType, ClaimType, RequestCategory } from './types';

// Types for notification payloads
export interface LeaveNotificationPayload {
    staffName: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    duration: number;
    reason: string;
    isHalfDay?: boolean;
}

export interface OTClaimNotificationPayload {
    staffName: string;
    date: string;
    startTime: string;
    endTime: string;
    hoursWorked: number;
    totalAmount: number;
    reason: string;
}

export interface ClaimNotificationPayload {
    staffName: string;
    claimType: ClaimType;
    amount: number;
    description: string;
    claimDate: string;
}

export interface SalaryAdvanceNotificationPayload {
    staffName: string;
    amount: number;
    reason: string;
}

export interface StaffRequestNotificationPayload {
    staffName: string;
    category: RequestCategory;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
}

type NotificationType = 'leave' | 'ot_claim' | 'claim' | 'salary_advance' | 'staff_request';

type NotificationPayload =
    | LeaveNotificationPayload
    | OTClaimNotificationPayload
    | ClaimNotificationPayload
    | SalaryAdvanceNotificationPayload
    | StaffRequestNotificationPayload;

/**
 * Send approval notification email to all managers and admins
 * This is a fire-and-forget function - errors are logged but don't block the main flow
 */
async function sendApprovalNotification(type: NotificationType, payload: NotificationPayload): Promise<void> {
    try {
        const response = await fetch('/api/notify-approval', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                staffName: payload.staffName,
                details: payload,
            }),
        });

        const result = await response.json();

        if (result.success) {
            console.log(`[ApprovalNotification] ✅ ${type} notification sent to ${result.emailsSent} approvers`);
        } else {
            console.warn(`[ApprovalNotification] ⚠️ ${type} notification failed:`, result.error);
        }
    } catch (error) {
        // Don't throw - just log. We don't want notification failures to break the main flow
        console.error(`[ApprovalNotification] ❌ Failed to send ${type} notification:`, error);
    }
}

/**
 * Send notification for new leave request
 */
export function notifyLeaveRequest(payload: LeaveNotificationPayload): void {
    sendApprovalNotification('leave', payload);
}

/**
 * Send notification for new OT claim
 */
export function notifyOTClaim(payload: OTClaimNotificationPayload): void {
    sendApprovalNotification('ot_claim', payload);
}

/**
 * Send notification for new expense claim
 */
export function notifyClaimRequest(payload: ClaimNotificationPayload): void {
    sendApprovalNotification('claim', payload);
}

/**
 * Send notification for new salary advance request
 */
export function notifySalaryAdvance(payload: SalaryAdvanceNotificationPayload): void {
    sendApprovalNotification('salary_advance', payload);
}

/**
 * Send notification for new staff request (shift swap, etc)
 */
export function notifyStaffRequest(payload: StaffRequestNotificationPayload): void {
    sendApprovalNotification('staff_request', payload);
}

// ==================== STAFF RESULT NOTIFICATIONS ====================
// These are sent to staff when their requests are approved or rejected

type ResultNotificationType = 'leave' | 'ot_claim' | 'claim' | 'salary_advance' | 'staff_request';

interface BaseResultPayload {
    staffId: string;
    staffName: string;
    isApproved: boolean;
    approverName: string;
    rejectionReason?: string;
}

export interface LeaveResultPayload extends BaseResultPayload {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
}

export interface OTClaimResultPayload extends BaseResultPayload {
    date: string;
    totalAmount: number;
}

export interface ClaimResultPayload extends BaseResultPayload {
    claimType: ClaimType;
    amount: number;
}

export interface SalaryAdvanceResultPayload extends BaseResultPayload {
    amount: number;
}

export interface StaffRequestResultPayload extends BaseResultPayload {
    category: RequestCategory;
    title: string;
}

/**
 * Send result notification email to staff
 * This is a fire-and-forget function - errors are logged but don't block the main flow
 */
async function sendStaffResultNotification(type: ResultNotificationType, payload: object): Promise<void> {
    try {
        const response = await fetch('/api/notify-staff-result', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                ...payload,
            }),
        });

        const result = await response.json();

        if (result.success && result.emailSent) {
            console.log(`[StaffResultNotification] ✅ ${type} result notification sent to staff`);
        } else if (result.success) {
            console.log(`[StaffResultNotification] ⚠️ ${type} result: ${result.message}`);
        } else {
            console.warn(`[StaffResultNotification] ⚠️ ${type} result notification failed:`, result.error);
        }
    } catch (error) {
        // Don't throw - just log. We don't want notification failures to break the main flow
        console.error(`[StaffResultNotification] ❌ Failed to send ${type} result notification:`, error);
    }
}

/**
 * Notify staff about leave request result
 */
export function notifyLeaveResult(payload: LeaveResultPayload): void {
    sendStaffResultNotification('leave', payload);
}

/**
 * Notify staff about OT claim result
 */
export function notifyOTClaimResult(payload: OTClaimResultPayload): void {
    sendStaffResultNotification('ot_claim', payload);
}

/**
 * Notify staff about expense claim result
 */
export function notifyClaimResult(payload: ClaimResultPayload): void {
    sendStaffResultNotification('claim', payload);
}

/**
 * Notify staff about salary advance result
 */
export function notifySalaryAdvanceResult(payload: SalaryAdvanceResultPayload): void {
    sendStaffResultNotification('salary_advance', payload);
}

/**
 * Notify staff about staff request result (shift swap, etc)
 */
export function notifyStaffRequestResult(payload: StaffRequestResultPayload): void {
    sendStaffResultNotification('staff_request', payload);
}
