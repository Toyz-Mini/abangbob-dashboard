'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import LivePageHeader from '@/components/LivePageHeader';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    UserPlus,
    CheckCircle,
    XCircle,
    Clock,
    Mail,
    User,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';

interface PendingUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
    icNumber?: string;
    dateOfBirth?: string;
    address?: string;
    emergencyContact?: string;
    status: string;
    createdAt: string;
}

export default function PendingUsersPage() {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchPendingUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/pending-users');
            if (!res.ok) {
                throw new Error('Gagal mendapatkan senarai pending users');
            }
            const data = await res.json();
            setPendingUsers(data.users || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ralat tidak dijangka');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const handleApprove = async (userId: string, userName: string) => {
        if (!confirm(`Adakah anda pasti ingin meluluskan pendaftaran ${userName}?`)) {
            return;
        }

        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'approve' }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Gagal meluluskan pengguna');
            }

            setSuccessMessage(`${userName} telah diluluskan dan ditambah ke senarai staf!`);
            setPendingUsers((prev) => prev.filter((u) => u.id !== userId));

            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ralat semasa meluluskan');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (userId: string, userName: string) => {
        const reason = prompt(`Sila masukkan sebab penolakan untuk ${userName}:`);
        if (reason === null) return; // User cancelled

        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'reject', reason }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Gagal menolak pengguna');
            }

            setSuccessMessage(`Pendaftaran ${userName} telah ditolak.`);
            setPendingUsers((prev) => prev.filter((u) => u.id !== userId));

            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ralat semasa menolak');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ms-MY', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <MainLayout>
            <div className="animate-fade-in">
                <LivePageHeader
                    title="Pending Approvals"
                    subtitle="Luluskan pendaftaran staf baru"
                    rightContent={
                        <PremiumButton
                            icon={RefreshCw}
                            variant="outline"
                            onClick={fetchPendingUsers}
                            disabled={loading}
                        >
                            Refresh
                        </PremiumButton>
                    }
                />

                {/* Success Message */}
                {successMessage && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem 1.25rem',
                            background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: '1.5rem',
                            border: '1px solid #86efac',
                        }}
                    >
                        <CheckCircle size={20} color="#16a34a" />
                        <span style={{ fontWeight: 500, color: '#166534' }}>{successMessage}</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem 1.25rem',
                            background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: '1.5rem',
                            border: '1px solid #fca5a5',
                        }}
                    >
                        <AlertCircle size={20} color="#dc2626" />
                        <span style={{ fontWeight: 500, color: '#991b1b' }}>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <XCircle size={18} color="#991b1b" />
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="content-grid cols-3 mb-lg">
                    <GlassCard gradient="subtle">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'rgba(234, 179, 8, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Clock size={24} color="var(--warning)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{pendingUsers.length}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Menunggu Kelulusan
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Loading */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <LoadingSpinner />
                    </div>
                ) : pendingUsers.length === 0 ? (
                    /* Empty State */
                    <GlassCard>
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '4rem 2rem',
                            }}
                        >
                            <div
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '0 auto 1.5rem',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <CheckCircle size={40} color="#16a34a" />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                Tiada Pending Approvals
                            </h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Semua pendaftaran telah diproses. 🎉
                            </p>
                        </div>
                    </GlassCard>
                ) : (
                    /* User List */
                    <div className="flex flex-col gap-4">
                        {pendingUsers.map((user) => (
                            <GlassCard key={user.id} className="hover-lift">
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '1.25rem',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {/* Avatar */}
                                    <div
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--primary), #8B0000)',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '1.25rem',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {user.name.substring(0, 2).toUpperCase()}
                                    </div>

                                    {/* Details */}
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                                {user.name}
                                            </h3>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '6px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                background: user.status === 'pending_approval'
                                                    ? 'rgba(34, 197, 94, 0.15)'
                                                    : 'rgba(234, 179, 8, 0.15)',
                                                color: user.status === 'pending_approval'
                                                    ? '#16a34a'
                                                    : '#ca8a04',
                                            }}>
                                                {user.status === 'pending_approval' ? '✓ Sedia Approve' : '⏳ Profile Belum Lengkap'}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                marginBottom: '0.5rem',
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            <Mail size={14} />
                                            {user.email}
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.85rem',
                                            }}
                                        >
                                            <Clock size={14} />
                                            Didaftar pada {formatDate(user.createdAt)}
                                        </div>
                                        {user.phone && (
                                            <div
                                                style={{
                                                    marginTop: '0.5rem',
                                                    fontSize: '0.85rem',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                📱 {user.phone}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.75rem',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <PremiumButton
                                            icon={CheckCircle}
                                            variant="primary"
                                            onClick={() => handleApprove(user.id, user.name)}
                                            disabled={actionLoading === user.id}
                                        >
                                            {actionLoading === user.id ? 'Loading...' : 'Luluskan'}
                                        </PremiumButton>
                                        <PremiumButton
                                            icon={XCircle}
                                            variant="outline"
                                            onClick={() => handleReject(user.id, user.name)}
                                            disabled={actionLoading === user.id}
                                            style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                                        >
                                            Tolak
                                        </PremiumButton>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
