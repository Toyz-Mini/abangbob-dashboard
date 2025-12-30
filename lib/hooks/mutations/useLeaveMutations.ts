
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertLeaveRequest, updateLeaveRequest, upsertLeaveBalance } from '@/lib/supabase/operations';
import { LeaveRequest } from '@/lib/types';
import { LEAVE_REQUESTS_QUERY_KEY } from '../queries/useLeaveQuery';
import { useToast } from '@/lib/contexts/ToastContext';

export function useSubmitLeaveRequestMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (request: any) => {
            return await insertLeaveRequest(request);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LEAVE_REQUESTS_QUERY_KEY });
            showToast('Permohonan cuti berjaya dihantar', 'success');
        },
        onError: (error: any) => {
            showToast(`Gagal menghantar permohonan: ${error.message}`, 'error');
        }
    });
}

export function useUpdateLeaveRequestMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
            return await updateLeaveRequest(id, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LEAVE_REQUESTS_QUERY_KEY });
            showToast('Permohonan cuti berjaya dikemaskini', 'success');
        },
        onError: (error: any) => {
            showToast(`Gagal mengemaskini permohonan: ${error.message}`, 'error');
        }
    });
}
