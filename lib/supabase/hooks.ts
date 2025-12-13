'use client';

// Supabase React Hooks
// Custom hooks for Supabase operations with real-time subscriptions

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from './client';
import type { Database, Tables } from './types';
import type { RealtimeChannel, User, Session } from '@supabase/supabase-js';

// Hook for authentication state
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
}

// Generic hook for real-time table subscriptions
export function useRealtimeTable<T extends keyof Database['public']['Tables']>(
  tableName: T,
  options?: {
    filter?: { column: string; value: string | number };
    enabled?: boolean;
  }
) {
  type TableRow = Tables<T>;
  const [data, setData] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { filter, enabled = true } = options || {};

  const fetchData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !enabled) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from(tableName).select('*');
      
      if (filter) {
        query = query.eq(filter.column as string, filter.value as never);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;
      setData((result as unknown as TableRow[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [tableName, filter, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up real-time subscription
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !enabled) return;

    let channel: RealtimeChannel;

    const setupSubscription = () => {
      channel = supabase
        .channel(`${tableName}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setData(prev => [...prev, payload.new as TableRow]);
            } else if (payload.eventType === 'UPDATE') {
              setData(prev => 
                prev.map(item => 
                  (item as Record<string, unknown>)['id'] === (payload.new as Record<string, unknown>)['id']
                    ? payload.new as TableRow
                    : item
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setData(prev => 
                prev.filter(item => 
                  (item as Record<string, unknown>)['id'] !== (payload.old as Record<string, unknown>)['id']
                )
              );
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [tableName, enabled]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for single record with real-time updates
export function useRealtimeRecord<T extends keyof Database['public']['Tables']>(
  tableName: T,
  id: string | null,
  options?: { enabled?: boolean }
) {
  type TableRow = Tables<T>;
  const [data, setData] = useState<TableRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { enabled = true } = options || {};

  const fetchData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !id || !enabled) {
      setLoading(false);
      return;
    }

    try {
      const { data: result, error: queryError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id' as string, id as never)
        .single();

      if (queryError) throw queryError;
      setData(result as unknown as TableRow);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [tableName, id, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription for single record
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !id || !enabled) return;

    const channel = supabase
      .channel(`${tableName}_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setData(payload.new as TableRow);
          } else if (payload.eventType === 'DELETE') {
            setData(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, id, enabled]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for orders with real-time updates
export function useRealtimeOrders(options?: { 
  status?: string; 
  date?: string;
  outlet_id?: string;
}) {
  const { status, date, outlet_id } = options || {};
  
  const [orders, setOrders] = useState<Tables<'orders'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }
      if (date) {
        query = query.gte('created_at', `${date}T00:00:00`).lt('created_at', `${date}T23:59:59`);
      }
      if (outlet_id) {
        query = query.eq('outlet_id', outlet_id);
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [status, date, outlet_id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time subscription for orders
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Tables<'orders'>, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev =>
              prev.map(order =>
                order.id === (payload.new as Tables<'orders'>).id
                  ? (payload.new as Tables<'orders'>)
                  : order
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev =>
              prev.filter(order => order.id !== (payload.old as Tables<'orders'>).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { orders, loading, error, refetch: fetchOrders };
}

// Hook for inventory with low stock alerts
export function useInventoryWithAlerts(options?: { outlet_id?: string }) {
  const { outlet_id } = options || {};
  
  const [inventory, setInventory] = useState<Tables<'inventory'>[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Tables<'inventory'>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from('inventory').select('*');
      if (outlet_id) {
        query = query.eq('outlet_id' as string, outlet_id as never);
      }

      const { data, error } = await query;
      if (error) throw error;

      const items = (data || []) as unknown as Tables<'inventory'>[];
      setInventory(items);
      setLowStockItems(items.filter(item => item.current_quantity <= item.min_quantity));
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [outlet_id]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Real-time subscription
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('inventory_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        () => {
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInventory]);

  return { inventory, lowStockItems, loading, refetch: fetchInventory };
}

// Check if Supabase is configured
export function useSupabaseStatus() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    setIsConfigured(supabase !== null);

    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isConfigured, isOnline };
}

