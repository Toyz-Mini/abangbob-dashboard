
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define the User type based on your API response
type PendingUser = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    icNumber?: string;
    address?: string;
    createdAt: string;
};

// 1. Fetcher function
const fetchPendingUsers = async (): Promise<PendingUser[]> => {
    const res = await fetch('/api/admin/pending-users');
    if (!res.ok) {
        throw new Error('Failed to fetch pending users');
    }
    const data = await res.json();
    return data.users;
};

// 2. Custom hooks
export const usePendingUsers = () => {
    return useQuery({
        queryKey: ['pending-users'], // Unique key for caching
        queryFn: fetchPendingUsers,
    });
};

export const useApproveUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, action, reason }: { userId: string; action: 'approve' | 'reject'; reason?: string }) => {
            const res = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action, reason }),
            });

            if (!res.ok) {
                throw new Error('Failed to process user');
            }

            return res.json();
        },
        // On success, invalidate the 'pending-users' query to refetch updated data
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-users'] });
        },
    });
};
