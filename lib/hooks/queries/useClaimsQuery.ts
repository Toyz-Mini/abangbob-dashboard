
import { useQuery } from '@tanstack/react-query';
import { fetchClaimRequests, fetchOTClaims } from '@/lib/supabase/operations';
import { ClaimRequest, OTClaim } from '@/lib/types';

export const CLAIMS_QUERY_KEY = ['claims'];
export const OT_CLAIMS_QUERY_KEY = ['ot-claims'];

interface UseClaimsQueryOptions {
    staffId?: string;
    status?: string;
}

export function useClaimsQuery(options: UseClaimsQueryOptions = {}) {
    const { staffId, status } = options;
    return useQuery({
        queryKey: [...CLAIMS_QUERY_KEY, { staffId, status }],
        queryFn: async () => {
            const data = await fetchClaimRequests(staffId, status);
            return data as ClaimRequest[];
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

export function useOTClaimsQuery() {
    return useQuery({
        queryKey: OT_CLAIMS_QUERY_KEY,
        queryFn: async () => {
            const data = await fetchOTClaims();
            // Client-side filtering if needed, or add args to fetchOTClaims in future
            return data as OTClaim[];
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}
