
import { useQuery } from '@tanstack/react-query';
import { fetchLeaveRequests } from '@/lib/supabase/operations';
import { LeaveRequest } from '@/lib/types';

export const LEAVE_REQUESTS_QUERY_KEY = ['leave-requests'];

interface UseLeaveRequestsQueryOptions {
    staffId?: string;
    status?: string;
}

export function useLeaveRequestsQuery(options: UseLeaveRequestsQueryOptions = {}) {
    const { staffId, status } = options;
    return useQuery({
        queryKey: [...LEAVE_REQUESTS_QUERY_KEY, { staffId, status }],
        queryFn: async () => {
            const data = await fetchLeaveRequests(staffId, status);
            return data as LeaveRequest[];
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}
