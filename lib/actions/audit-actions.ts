'use server';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getServerSession } from '@/lib/supabase/server-auth';
import { AuditLog } from '@/lib/audit-data';

export async function fetchAuditLogsAction(
    filters?: {
        search?: string;
        action?: string;
        module?: string;
        date?: string;
        limit?: number;
        offset?: number;
    }
) {
    try {
        const { requireRole } = await import('@/lib/supabase/server-auth');
        // Only Admin/Manager should see audit logs
        await requireRole(['admin', 'manager']);

        const supabase = getSupabaseAdmin();
        // Cast to any to bypass missing type definition for new table
        let query = (supabase.from('audit_logs') as any)
            .select('*', { count: 'exact' })
            .order('timestamp', { ascending: false });

        if (filters?.search) {
            query = query.or(`details.ilike.%${filters.search}%,user_name.ilike.%${filters.search}%`);
        }

        if (filters?.action && filters.action !== 'all') {
            query = query.eq('action', filters.action);
        }

        if (filters?.module && filters.module !== 'all') {
            query = query.eq('module', filters.module);
        }

        if (filters?.date) {
            // Filter by date (ignoring time)
            const nextDate = new Date(filters.date);
            nextDate.setDate(nextDate.getDate() + 1);
            query = query.gte('timestamp', filters.date).lt('timestamp', nextDate.toISOString().split('T')[0]);
        }

        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        if (filters?.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('[fetchAuditLogsAction] Supabase error:', error);
            throw new Error(error.message);
        }

        // Map DB fields to frontend format if necessary (snake_case to camelCase)
        const mappedData = data?.map((item: any) => ({
            id: item.id,
            timestamp: item.timestamp,
            userName: item.user_name,
            userId: item.user_id,
            action: item.action,
            module: item.module,
            details: item.details,
            ipAddress: item.ip_address,
            metadata: item.metadata
        }));

        return { logs: mappedData as AuditLog[], total: count || 0 };

    } catch (error) {
        console.error('[fetchAuditLogsAction] Error:', error);
        throw error;
    }
}

export async function logAuditAction(
    entry: {
        action: string;
        module: string;
        details: string;
        metadata?: any;
    }
) {
    try {
        const { getServerSession } = await import('@/lib/supabase/server-auth');
        const session = await getServerSession();
        const user = session?.user;

        const supabase = getSupabaseAdmin();

        // Get user name if available (from metadata or fetch from staff table)
        let userName = 'System';
        if (user) {
            userName = user.name || user.email || 'Unknown User';
        }

        const { error } = await (supabase.from('audit_logs') as any).insert({
            user_id: user?.id || null,
            user_name: userName,
            action: entry.action,
            module: entry.module,
            details: entry.details,
            ip_address: null, // Hard to get IP in server action reliably without headers
            metadata: entry.metadata || {}
        });

        if (error) {
            console.error('[logAuditAction] Insert failed:', error);
        }

    } catch (error) {
        console.error('[logAuditAction] Failed:', error);
        // Don't throw, just log error so we don't block the main action
    }
}
