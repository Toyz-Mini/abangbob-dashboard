
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    insertInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
} from '@/lib/supabase/operations';
import { StockItem } from '@/lib/types';
import { INVENTORY_QUERY_KEY } from '../queries/useInventoryQuery';
import { useToast } from '@/lib/contexts/ToastContext';

export function useAddInventoryItemMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (item: Omit<StockItem, 'id'>) => {
            return await insertInventoryItem(item);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY });
            showToast(`Item ditambah: ${data.name}`, 'success');
        },
        onError: (error: any) => {
            showToast(`Gagal menambah item: ${error.message}`, 'error');
        }
    });
}

export function useUpdateInventoryItemMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<StockItem> }) => {
            return await updateInventoryItem(id, updates);
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
            await deleteInventoryItem(id);
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
