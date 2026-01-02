import { useQuery } from '@tanstack/react-query';
import { fetchInventoryAction } from '@/lib/actions/inventory-actions';
import { StockItem } from '@/lib/types';

export const INVENTORY_QUERY_KEY = ['inventory'];

export function useInventoryQuery() {
    return useQuery({
        queryKey: INVENTORY_QUERY_KEY,
        queryFn: async () => {
            const data = await fetchInventoryAction();
            return data as StockItem[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
