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
