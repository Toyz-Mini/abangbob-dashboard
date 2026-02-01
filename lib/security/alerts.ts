// Security Alerts Module
// Send email notifications for suspicious activities

import { Pool } from 'pg';
import { createAuditLog, AuditAction } from '../audit-log';

export interface AlertConfig {
  emailEnabled: boolean;
  alertOnFailedLogins: boolean;
  alertOnMultipleFailedLogins: boolean;
  alertOnSuspiciousActivity: boolean;
}

export const ALERT_CONFIG: AlertConfig = {
  emailEnabled: true,              // Email only as per your configuration
  alertOnFailedLogins: true,
  alertOnMultipleFailedLogins: true,
  alertOnSuspiciousActivity: true
};

/**
 * Send security alert via email
 */
export async function sendSecurityAlert(
  action: AuditAction,
  details: {
    userId?: string;
    ipAddress?: string;
    alertType?: string;
  } = {}
): Promise<void> {
  try {
    // In production, integrate with email service
    console.warn('[Alerts] Security alert triggered:', action, details);

    // Log the alert
    await createAuditLog({
      userId: details.userId,
      action,
      resource: 'Security Alert',
      details: {
        alertType: details.alertType,
        ...details
      }
    });
  } catch (error) {
    console.error('[Alerts] Error sending security alert:', error);
    // Don't throw - alerts should not break main flows
  }
}

/**
 * Check if alert is enabled for specific type
 */
export function isAlertEnabled(alertType?: string): boolean {
  if (!ALERT_CONFIG.emailEnabled) return false;

  switch (alertType) {
    case 'FAILED_LOGIN':
      return ALERT_CONFIG.alertOnFailedLogins;
    case 'MULTIPLE_FAILED_LOGINS':
      return ALERT_CONFIG.alertOnMultipleFailedLogins;
    case 'SUSPICIOUS_ACTIVITY':
      return ALERT_CONFIG.alertOnSuspiciousActivity;
    default:
      return false;
  }
}

/**
 * Check if user should be alerted (rate limit)
 */
export function shouldAlertOnRateLimit(identifier: string, failedCount: number): boolean {
  return isAlertEnabled('RATE_LIMIT') && failedCount >= 3;
}

/**
 * Check if user should be locked out
 */
export function shouldLockoutAccount(failedCount: number): boolean {
  return failedCount >= 5;
}
