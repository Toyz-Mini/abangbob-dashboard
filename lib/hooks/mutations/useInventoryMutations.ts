
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    insertInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
} from '@/lib/supabase/operations';
import { StockItem } from '@/lib/types';
import { INVENTORY_QUERY_KEY } from '../queries/useInventoryQuery';
import { useToast } from '@/lib/contexts/ToastContext';

import {
    addInventoryItemAction,
    updateInventoryItemAction,
    deleteInventoryItemAction
} from '@/lib/actions/inventory-actions';

export function useAddInventoryItemMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (item: Omit<StockItem, 'id'>) => {
            // Use Server Action instead of client-side Supabase call
            return await addInventoryItemAction(item);
        },
        onSuccess: (data) => {
            // Optimistically update or invalidate
            queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY });
            showToast(`Item ditambah: ${data.name}`, 'success');
        },
        onError: (error: any) => {
            console.error('Add Item Failed:', error);
            showToast(`Gagal menambah item: ${error.message}`, 'error');
        }
    });
}

export function useUpdateInventoryItemMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<StockItem> }) => {
            return await updateInventoryItemAction(id, updates);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY });
            showToast(`Item dikemaskini: ${data.name}`, 'success');
        },
        onError: (error: any) => {
            showToast(`Gagal mengemaskini item: ${error.message}`, 'error');
        }
    });
}

export function useDeleteInventoryItemMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            await deleteInventoryItemAction(id);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY });
            showToast('Item telah dipadam', 'success');
        },
        onError: (error: any) => {
            showToast(`Gagal memadam item: ${error.message}`, 'error');
        }
    });
}
