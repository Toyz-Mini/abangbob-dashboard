'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { useAuth } from '../../lib/contexts/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { X, Lock, Unlock, ArrowRight, ArrowLeft, CheckCircle, Package } from 'lucide-react';
import { StockItem } from '../../lib/types';

interface ShiftWizardModalProps {
    isOpen: boolean;
    onClose: (success?: boolean) => void;
    mode: 'open' | 'close';
}

export default function ShiftWizardModal({ isOpen, onClose, mode }: ShiftWizardModalProps) {
    const { openRegister, closeRegister, currentRegister, inventory, adjustStock, getTodayOrders, orders } = useStore();
    const { user, currentStaff } = useAuth();

    // Steps: 0: Cash, 1: Stock, 2: Review
    const [step, setStep] = useState(0);

    // Form Data
    const [amount, setAmount] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [stockCounts, setStockCounts] = useState<{ [itemId: string]: string }>({});

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Filter "Critical" items that need counting
    const criticalItems = inventory.filter(item => item.countDaily);

    // DEBUG: Log inventory state
    useEffect(() => {
        if (isOpen) {
            console.log('[ShiftWizard] Inventory Size:', inventory.length);
            console.log('[ShiftWizard] Critical Items:', criticalItems.length);
            if (inventory.length > 0) {
                console.log('[ShiftWizard] Sample Item:', inventory[0]);
            }
        }
    }, [isOpen, inventory, criticalItems]);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setStep(0);
            setAmount('');
            setNotes('');
            setError('');
            setStockCounts({});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- Helper Logic ---
    let expectedCash = 0;
    let totalSales = 0;
    if (mode === 'close' && currentRegister) {
        // Simple calculation
        // const { orders } = useStore.getState(); // Removed: Accessing via hook instead
        const sessionOrders = orders.filter(o =>
            o.status === 'completed' &&
            o.paymentMethod === 'cash' &&
            new Date(o.createdAt) >= new Date(currentRegister.openedAt)
        );
        totalSales = sessionOrders.reduce((sum, o) => sum + o.total, 0);
        expectedCash = currentRegister.startCash + totalSales;
    }

    const handleNext = () => {
        setError('');
        if (step === 0) {
            // Validate Cash Input
            const numericAmount = parseFloat(amount);
            if (isNaN(numericAmount) || numericAmount < 0) {
                setError('Sila masukkan jumlah duit yang sah.');
                return;
            }
            if (criticalItems.length > 0) {
                setStep(1);
            } else {
                setStep(2); // Skip stock if no items to count
            }
        } else if (step === 1) {
            // Validate Stock (Optional: force all filled?)
            // For now, allow partial, blank = unchanged/skipped
            setStep(2);
        }
    };

    const handleBack = () => {
        setError('');
        setStep(Math.max(0, step - 1));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');

        const staffId = currentStaff?.id || user?.id;
        if (!staffId) {
            setError('Staff ID error. Please relogin.');
            setIsSubmitting(false);
            return;
        }

        const numericAmount = parseFloat(amount);

        try {
            // 1. Process Stock Counts first
            // Log adjustments if variance found (or just log 'check' - for now we just adjust)
            // Ideally we'd have a specific "StockCount" log, but adjustStock works.
            Object.entries(stockCounts).forEach(([itemId, qtyStr]) => {
                const qty = parseFloat(qtyStr);
                if (!isNaN(qty)) {
                    const item = inventory.find(i => i.id === itemId);
                    if (item) {
                        const diff = qty - item.currentQuantity;
                        if (diff !== 0) {
                            adjustStock(
                                itemId,
                                Math.abs(diff),
                                diff > 0 ? 'in' : 'out',
                                `Shift ${mode === 'open' ? 'Opening' : 'Closing'} Count`
                            );
                        }
                    }
                }
            });

            // 2. Process Register
            if (mode === 'open') {
                const result = await openRegister(numericAmount, staffId, notes);
                if (!result.success) throw new Error(result.error);
            } else {
                const result = await closeRegister(numericAmount, staffId, notes);
                if (!result.success) throw new Error(result.error);
            }

            onClose(true);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Steps ---

    const renderStep0_Cash = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {mode === 'close' && currentRegister && (
                <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-2 border border-blue-100 mb-4">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Float Mula:</span>
                        <span className="font-bold">{formatCurrency(currentRegister.startCash)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Jualan Tunai:</span>
                        <span className="font-bold text-green-600">+{formatCurrency(totalSales)}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-lg">
                        <span className="text-blue-900">Patut Ada:</span>
                        <span className="text-blue-600">{formatCurrency(expectedCash)}</span>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    {mode === 'open' ? 'Masukkan Duit Float (Opening)' : 'Kira Duit Cashier (Closing)'}
                </label>
                <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">$</span>
                    <input
                        type="number"
                        autoFocus
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="form-input pl-10 text-2xl font-bold !bg-white !text-gray-900 !border-gray-300 h-16 w-full"
                        placeholder="0.00"
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>
                {mode === 'close' && amount && (
                    <div className={`mt-2 text-right text-sm font-bold ${parseFloat(amount) - expectedCash === 0 ? 'text-green-600' : 'text-red-500'}`}>
                        Variance: {formatCurrency(parseFloat(amount) - expectedCash)}
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nota (Optional)</label>
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="form-input !bg-white !text-gray-900 !border-gray-300"
                    placeholder="Contoh: Duit float pecah, ada extra syiling..."
                    rows={2}
                />
            </div>
        </div>
    );

    const renderStep1_Stock = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-amber-800 text-sm mb-2">
                Sila kira stok fizikal untuk barang kritikal ini. (Blind Count - Sistem tidak menunjuk kuantiti sebenar).
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                {criticalItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                            <div className="font-bold text-gray-800">{item.name}</div>
                            <div className="text-xs text-gray-500">Unit: {item.unit}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={stockCounts[item.id] || ''}
                                onChange={e => setStockCounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="form-input w-24 text-center font-bold !bg-white !text-gray-900 !border-gray-300"
                                placeholder="?"
                            />
                            <span className="text-xs font-bold text-gray-500 w-8">{item.unit}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep2_Review = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Sedia untuk {mode === 'open' ? 'Buka' : 'Tutup'}?</h3>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 border border-gray-200">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Total Cash:</span>
                    <span className="font-bold text-lg">{formatCurrency(parseFloat(amount) || 0)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Stock Checked:</span>
                    <span className="font-bold">{Object.keys(stockCounts).length} / {criticalItems.length} Items</span>
                </div>
                {notes && (
                    <div className="text-sm text-gray-500 italic pt-2">
                        &quot;{notes}&quot;
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md !bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className={`p-6 border-b border-gray-100 flex items-center justify-between shrink-0 ${mode === 'open' ? 'bg-green-50' : 'bg-amber-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${mode === 'open' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                            {mode === 'open' ? <Unlock size={24} /> : <Lock size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold !text-gray-900">
                                {mode === 'open' ? 'Buka Kedai (Wizard)' : 'Tutup Kedai (Wizard)'}
                            </h2>
                            <p className="text-sm !text-gray-500">
                                Step {step + 1} of {criticalItems.length > 0 ? 3 : 2}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => onClose()} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto grow">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
                            {error}
                        </div>
                    )}

                    {step === 0 && renderStep0_Cash()}
                    {step === 1 && renderStep1_Stock()}
                    {step === 2 && renderStep2_Review()}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-between gap-3">
                    {step > 0 ? (
                        <button
                            onClick={handleBack}
                            className="px-6 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                    ) : (
                        <div /> // Spacer
                    )}

                    {step < (criticalItems.length > 0 ? 2 : 1) ? (
                        <button
                            onClick={handleNext}
                            className={`px-8 py-3 rounded-lg font-bold text-white transition-all shadow-lg flex items-center gap-2 ${mode === 'open' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                        >
                            Next <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`px-8 py-3 rounded-lg font-bold text-white transition-all shadow-lg flex items-center gap-2 ${mode === 'open' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'Processing...' : (mode === 'open' ? 'Confirm Open' : 'Confirm Close')}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
