'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { useInventory } from '@/lib/store';
import { StockItem, WasteLog } from '@/lib/types';
import { X, Save, AlertTriangle, Camera } from 'lucide-react';
import { useAuth as useAuthContext } from '@/lib/contexts/AuthContext';

interface WasteModalProps {
    isOpen: boolean;
    onClose: () => void;
    stockItem: StockItem | null;
}

export default function WasteModal({ isOpen, onClose, stockItem }: WasteModalProps) {
    const { addWasteLog } = useInventory();
    const { currentStaff, user } = useAuthContext();

    const [quantity, setQuantity] = useState<number>(0);
    const [reason, setReason] = useState<WasteLog['reason']>('expired');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
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
        <Modal isOpen={isOpen} onClose={onClose} title={`Report Waste: ${stockItem.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Quantity Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity Wasted ({stockItem.unit})
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
                        Current Stock: {stockItem.currentQuantity} {stockItem.unit}
                    </p>
                </div>

                {/* Cost Analysis (Auto-calculated) */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-red-600 font-bold">Total Loss (Estimate)</p>
                        <p className="text-xs text-red-500">Based on cost: BND {costPerUnit.toFixed(2)} / {stockItem.unit}</p>
                    </div>
                    <p className="text-xl font-bold text-red-700">
                        BND {totalLoss.toFixed(2)}
                    </p>
                </div>

                {/* Reason Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value as any)}
                        className="select select-bordered w-full"
                    >
                        <option value="expired">Expired / Spilled</option>
                        <option value="burned">Burnedt / Cooked Wrong</option>
                        <option value="customer_return">Customer Return</option>
                        <option value="staff_meal">Staff Meal</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="textarea textarea-bordered w-full"
                        placeholder="Additional details..."
                        rows={2}
                    />
                </div>

                <div className="modal-action">
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-error text-white"
                        disabled={isSubmitting || quantity <= 0}
                    >
                        {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : <AlertTriangle size={18} className="mr-2" />}
                        Confirm Waste
                    </button>
                </div>
            </form>
        </Modal>
    );
}
