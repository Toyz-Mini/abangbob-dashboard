
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    insertClaimRequest, updateClaimRequest,
    insertOTClaim, updateOTClaim
} from '@/lib/supabase/operations';
import { ClaimRequest, OTClaim } from '@/lib/types';
import { CLAIMS_QUERY_KEY, OT_CLAIMS_QUERY_KEY } from '../queries/useClaimsQuery';
import { useToast } from '@/lib/contexts/ToastContext';

// General Claims
export function useSubmitClaimMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (request: any) => {
            return await insertClaimRequest(request);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLAIMS_QUERY_KEY });
            showToast('Tuntutan berjaya dihantar', 'success');
        },
        onError: (error: any) => {
            showToast(`Gagal menghantar tuntutan: ${error.message}`, 'error');
        }
    });
}

export function useUpdateClaimMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
            return await updateClaimRequest(id, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLAIMS_QUERY_KEY });
            showToast('Tuntutan berjaya dikemaskini', 'success');
        },
        onError: (error: any) => {
            showToast(`Gagal mengemaskini tuntutan: ${error.message}`, 'error');
        }
    });
}

// OT Claims
export function useSubmitOTClaimMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (request: any) => {
            return await insertOTClaim(request);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: OT_CLAIMS_QUERY_KEY });
            showToast('Tuntutan OT berjaya dihantar', 'success');
        },
        onError: (error: any) => {
            showToast(`Gagal menghantar tuntutan OT: ${error.message}`, 'error');
        }
    });
}

export function useUpdateOTClaimMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
            return await updateOTClaim(id, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: OT_CLAIMS_QUERY_KEY });
            showToast('Tuntutan OT berjaya dikemaskini', 'success');
        },
        onError: (error: any) => {
            showToast(`Gagal mengemaskini tuntutan OT: ${error.message}`, 'error');
        }
    });
}
