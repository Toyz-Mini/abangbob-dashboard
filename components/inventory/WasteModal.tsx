'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { useInventory } from '@/lib/store';
import { StockItem, WasteLog } from '@/lib/types';
import { X, Save, AlertTriangle, Camera } from 'lucide-react';
import { useAuth as useAuthContext } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';

interface WasteModalProps {
    isOpen: boolean;
    onClose: () => void;
    stockItem: StockItem | null;
}

export default function WasteModal({ isOpen, onClose, stockItem }: WasteModalProps) {
    const { addWasteLog } = useInventory();
    const { currentStaff, user } = useAuthContext();
    const { t } = useTranslation();

    const [quantity, setQuantity] = useState<number>(0);
    const [reason, setReason] = useState<WasteLog['reason']>('expired');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setQuantity(0);
            setReason('expired');
            setNotes('');
        }
    }, [isOpen, stockItem]);

    if (!stockItem) return null;

    const costPerUnit = stockItem.cost || 0;
    const totalLoss = quantity * costPerUnit;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity <= 0) return;

        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 500)); // Simulasi network delay

        // Fallback current user/staff
        const staffId = currentStaff?.id || user?.id || 'unknown';
        const staffName = currentStaff?.name || user?.user_metadata?.name || 'Staff';

        await addWasteLog({
            stockId: stockItem.id,
            stockName: stockItem.name,
            quantity: quantity,
            unit: stockItem.unit,
            costPerUnit: costPerUnit,
            reason: reason,
            reportedBy: staffId,
            reportedByName: staffName,
            notes: notes,
            // photoUrl will be implemented later or ignored for now
        });

        setIsSubmitting(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('inventory.waste.title', { name: stockItem.name })}>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Quantity Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('inventory.waste.quantity', { unit: stockItem.unit })}
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value))}
                            className="input input-bordered w-full"
                            placeholder="0.00"
                            required
                        />
                        <span className="text-gray-500 font-medium">{stockItem.unit}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {t('inventory.waste.currentStock', { qty: stockItem.currentQuantity, unit: stockItem.unit })}
                    </p>
                </div>

                {/* Cost Analysis (Auto-calculated) */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-red-600 font-bold">{t('inventory.waste.loss')}</p>
                        <p className="text-xs text-red-500">{t('inventory.waste.basedOnCost', { cost: costPerUnit.toFixed(2), unit: stockItem.unit })}</p>
                    </div>
                    <p className="text-xl font-bold text-red-700">
                        BND {totalLoss.toFixed(2)}
                    </p>
                </div>

                {/* Reason Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.waste.reason')}</label>
                    <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value as any)}
                        className="select select-bordered w-full"
                    >
                        <option value="expired">{t('inventory.waste.reasons.expired')}</option>
                        <option value="burned">{t('inventory.waste.reasons.burned')}</option>
                        <option value="customer_return">{t('inventory.waste.reasons.customer_return')}</option>
                        <option value="staff_meal">{t('inventory.waste.reasons.staff_meal')}</option>
                        <option value="other">{t('inventory.waste.reasons.other')}</option>
                    </select>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.waste.notes')}</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="textarea textarea-bordered w-full"
                        placeholder={t('inventory.waste.notesPlaceholder')}
                        rows={2}
                    />
                </div>

                <div className="modal-action">
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
                        {t('inventory.buttons.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-error text-white"
                        disabled={isSubmitting || quantity <= 0}
                    >
                        {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : <AlertTriangle size={18} className="mr-2" />}
                        {t('inventory.waste.confirm')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
