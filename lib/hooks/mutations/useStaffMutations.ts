
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertStaff, updateStaff, deleteStaff } from '@/lib/supabase/operations';
import { StaffProfile } from '@/lib/types';
import { STAFF_QUERY_KEY } from '../queries/useStaffQuery';
import { useToast } from '@/lib/contexts/ToastContext';

export function useAddStaffMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (newStaff: any) => {
            // Create new staff via Supabase operations
            return await insertStaff(newStaff);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
            showToast(`Staf berjaya ditambah: ${data.name}`, 'success');
        },
        onError: (error: any) => {
            showToast(`Gagal menambah staf: ${error.message || 'Ralat tidak diketahui'}`, 'error');
            console.error('Error adding staff:', error);
        }
    });
}

export function useUpdateStaffMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<StaffProfile> }) => {
            return await updateStaff(id, updates);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
            showToast(`Maklumat staf berjaya dikemaskini`, 'success');
        },
        onError: (error: any) => {
            showToast(`Gagal kemaskini staf: ${error.message}`, 'error');
        }
    });
}

export function useDeleteStaffMutation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            await deleteStaff(id);
            return id;
        },
        onSuccess: (id) => {
            queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
            // Also maybe invalidate specific staff query if it existed
            showToast('Staf telah dipadam', 'success');
        },
        onError: (error: any) => {
            showToast(`Gagal memadam staf: ${error.message}`, 'error');
        }
    });
}
