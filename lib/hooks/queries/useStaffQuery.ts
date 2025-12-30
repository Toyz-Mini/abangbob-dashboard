
import { useQuery } from '@tanstack/react-query';
import { fetchStaff } from '@/lib/supabase/operations';
import { StaffProfile } from '@/lib/types';

export const STAFF_QUERY_KEY = ['staff'];

export function useStaffQuery() {
    return useQuery({
        queryKey: STAFF_QUERY_KEY,
        queryFn: async () => {
            const data = await fetchStaff();
            return data as StaffProfile[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
