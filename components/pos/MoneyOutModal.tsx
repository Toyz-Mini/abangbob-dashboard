'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { useStore, useStaff } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { CashPayout, CashPayoutCategory, StaffProfile } from '@/lib/types';
import { insertCashPayout } from '@/lib/supabase/operations';
import {
    Banknote,
    User,
    FileText,
    Tag,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

interface MoneyOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    registerId?: string;
    outletId?: string;
}

const CATEGORY_KEYS: CashPayoutCategory[] = [
    'petty_cash',
    'refund',
    'change',
    'supplier',
    'other',
];

export default function MoneyOutModal({
    isOpen,
    onClose,
    onSuccess,
    registerId,
    outletId
}: MoneyOutModalProps) {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { staff } = useStaff();
    const { currentStaff } = useAuth();
    const { getTodayCashFlow, updateCashFlow, currentRegister } = useStore();

    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [category, setCategory] = useState<CashPayoutCategory>('petty_cash');
    const [approvedBy, setApprovedBy] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get managers for approval dropdown
    const managers = staff.filter((s: StaffProfile) => s.role === 'Manager' && s.status === 'active');

    const resetForm = () => {
        setAmount('');
        setReason('');
        setCategory('petty_cash');
        setApprovedBy('');
        setNotes('');
    };

    const handleSubmit = async () => {
        // Validation
        if (!amount || parseFloat(amount) <= 0) {
            showToast(t('pos.moneyOut.toast.invalidAmount'), 'error');
            return;
        }
        if (!reason.trim()) {
            showToast(t('pos.moneyOut.toast.invalidReason'), 'error');
            return;
        }
        if (!approvedBy) {
            showToast(t('pos.moneyOut.toast.invalidApprover'), 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const amountNum = parseFloat(amount);
            const approver = managers.find((m: StaffProfile) => m.id === approvedBy);

            const payout: Omit<CashPayout, 'id'> = {
                amount: amountNum,
                reason: reason.trim(),
                category,
                performedBy: currentStaff?.id || '',
                performedByName: currentStaff?.name || 'Unknown',
                approvedBy: approvedBy,
                approvedByName: approver?.name || 'Unknown',
                registerId: registerId,
                outletId: outletId,
                notes: notes.trim() || undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Insert to Supabase
            await insertCashPayout(payout);

            // Update DailyCashFlow - add to expensesCash
            const todayCashFlow = getTodayCashFlow();
            if (todayCashFlow) {
                updateCashFlow(todayCashFlow.id, {
                    expensesCash: (todayCashFlow.expensesCash || 0) + amountNum
                });
            }

            showToast(t('pos.moneyOut.toast.success', { amount: amountNum.toFixed(2) }), 'success');
            resetForm();
            onClose();
            onSuccess?.();

        } catch (error) {
            console.error('Failed to record cash payout:', error);
            showToast(t('pos.moneyOut.toast.error'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('pos.moneyOut.title')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Amount */}
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Banknote size={16} />
                        {t('pos.moneyOut.amountLabel')}
                    </label>
                    <input
                        type="number"
                        className="form-input"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        autoFocus
                        style={{ fontSize: '1.25rem', fontWeight: 600 }}
                    />
                </div>

                {/* Category */}
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Tag size={16} />
                        {t('pos.moneyOut.categoryLabel')}
                    </label>
                    <select
                        className="form-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as CashPayoutCategory)}
                    >
                        {CATEGORY_KEYS.map(key => (
                            <option key={key} value={key}>{t(`pos.moneyOut.categories.${key}`)}</option>
                        ))}
                    </select>
                </div>

                {/* Reason */}
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} />
                        {t('pos.moneyOut.reasonLabel')}
                    </label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder={t('pos.moneyOut.reasonPlaceholder')}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                {/* Approved By */}
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} />
                        {t('pos.moneyOut.approvedByLabel')}
                    </label>
                    <select
                        className="form-select"
                        value={approvedBy}
                        onChange={(e) => setApprovedBy(e.target.value)}
                    >
                        <option value="">{t('pos.moneyOut.selectManager')}</option>
                        {managers.map((m: StaffProfile) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                {/* Notes (optional) */}
                <div className="form-group">
                    <label className="form-label">{t('pos.moneyOut.notesLabel')}</label>
                    <textarea
                        className="form-input"
                        rows={2}
                        placeholder={t('pos.moneyOut.notesPlaceholder')}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {/* Info Box */}
                <div style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--warning-bg, #fef3c7)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                }}>
                    <AlertCircle size={16} style={{ color: 'var(--warning, #f59e0b)', flexShrink: 0, marginTop: 2 }} />
                    <span>{t('pos.moneyOut.info')}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                        className="btn btn-outline"
                        onClick={onClose}
                        style={{ flex: 1 }}
                        disabled={isSubmitting}
                    >
                        {t('pos.moneyOut.cancel')}
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !amount || !reason.trim() || !approvedBy}
                        style={{ flex: 2, gap: '0.5rem' }}
                    >
                        {isSubmitting ? (
                            <>{t('pos.moneyOut.submitting')}</>
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                {t('pos.moneyOut.submit')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
