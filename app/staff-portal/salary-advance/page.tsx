'use client';

import { useState, useMemo } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';
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
    const { t } = useTranslation();
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
    }, [currentStaff, attendance, getStaffSalaryAdvances, staff]);

    // Get current staff's advances
    const myAdvances = useMemo(() => {
        if (!currentStaff) return [];
        return salaryAdvances.filter(a => a.staffId === currentStaff.id);
    }, [currentStaff, salaryAdvances]);

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
                title: t('staffPortal.salaryAdvance.alerts.incompleteTitle'),
                message: t('staffPortal.salaryAdvance.alerts.incompleteMsg'),
                type: 'warning',
                showCancel: false,
                confirmText: t('common.confirm') || 'Faham'
            });
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setConfirmModal({
                isOpen: true,
                title: t('staffPortal.salaryAdvance.alerts.invalidAmountTitle'),
                message: t('staffPortal.salaryAdvance.alerts.invalidAmountMsg'),
                type: 'warning',
                showCancel: false,
                confirmText: t('common.confirm') || 'Faham'
            });
            return;
        }

        if (amountNum > maxAdvance) {
            setConfirmModal({
                isOpen: true,
                title: t('staffPortal.salaryAdvance.alerts.limitExceededTitle'),
                message: t('staffPortal.salaryAdvance.alerts.limitExceededMsg', { amount: maxAdvance.toFixed(2) }),
                type: 'danger',
                showCancel: false,
                confirmText: t('common.back') || 'Kembali'
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
            title: t('staffPortal.salaryAdvance.alerts.successTitle'),
            message: t('staffPortal.salaryAdvance.alerts.successMsg'),
            type: 'success',
            showCancel: false,
            confirmText: 'Selesai'
        });
    };

    const getStatusBadge = (status: SalaryAdvance['status']) => {
        switch (status) {
            case 'pending':
                return <span className="badge badge-warning">{t('staffPortal.salaryAdvance.filters.pending')}</span>;
            case 'approved':
                return <span className="badge badge-success">{t('staffPortal.salaryAdvance.filters.approved')}</span>;
            case 'rejected':
                return <span className="badge badge-danger">{t('staffPortal.salaryAdvance.filters.rejected')}</span>;
            case 'deducted':
                return <span className="badge badge-info">{t('staffPortal.salaryAdvance.filters.deducted')}</span>;
            default:
                return null;
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
                    <h2>{t('staffPortal.salaryAdvance.loginReq.title')}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {t('staffPortal.salaryAdvance.loginReq.desc')}
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
                            {t('staffPortal.salaryAdvance.title')}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {t('staffPortal.salaryAdvance.subtitle')}
                        </p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                        disabled={maxAdvance <= 0}
                    >
                        <Plus size={18} />
                        {t('staffPortal.salaryAdvance.apply')}
                    </button>
                </div>

                {/* Eligibility Info */}
                <div className="card" style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--info-light)', border: '1px solid var(--info)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Briefcase size={18} color="var(--info)" />
                            <span><strong>{t('staffPortal.salaryAdvance.eligibility.workedDays')}</strong> {daysWorkedThisMonth} {t('staffPortal.salaryAdvance.eligibility.daysSuffix')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DollarSign size={18} color="var(--info)" />
                            <span><strong>{t('staffPortal.salaryAdvance.eligibility.currentEarnings')}</strong> BND {earnedSoFar.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={18} color="var(--info)" />
                            <span><strong>{t('staffPortal.salaryAdvance.eligibility.advanced')}</strong> BND {alreadyAdvanced.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={18} color="var(--warning)" />
                            <span><strong>{t('staffPortal.salaryAdvance.eligibility.monthlyLimit')}</strong> BND {monthlyLimit.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: maxAdvance > 0 ? 'var(--success)' : 'var(--danger)' }}>
                            <CheckCircle size={18} />
                            <span>{t('staffPortal.salaryAdvance.eligibility.canApply', { amount: maxAdvance.toFixed(2) })}</span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="content-grid cols-3" style={{ marginBottom: '2rem' }}>
                    <StatCard
                        label={t('staffPortal.salaryAdvance.stats.pending')}
                        value={pendingCount}
                        change={`BND ${pendingAmount.toFixed(2)}`}
                        changeType="neutral"
                        icon={Clock}
                        gradient="subtle"
                    />
                    <StatCard
                        label={t('staffPortal.salaryAdvance.stats.approved')}
                        value={`BND ${approvedAmount.toFixed(2)}`}
                        change={t('staffPortal.salaryAdvance.stats.totalApproved')}
                        changeType="positive"
                        icon={CheckCircle}
                        gradient="subtle"
                    />
                    <StatCard
                        label={t('staffPortal.salaryAdvance.stats.dailyRate')}
                        value={`BND ${dailyRate.toFixed(2)}`}
                        change={t('staffPortal.salaryAdvance.stats.rateDesc', { days: WORKING_DAYS_PER_MONTH })}
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
                            {status === 'all' ? t('staffPortal.salaryAdvance.filters.all') :
                                status === 'pending' ? t('staffPortal.salaryAdvance.filters.pending') :
                                    status === 'approved' ? t('staffPortal.salaryAdvance.filters.approved') :
                                        status === 'rejected' ? t('staffPortal.salaryAdvance.filters.rejected') :
                                            t('staffPortal.salaryAdvance.filters.deducted')}
                        </button>
                    ))}
                </div>

                {/* Advances List */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={20} />
                            {t('staffPortal.salaryAdvance.list.title')}
                        </div>
                    </div>

                    {filteredAdvances.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <DollarSign size={48} color="var(--gray-300)" style={{ marginBottom: '1rem' }} />
                            <p>{t('staffPortal.salaryAdvance.list.empty')}</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('staffPortal.salaryAdvance.list.table.date')}</th>
                                        <th>{t('staffPortal.salaryAdvance.list.table.amount')}</th>
                                        <th>{t('staffPortal.salaryAdvance.list.table.reason')}</th>
                                        <th>{t('staffPortal.salaryAdvance.list.table.status')}</th>
                                        <th>{t('staffPortal.salaryAdvance.list.table.note')}</th>
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
                                                    <span>{t('staffPortal.salaryAdvance.list.approvedBy', { name: advance.approverName })}</span>
                                                )}
                                                {advance.status === 'rejected' && advance.rejectionReason && (
                                                    <span style={{ color: 'var(--danger)' }}>
                                                        {advance.rejectionReason}
                                                    </span>
                                                )}
                                                {advance.status === 'deducted' && advance.deductedMonth && (
                                                    <span>{t('staffPortal.salaryAdvance.list.deductedMonth', { month: advance.deductedMonth })}</span>
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
                    title={t('staffPortal.salaryAdvance.modal.title')}
                    maxWidth="450px"
                >
                    {maxAdvance <= 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ marginBottom: '0.5rem' }}>{t('staffPortal.salaryAdvance.modal.cannotApplyTitle')}</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {t('staffPortal.salaryAdvance.modal.cannotApplyDesc')}
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
                                    <span>{t('staffPortal.salaryAdvance.eligibility.workedDays')}</span>
                                    <strong>{daysWorkedThisMonth} {t('staffPortal.salaryAdvance.eligibility.daysSuffix')}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>{t('staffPortal.salaryAdvance.eligibility.currentEarnings')}</span>
                                    <strong>BND {earnedSoFar.toFixed(2)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>{t('staffPortal.salaryAdvance.eligibility.monthlyLimit')}</span>
                                    <span>BND {monthlyLimit.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>{t('staffPortal.salaryAdvance.eligibility.advanced')}</span>
                                    <span>BND {alreadyAdvanced.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--success)', paddingTop: '0.5rem', borderTop: '1px solid var(--gray-200)' }}>
                                    <span>{t('staffPortal.salaryAdvance.eligibility.canApply', { amount: maxAdvance.toFixed(2) })}</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('staffPortal.salaryAdvance.modal.form.amount')}</label>
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
                                    {t('staffPortal.salaryAdvance.modal.form.amountHint', { amount: maxAdvance.toFixed(2) })}
                                </small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('staffPortal.salaryAdvance.modal.form.reason')}</label>
                                <textarea
                                    className="form-input"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    placeholder={t('staffPortal.salaryAdvance.modal.form.reasonPlaceholder')}
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
                                        <strong>{t('staffPortal.salaryAdvance.modal.warning.title')}</strong> {t('staffPortal.salaryAdvance.modal.warning.desc')}
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
                                    {t('staffPortal.salaryAdvance.modal.form.cancel')}
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !amount || !reason.trim() || parseFloat(amount) > maxAdvance}
                                    style={{ flex: 1 }}
                                >
                                    {isSubmitting ? <LoadingSpinner size="sm" /> : t('staffPortal.salaryAdvance.modal.form.submit')}
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
