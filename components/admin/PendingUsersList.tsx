'use client';

import { useState } from 'react';
import { usePendingUsers, useApproveUser } from '@/lib/hooks/usePendingUsers';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CheckCircle, XCircle, UserPlus, Clock } from 'lucide-react';
import { useToast } from '@/lib/contexts/ToastContext';

export default function PendingUsersList() {
    // 1. Use the query hook to get data, loading, and error states
    const { data: users, isLoading, isError, error } = usePendingUsers();
    const { showToast } = useToast();

    // 2. Use the mutation hook for actions
    const approveUserMutation = useApproveUser();

    const [rejectReason, setRejectReason] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const handleApprove = async (userId: string) => {
        try {
            await approveUserMutation.mutateAsync({ userId, action: 'approve' });
            showToast('Staff approved successfully', 'success');
        } catch (err) {
            showToast('Failed to approve staff', 'error');
            console.error(err);
        }
    };

    const handleReject = async (userId: string) => {
        if (!rejectReason) return alert('Sila masukkan sebab');

        try {
            await approveUserMutation.mutateAsync({ userId, action: 'reject', reason: rejectReason });
            showToast('Staff rejected', 'success');
            setSelectedUser(null);
            setRejectReason('');
        } catch (err) {
            showToast('Failed to reject staff', 'error');
        }
    };

    // Render logic handling the different states from React Query
    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <LoadingSpinner />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center p-8 text-red-500">
                Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        );
    }

    if (!users || users.length === 0) {
        return (
            <div className="text-center p-8 text-gray-500">
                <UserPlus size={48} className="mx-auto mb-4 opacity-30" />
                <p>Tiada staff baru menunggu kelulusan</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {users.map((user) => (
                <div
                    key={user.id}
                    className="p-5 rounded-lg bg-gray-50 border border-gray-200"
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="font-semibold text-lg mb-2">{user.name}</div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <span>📧 {user.email}</span>
                                {user.phone && <span>📱 {user.phone}</span>}
                                {user.icNumber && <span>🪪 {user.icNumber}</span>}
                            </div>
                            {user.address && (
                                <div className="text-xs text-gray-500 mt-2">
                                    📍 {user.address}
                                </div>
                            )}
                            <div className="text-xs text-gray-400 mt-2 flex items-center">
                                <Clock size={10} className="mr-1" />
                                Didaftar: {new Date(user.createdAt).toLocaleDateString('ms-MY')}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                className="btn btn-success btn-sm flex items-center gap-1"
                                onClick={() => handleApprove(user.id)}
                                disabled={approveUserMutation.isPending}
                            >
                                <CheckCircle size={16} />
                                {approveUserMutation.isPending && approveUserMutation.variables?.userId === user.id ? 'Memproses...' : 'Luluskan'}
                            </button>

                            <button
                                className="btn btn-danger btn-sm flex items-center gap-1"
                                onClick={() => setSelectedUser(user.id)}
                                disabled={approveUserMutation.isPending}
                            >
                                <XCircle size={16} />
                                Tolak
                            </button>
                        </div>
                    </div>

                    {/* Simple inline reject form for demo purposes */}
                    {selectedUser === user.id && (
                        <div className="mt-4 p-4 bg-white rounded border border-gray-200">
                            <textarea
                                className="w-full p-2 border rounded mb-2"
                                placeholder="Reason for rejection..."
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setSelectedUser(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleReject(user.id)}
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
