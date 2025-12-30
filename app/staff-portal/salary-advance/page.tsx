'use client';

import { useState, useMemo } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
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
    Briefcase,
} from 'lucide-react';

// Assume 26 working days per month (standard for Brunei)
const WORKING_DAYS_PER_MONTH = 26;

export default function SalaryAdvancePage() {
    const { currentStaff, isStaffLoggedIn } = useAuth();
    const {
        salaryAdvances,
        addSalaryAdvance,
        getStaffSalaryAdvances,
        attendance,
        isInitialized,
        staff
    } = useStaffPortal();

    const [showAddModal, setShowAddModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'deducted'>('all');

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm?: () => void;
        type?: 'primary' | 'danger' | 'success' | 'warning' | 'info';
        showCancel?: boolean;
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
    });

    // Calculate days worked this month and max advance
    const { daysWorkedThisMonth, dailyRate, maxAdvance, earnedSoFar, alreadyAdvanced, monthlyLimit, monthlySalary } = useMemo(() => {
        if (!currentStaff) {
            return { daysWorkedThisMonth: 0, dailyRate: 0, maxAdvance: 0, earnedSoFar: 0, alreadyAdvanced: 0, monthlyLimit: 0, monthlySalary: 0 };
        }

        // Get current month start and end
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const today = now.getDate();

        // Count days worked this month from attendance
        const daysWorked = (attendance || []).filter(a => {
            const date = new Date(a.date);
            return (
                a.staffId === currentStaff.id &&
                date >= monthStart &&
                date <= now &&
                a.clockInTime // Has clock-in means worked
            );
        }).length;

        // Use actual days worked, or estimate based on passed weekdays if no attendance
        const estimatedWorkDays = Math.min(today, Math.floor(today * 5 / 7)); // Rough estimate
        const actualDaysWorked = daysWorked > 0 ? daysWorked : Math.max(1, estimatedWorkDays);

        // Calculate daily rate from monthly salary
        const fullProfile = staff.find(s => s.id === currentStaff.id);
        const salary = fullProfile?.baseSalary || 1500; // Default BND 1500 if not set
        const rate = salary / WORKING_DAYS_PER_MONTH;

        // Calculate earned so far
        const earned = rate * actualDaysWorked;

        // Get already approved/pending advances this month
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const myAdvances = getStaffSalaryAdvances(currentStaff.id);
        const pendingOrApproved = myAdvances.filter(a => {
            const advDate = new Date(a.createdAt);
            const advMonth = `${advDate.getFullYear()}-${String(advDate.getMonth() + 1).padStart(2, '0')}`;
            return advMonth === monthStr && (a.status === 'pending' || a.status === 'approved');
        });
        const alreadyAdvancedAmt = pendingOrApproved.reduce((sum, a) => sum + a.amount, 0);

        // Monthly limit = 50% of monthly salary
        const maxMonthlyLimit = salary * 0.5;
        const remainingMonthlyLimit = Math.max(0, maxMonthlyLimit - alreadyAdvancedAmt);

        // Max based on days worked = earned so far - already advanced
        const maxBasedOnDaysWorked = Math.max(0, Math.floor(earned - alreadyAdvancedAmt));

        // Final max = minimum of (days worked limit) and (monthly 50% limit)
        const maxAdv = Math.min(maxBasedOnDaysWorked, remainingMonthlyLimit);

        return {
            daysWorkedThisMonth: actualDaysWorked,
            dailyRate: rate,
            maxAdvance: Math.floor(maxAdv),
            earnedSoFar: earned,
            alreadyAdvanced: alreadyAdvancedAmt,
            monthlyLimit: maxMonthlyLimit,
            monthlySalary: salary
        };
    }, [currentStaff, attendance, getStaffSalaryAdvances, salaryAdvances, staff]);

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
            setConfirmModal({
                isOpen: true,
                title: 'Maklumat Tidak Lengkap',
                message: 'Sila isi jumlah dan sebab permohonan.',
                type: 'warning',
                showCancel: false,
                confirmText: 'Faham'
            });
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setConfirmModal({
                isOpen: true,
                title: 'Jumlah Tidak Sah',
                message: 'Sila masukkan jumlah permohonan yang sah.',
                type: 'warning',
                showCancel: false,
                confirmText: 'Faham'
            });
            return;
        }

        if (amountNum > maxAdvance) {
            setConfirmModal({
                isOpen: true,
                title: 'Melebihi Had',
                message: `Maksimum yang boleh dipohon berdasarkan hari bekerja anda adalah BND ${maxAdvance.toFixed(2)}.`,
                type: 'danger',
                showCancel: false,
                confirmText: 'Kembali'
            });
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

        setConfirmModal({
            isOpen: true,
            title: 'Berjaya Dihantar',
            message: 'Permohonan pendahuluan gaji anda telah dihantar dan akan disemak oleh pihak pengurusan.',
            type: 'success',
            showCancel: false,
            confirmText: 'Selesai'
        });
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
            <StaffLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <LoadingSpinner />
                </div>
            </StaffLayout>
        );
    }

    if (!isStaffLoggedIn || !currentStaff) {
        return (
            <StaffLayout>
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <AlertCircle size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
                    <h2>Sila Log Masuk</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Anda perlu log masuk sebagai staf untuk memohon pendahuluan gaji.
                    </p>
                </div>
            </StaffLayout>
        );
    }

    return (
        <StaffLayout>
            <div className="animate-fade-in">
                {/* Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            Pendahuluan Gaji
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Mohon pendahuluan gaji - berdasarkan hari bekerja bulan ini
                        </p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                        disabled={maxAdvance <= 0}
                    >
                        <Plus size={18} />
                        Mohon Pendahuluan
                    </button>
                </div>

                {/* Eligibility Info */}
                <div className="card" style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--info-light)', border: '1px solid var(--info)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Briefcase size={18} color="var(--info)" />
                            <span><strong>Hari Bekerja:</strong> {daysWorkedThisMonth} hari</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DollarSign size={18} color="var(--info)" />
                            <span><strong>Pendapatan Setakat Ini:</strong> BND {earnedSoFar.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={18} color="var(--info)" />
                            <span><strong>Dah Advance:</strong> BND {alreadyAdvanced.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={18} color="var(--warning)" />
                            <span><strong>Had Bulanan (50%):</strong> BND {monthlyLimit.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: maxAdvance > 0 ? 'var(--success)' : 'var(--danger)' }}>
                            <CheckCircle size={18} />
                            <span>Boleh Mohon: BND {maxAdvance.toFixed(2)}</span>
                        </div>
                    </div>
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
                        label="Kadar Harian"
                        value={`BND ${dailyRate.toFixed(2)}`}
                        change={`gaji / ${WORKING_DAYS_PER_MONTH} hari`}
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
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
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
                    {maxAdvance <= 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ marginBottom: '0.5rem' }}>Tidak Boleh Mohon</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Anda sudah advance maksimum berdasarkan hari bekerja bulan ini.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Eligibility summary */}
                            <div style={{
                                background: 'var(--gray-50)',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1rem',
                                fontSize: '0.875rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>Hari Bekerja Bulan Ini:</span>
                                    <strong>{daysWorkedThisMonth} hari</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>Pendapatan Setakat Ini:</span>
                                    <strong>BND {earnedSoFar.toFixed(2)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>Had Bulanan (50% gaji):</span>
                                    <span>BND {monthlyLimit.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>Dah Advance:</span>
                                    <span>BND {alreadyAdvanced.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--success)', paddingTop: '0.5rem', borderTop: '1px solid var(--gray-200)' }}>
                                    <span>Boleh Mohon Maksimum:</span>
                                    <span>BND {maxAdvance.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Jumlah (BND) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder={`Contoh: ${Math.min(100, maxAdvance)}`}
                                    min="1"
                                    max={maxAdvance}
                                />
                                <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                                    Maksimum BND {maxAdvance.toFixed(2)} (had 50% gaji atau hari bekerja)
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
                                        <strong>Perhatian:</strong> Pendahuluan gaji akan dipotong secara automatik dari gaji bulan ini selepas diluluskan.
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
                                    disabled={isSubmitting || !amount || !reason.trim() || parseFloat(amount) > maxAdvance}
                                    style={{ flex: 1 }}
                                >
                                    {isSubmitting ? <LoadingSpinner size="sm" /> : 'Hantar Permohonan'}
                                </button>
                            </div>
                        </>
                    )}
                </Modal>

                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={() => {
                        if (confirmModal.onConfirm) confirmModal.onConfirm();
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    type={confirmModal.type}
                    showCancel={confirmModal.showCancel}
                    confirmText={confirmModal.confirmText}
                />
            </div>
        </StaffLayout>
    );
}
