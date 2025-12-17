// Supabase Realtime Integration
// Subscribe to database changes in real-time

import { useEffect } from 'react';
import { getSupabaseClient } from './client';
import { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeChangeHandler<T = any> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  errors: null | string;
}) => void;

/**
 * Hook to subscribe to Supabase realtime changes
 * @param table - Table name to subscribe to
 * @param onChangeHandler - Callback when data changes
 * @returns cleanup function
 */
export function useSupabaseRealtime<T = any>(
  table: string,
  onChangeHandler: RealtimeChangeHandler<T>
) {
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase not configured, realtime disabled');
      return;
    }

    // Create channel subscription
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: table,
        },
        (payload: any) => {
          onChangeHandler({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            errors: payload.errors || null,
          });
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onChangeHandler]);
}

/**
 * Subscribe to multiple tables
 */
export function useSupabaseRealtimeMultiple(
  subscriptions: Array<{ table: string; handler: RealtimeChangeHandler }>
) {
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channels: RealtimeChannel[] = [];

    subscriptions.forEach(({ table, handler }) => {
      const channel = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload: any) => {
          handler({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            errors: payload.errors || null,
          });
        })
        .subscribe();

      channels.push(channel);
    });

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [subscriptions]);
}

/**
 * Subscribe to orders table changes (for KDS/POS sync)
 */
export function useOrdersRealtime(onOrderChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('orders', onOrderChange);
}

/**
 * Subscribe to inventory table changes (for stock sync)
 */
export function useInventoryRealtime(onInventoryChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('inventory', onInventoryChange);
}

/**
 * Subscribe to staff table changes (for profile updates)
 */
export function useStaffRealtime(onStaffChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('staff', onStaffChange);
}

/**
 * Subscribe to attendance table changes (for clock in/out sync)
 */
export function useAttendanceRealtime(onAttendanceChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('attendance', onAttendanceChange);
}

/**
 * Subscribe to menu_items table changes (for POS/menu sync)
 */
export function useMenuRealtime(onMenuChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('menu_items', onMenuChange);
}

/**
 * Subscribe to modifier options table changes
 */
export function useModifiersRealtime(onModifierChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('modifier_options', onModifierChange);
}

/**
 * Subscribe to schedules table changes
 */
export function useSchedulesRealtime(onScheduleChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('schedules', onScheduleChange);
}

/**
 * Subscribe to void_refund_requests table changes (for refund sync across devices)
 */
export function useVoidRefundRealtime(onVoidRefundChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('void_refund_requests', onVoidRefundChange);
}

/**
 * Subscribe to leave_requests table changes
 */
export function useLeaveRequestsRealtime(onLeaveChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('leave_requests', onLeaveChange);
}

/**
 * Subscribe to claim_requests table changes
 */
export function useClaimRequestsRealtime(onClaimChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('claim_requests', onClaimChange);
}

/**
 * Subscribe to staff_requests table changes
 */
export function useStaffRequestsRealtime(onStaffRequestChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('staff_requests', onStaffRequestChange);
}

/**
 * Subscribe to promotions table changes
 */
export function usePromotionsRealtime(onPromotionChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('promotions', onPromotionChange);
}

/**
 * Subscribe to expenses table changes
 */
export function useExpensesRealtime(onExpenseChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('expenses', onExpenseChange);
}

/**
 * Subscribe to cash_flows table changes
 */
export function useCashFlowsRealtime(onCashFlowChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('cash_flows', onCashFlowChange);
}

/**
 * Subscribe to notifications table changes
 */
export function useNotificationsRealtime(onNotificationChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('notifications', onNotificationChange);
}

/**
 * Subscribe to announcements table changes
 */
export function useAnnouncementsRealtime(onAnnouncementChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('announcements', onAnnouncementChange);
}

/**
 * Subscribe to checklist_completions table changes
 */
export function useChecklistRealtime(onChecklistChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('checklist_completions', onChecklistChange);
}

/**
 * Subscribe to customers table changes
 */
export function useCustomersRealtime(onCustomerChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('customers', onCustomerChange);
}

/**
 * Subscribe to suppliers table changes
 */
export function useSuppliersRealtime(onSupplierChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('suppliers', onSupplierChange);
}

/**
 * Subscribe to delivery_orders table changes
 */
export function useDeliveryOrdersRealtime(onDeliveryChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('delivery_orders', onDeliveryChange);
}

/**
 * Subscribe to recipes table changes
 */
export function useRecipesRealtime(onRecipeChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('recipes', onRecipeChange);
}

/**
 * Subscribe to menu_categories table changes
 */
export function useMenuCategoriesRealtime(onCategoryChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('menu_categories', onCategoryChange);
}

/**
 * Subscribe to payment_methods table changes
 */
export function usePaymentMethodsRealtime(onPaymentMethodChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('payment_methods', onPaymentMethodChange);
}

/**
 * Subscribe to tax_rates table changes
 */
export function useTaxRatesRealtime(onTaxRateChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('tax_rates', onTaxRateChange);
}

/**
 * Subscribe to production_logs table changes
 */
export function useProductionLogsRealtime(onProductionLogChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('production_logs', onProductionLogChange);
}

/**
 * Subscribe to oil_trackers table changes
 */
export function useOilTrackersRealtime(onOilTrackerChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('oil_trackers', onOilTrackerChange);
}

/**
 * Subscribe to purchase_orders table changes
 */
export function usePurchaseOrdersRealtime(onPurchaseOrderChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('purchase_orders', onPurchaseOrderChange);
}

/**
 * Subscribe to modifier_groups table changes
 */
export function useModifierGroupsRealtime(onModifierGroupChange: RealtimeChangeHandler) {
  return useSupabaseRealtime('modifier_groups', onModifierGroupChange);
}

/**
 * Check if realtime is enabled and working
 */
export async function testRealtimeConnection(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    // Try to create a test channel
    const channel = supabase.channel('test-connection');
    await channel.subscribe();
    await supabase.removeChannel(channel);
    return true;
  } catch (error) {
    console.error('Realtime connection test failed:', error);
    return false;
  }
}
