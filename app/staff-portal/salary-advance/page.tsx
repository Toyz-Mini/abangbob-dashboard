'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaffPortal } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import { SalaryAdvance } from '@/lib/types';
import {
    DollarSign,
    Plus,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    FileText,
} from 'lucide-react';

// Default max advance (can be made configurable)
const MAX_ADVANCE_AMOUNT = 500;

export default function SalaryAdvancePage() {
    const { currentStaff, isStaffLoggedIn } = useAuth();
    const {
        salaryAdvances,
        addSalaryAdvance,
        getStaffSalaryAdvances,
        isInitialized
    } = useStaffPortal();

    const [showAddModal, setShowAddModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'deducted'>('all');

    // Get current staff's advances
    const myAdvances = useMemo(() => {
        if (!currentStaff) return [];
        return getStaffSalaryAdvances(currentStaff.id);
    }, [currentStaff, getStaffSalaryAdvances, salaryAdvances]);

    const filteredAdvances = useMemo(() => {
        if (statusFilter === 'all') return myAdvances;
        return myAdvances.filter(a => a.status === statusFilter);
    }, [myAdvances, statusFilter]);

    // Stats
    const pendingCount = myAdvances.filter(a => a.status === 'pending').length;
    const approvedAmount = myAdvances
        .filter(a => a.status === 'approved' || a.status === 'deducted')
        .reduce((sum, a) => sum + a.amount, 0);
    const pendingAmount = myAdvances
        .filter(a => a.status === 'pending')
        .reduce((sum, a) => sum + a.amount, 0);

    const handleSubmit = async () => {
        if (!currentStaff || !amount || !reason.trim()) {
            alert('Sila isi semua maklumat');
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            alert('Jumlah tidak sah');
            return;
        }

        if (amountNum > MAX_ADVANCE_AMOUNT) {
            alert(`Jumlah maksimum adalah BND ${MAX_ADVANCE_AMOUNT}`);
            return;
        }

        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 500));

        addSalaryAdvance({
            staffId: currentStaff.id,
            staffName: currentStaff.name,
            amount: amountNum,
            reason: reason.trim(),
            status: 'pending',
        });

        setAmount('');
        setReason('');
        setShowAddModal(false);
        setIsSubmitting(false);
    };

    const getStatusBadge = (status: SalaryAdvance['status']) => {
        switch (status) {
            case 'pending':
                return <span className="badge badge-warning">Menunggu</span>;
            case 'approved':
                return <span className="badge badge-success">Diluluskan</span>;
            case 'rejected':
                return <span className="badge badge-danger">Ditolak</span>;
            case 'deducted':
                return <span className="badge badge-info">Dipotong</span>;
        }
    };

    if (!isInitialized) {
        return (
            <MainLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <LoadingSpinner />
                </div>
            </MainLayout>
        );
    }

    if (!isStaffLoggedIn || !currentStaff) {
        return (
            <MainLayout>
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <AlertCircle size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
                    <h2>Sila Log Masuk</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Anda perlu log masuk sebagai staf untuk memohon pendahuluan gaji.
                    </p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="animate-fade-in">
                {/* Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            Pendahuluan Gaji
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Mohon pendahuluan gaji - akan dipotong dari gaji bulan hadapan
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        Mohon Pendahuluan
                    </button>
                </div>

                {/* Stats */}
                <div className="content-grid cols-3" style={{ marginBottom: '2rem' }}>
                    <StatCard
                        label="Menunggu Kelulusan"
                        value={pendingCount}
                        change={`BND ${pendingAmount.toFixed(2)}`}
                        changeType="neutral"
                        icon={Clock}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Diluluskan"
                        value={`BND ${approvedAmount.toFixed(2)}`}
                        change="jumlah diluluskan"
                        changeType="positive"
                        icon={CheckCircle}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Had Maksimum"
                        value={`BND ${MAX_ADVANCE_AMOUNT}`}
                        change="setiap permohonan"
                        changeType="neutral"
                        icon={DollarSign}
                        gradient="subtle"
                    />
                </div>

                {/* Filters */}
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(['all', 'pending', 'approved', 'rejected', 'deducted'] as const).map(status => (
                        <button
                            key={status}
                            className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setStatusFilter(status)}
                        >
                            {status === 'all' ? 'Semua' :
                                status === 'pending' ? 'Menunggu' :
                                    status === 'approved' ? 'Diluluskan' :
                                        status === 'rejected' ? 'Ditolak' : 'Dipotong'}
                        </button>
                    ))}
                </div>

                {/* Advances List */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={20} />
                            Senarai Permohonan
                        </div>
                    </div>

                    {filteredAdvances.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <DollarSign size={48} color="var(--gray-300)" style={{ marginBottom: '1rem' }} />
                            <p>Tiada permohonan pendahuluan gaji</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Tarikh</th>
                                        <th>Jumlah</th>
                                        <th>Sebab</th>
                                        <th>Status</th>
                                        <th>Catatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAdvances.sort((a, b) =>
                                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                    ).map(advance => (
                                        <tr key={advance.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Calendar size={14} color="var(--text-secondary)" />
                                                    {new Date(advance.createdAt).toLocaleDateString('ms-MY')}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                                BND {advance.amount.toFixed(2)}
                                            </td>
                                            <td style={{ maxWidth: '200px' }}>
                                                {advance.reason}
                                            </td>
                                            <td>{getStatusBadge(advance.status)}</td>
                                            <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {advance.status === 'approved' && advance.approverName && (
                                                    <span>Diluluskan oleh {advance.approverName}</span>
                                                )}
                                                {advance.status === 'rejected' && advance.rejectionReason && (
                                                    <span style={{ color: 'var(--danger)' }}>
                                                        {advance.rejectionReason}
                                                    </span>
                                                )}
                                                {advance.status === 'deducted' && advance.deductedMonth && (
                                                    <span>Dipotong bulan {advance.deductedMonth}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Add Modal */}
                <Modal
                    isOpen={showAddModal}
                    onClose={() => !isSubmitting && setShowAddModal(false)}
                    title="Mohon Pendahuluan Gaji"
                    maxWidth="450px"
                >
                    <div className="form-group">
                        <label className="form-label">Jumlah (BND) *</label>
                        <input
                            type="number"
                            className="form-input"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Contoh: 200"
                            min="1"
                            max={MAX_ADVANCE_AMOUNT}
                        />
                        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                            Maksimum BND {MAX_ADVANCE_AMOUNT} setiap permohonan
                        </small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sebab Permohonan *</label>
                        <textarea
                            className="form-input"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Nyatakan sebab permohonan..."
                        />
                    </div>

                    <div style={{
                        background: 'var(--warning-light)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                        border: '1px solid var(--warning)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <AlertCircle size={18} color="var(--warning)" style={{ marginTop: '2px' }} />
                            <div style={{ fontSize: '0.875rem', color: 'var(--warning-dark)' }}>
                                <strong>Perhatian:</strong> Pendahuluan gaji akan dipotong secara automatik dari gaji bulan hadapan selepas diluluskan.
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn btn-outline"
                            onClick={() => setShowAddModal(false)}
                            disabled={isSubmitting}
                            style={{ flex: 1 }}
                        >
                            Batal
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !amount || !reason.trim()}
                            style={{ flex: 1 }}
                        >
                            {isSubmitting ? <LoadingSpinner size="sm" /> : 'Hantar Permohonan'}
                        </button>
                    </div>
                </Modal>
            </div>
        </MainLayout>
    );
}
