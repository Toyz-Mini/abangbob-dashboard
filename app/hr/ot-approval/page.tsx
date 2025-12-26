'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useStaff } from '@/lib/store';
import { useToast } from '@/lib/contexts/ToastContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { formatMinutesAsTime, getBruneiToday } from '@/lib/timezone-utils';
import {
    Clock,
    Check,
    X,
    AlertTriangle,
    Timer,
    Calendar,
    User,
    ChevronDown,
} from 'lucide-react';

interface PendingOT {
    id: string;
    staffId: string;
    staffName: string;
    date: string;
    clockIn: string;
    clockOut: string;
    expectedClockOut: string | null;
    overtimeMinutes: number;
    notes: string | null;
}

type FilterStatus = 'pending' | 'approved' | 'rejected' | 'all';

export default function OTApprovalPage() {
    const { currentStaff } = useAuth();
    const { staff } = useStaff();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [pendingOT, setPendingOT] = useState<PendingOT[]>([]);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
    const [selectedOT, setSelectedOT] = useState<PendingOT | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadPendingOT();
    }, [filterStatus]);

    async function loadPendingOT() {
        setLoading(true);
        const supabase = getSupabaseClient();
        if (!supabase) {
            setLoading(false);
            return;
        }

        try {
            let query = supabase
                .from('attendance')
                .select('*')
                .gt('overtime_minutes', 0)
                .order('date', { ascending: false });

            if (filterStatus === 'pending') {
                query = query.is('overtime_approved', null);
            } else if (filterStatus === 'approved') {
                query = query.eq('overtime_approved', true);
            } else if (filterStatus === 'rejected') {
                query = query.eq('overtime_approved', false);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Map to PendingOT with staff names
            const mapped = (data || []).map((record: any) => {
                const staffMember = staff.find(s => s.id === record.staff_id);
                return {
                    id: record.id,
                    staffId: record.staff_id,
                    staffName: staffMember?.name || 'Unknown',
                    date: record.date,
                    clockIn: record.clock_in,
                    clockOut: record.clock_out,
                    expectedClockOut: record.expected_clock_out,
                    overtimeMinutes: record.overtime_minutes,
                    notes: record.notes,
                };
            });

            setPendingOT(mapped);
        } catch (error) {
            console.error('Error loading OT records:', error);
            showToast('Gagal memuatkan rekod OT', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(ot: PendingOT) {
        setProcessing(true);
        const supabase = getSupabaseClient();
        if (!supabase) return;

        try {
            const { error } = await supabase
                .from('attendance')
                .update({
                    overtime_approved: true,
                    overtime_approved_by: currentStaff?.id,
                    overtime_approved_at: new Date().toISOString(),
                })
                .eq('id', ot.id);

            if (error) throw error;

            showToast(`OT ${formatMinutesAsTime(ot.overtimeMinutes)} untuk ${ot.staffName} diluluskan!`, 'success');
            loadPendingOT();
        } catch (error: any) {
            showToast(error.message || 'Gagal meluluskan OT', 'error');
        } finally {
            setProcessing(false);
        }
    }

    async function handleReject() {
        if (!selectedOT) return;
        setProcessing(true);
        const supabase = getSupabaseClient();
        if (!supabase) return;

        try {
            const notes = selectedOT.notes ? `${selectedOT.notes}\n` : '';
            const rejectNote = `[OT REJECTED] Ditolak oleh ${currentStaff?.name}: ${rejectReason || 'Tiada sebab'}`;

            const { error } = await supabase
                .from('attendance')
                .update({
                    overtime_approved: false,
                    overtime_approved_by: currentStaff?.id,
                    overtime_approved_at: new Date().toISOString(),
                    notes: `${notes}${rejectNote}`,
                })
                .eq('id', selectedOT.id);

            if (error) throw error;

            showToast(`OT untuk ${selectedOT.staffName} ditolak`, 'success');
            setShowRejectModal(false);
            setSelectedOT(null);
            setRejectReason('');
            loadPendingOT();
        } catch (error: any) {
            showToast(error.message || 'Gagal menolak OT', 'error');
        } finally {
            setProcessing(false);
        }
    }

    function openRejectModal(ot: PendingOT) {
        setSelectedOT(ot);
        setRejectReason('');
        setShowRejectModal(true);
    }

    const formatTime = (isoString: string) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ms-MY', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Access check
    if (!currentStaff || currentStaff.role !== 'Manager') {
        return (
            <MainLayout>
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                    <AlertTriangle size={48} style={{ color: 'var(--warning)', marginBottom: '1rem' }} />
                    <h2>Akses Terhad</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Hanya Manager boleh meluluskan OT.</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="animate-fade-in">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            Kelulusan Overtime
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Semak dan luluskan rekod overtime staff
                        </p>
                    </div>

                    {/* Filter */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(['pending', 'approved', 'rejected', 'all'] as FilterStatus[]).map((status) => (
                            <button
                                key={status}
                                className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setFilterStatus(status)}
                            >
                                {status === 'pending' && 'Menunggu'}
                                {status === 'approved' && 'Diluluskan'}
                                {status === 'rejected' && 'Ditolak'}
                                {status === 'all' && 'Semua'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3" style={{ gap: '1rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.75rem', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)' }}>
                                <Clock size={24} style={{ color: 'var(--warning)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Menunggu Kelulusan</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                    {pendingOT.filter(() => filterStatus === 'pending' || filterStatus === 'all').length}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.75rem', background: 'var(--success-light)', borderRadius: 'var(--radius-md)' }}>
                                <Check size={24} style={{ color: 'var(--success)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Diluluskan</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                    {filterStatus === 'approved' ? pendingOT.length : '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.75rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
                                <Timer size={24} style={{ color: 'var(--primary)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total OT Jam</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                    {formatMinutesAsTime(pendingOT.reduce((sum, ot) => sum + ot.overtimeMinutes, 0))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* OT Records */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Timer size={20} />
                            Rekod Overtime
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <LoadingSpinner />
                        </div>
                    ) : pendingOT.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <Check size={48} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                            <p>Tiada rekod OT {filterStatus === 'pending' ? 'menunggu kelulusan' : ''}</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Staff</th>
                                        <th>Tarikh</th>
                                        <th>Clock Out</th>
                                        <th>Expected</th>
                                        <th>OT</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'center' }}>Tindakan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingOT.map((ot) => (
                                        <tr key={ot.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <User size={16} />
                                                    {ot.staffName}
                                                </div>
                                            </td>
                                            <td>{formatDate(ot.date)}</td>
                                            <td>{formatTime(ot.clockOut)}</td>
                                            <td>{ot.expectedClockOut || '-'}</td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                                    {formatMinutesAsTime(ot.overtimeMinutes)}
                                                </span>
                                            </td>
                                            <td>
                                                {filterStatus === 'pending' && (
                                                    <span className="badge badge-warning">Menunggu</span>
                                                )}
                                                {filterStatus === 'approved' && (
                                                    <span className="badge badge-success">Diluluskan</span>
                                                )}
                                                {filterStatus === 'rejected' && (
                                                    <span className="badge badge-danger">Ditolak</span>
                                                )}
                                                {filterStatus === 'all' && (
                                                    <span className="badge">-</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {filterStatus === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleApprove(ot)}
                                                            disabled={processing}
                                                        >
                                                            <Check size={14} />
                                                            Lulus
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => openRejectModal(ot)}
                                                            disabled={processing}
                                                        >
                                                            <X size={14} />
                                                            Tolak
                                                        </button>
                                                    </div>
                                                )}
                                                {filterStatus !== 'pending' && (
                                                    <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Reject Modal */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title="Tolak Overtime"
                maxWidth="400px"
            >
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ marginBottom: '1rem' }}>
                        Tolak OT <strong>{formatMinutesAsTime(selectedOT?.overtimeMinutes || 0)}</strong> untuk{' '}
                        <strong>{selectedOT?.staffName}</strong>?
                    </p>
                    <div className="form-group">
                        <label className="form-label">Sebab Penolakan (optional)</label>
                        <textarea
                            className="form-input"
                            placeholder="Nyatakan sebab..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" onClick={() => setShowRejectModal(false)}>
                        Batal
                    </button>
                    <button className="btn btn-danger" onClick={handleReject} disabled={processing}>
                        {processing ? 'Processing...' : 'Tolak OT'}
                    </button>
                </div>
            </Modal>
        </MainLayout>
    );
}
