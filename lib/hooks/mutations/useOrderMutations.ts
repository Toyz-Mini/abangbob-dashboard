import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Order } from '@/lib/types';
import toast from 'react-hot-toast';

export const orderKeys = {
    all: ['orders'] as const,
    lists: () => [...orderKeys.all, 'list'] as const,
    detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

export function useCreateOrderMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newOrder: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            // Add default fields
            const orderData = {
                ...newOrder,
                status: 'pending',
                items: newOrder.items || [], // ensure items is present
            };

            const { data, error } = await supabase
                .from('orders')
                .insert(orderData)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            toast.success('Pesanan berjaya dihantar!');
        },
        onError: (error: Error) => {
            toast.error(`Gagal menghantar pesanan: ${error.message}`);
        },
    });
}
