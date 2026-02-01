export type NotificationType =
    | 'ORDER_CONFIRMED'
    | 'LOW_STOCK_ALERT'
    | 'DAILY_SALES_REPORT'
    | 'ORDER_READY'
    | 'SYSTEM_ALERT';

export interface NotificationPayload {
    to?: string;
    data?: any;
    priority?: 'high' | 'normal' | 'low';
}

/**
 * Dispatches a notification to the appropriate channel (WhatsApp, Email, SMS)
 * based on the notification type and configuration.
 */
export async function triggerNotification(
    type: NotificationType,
    payload: NotificationPayload
): Promise<{ success: boolean; id?: string; error?: any }> {
    console.log(`[Notification Dispatcher] Triggering ${type}`, payload);

    // TODO: Implement actual notification logic
    // This is currently a stub to satisfy build requirements

    return { success: true, id: `stub-${Date.now()}` };
}
