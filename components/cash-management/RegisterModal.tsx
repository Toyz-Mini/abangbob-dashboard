'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { useAuth } from '../../lib/contexts/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { X, DollarSign, Calculator, Lock, Unlock, AlertTriangle } from 'lucide-react';

interface RegisterModalProps {
    isOpen: boolean;
    onClose: (success?: boolean) => void;
    mode: 'open' | 'close';
}

export default function RegisterModal({ isOpen, onClose, mode }: RegisterModalProps) {
    const { openRegister, closeRegister, currentRegister, getTodayOrders, getTodayCashFlow } = useStore();
    const { user, currentStaff } = useAuth();

    const [amount, setAmount] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setNotes('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount < 0) {
            setError('Sila masukkan jumlah yang sah');
            setIsSubmitting(false);
            return;
        }

        const staffId = currentStaff?.id || user?.id;
        if (!staffId) {
            setError('Staff ID not found. Please re-login.');
            setIsSubmitting(false);
            return;
        }

        try {
            if (mode === 'open') {
                const result = await openRegister(numericAmount, staffId, notes);
                if (!result.success) throw new Error(result.error);
            } else {
                const result = await closeRegister(numericAmount, staffId, notes);
                if (!result.success) throw new Error(result.error);
            }
            onClose(true);
        } catch (err: any) {
            console.error('Register action failed:', err);
            setError(err.message || 'Ralat berlaku. Sila cuba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Calculate expected cash for closing
    let expectedCash = 0;
    let totalSales = 0;

    if (mode === 'close' && currentRegister) {
        // Basic calculation: Start Cash + Cash Sales
        // TODO: Filter orders strictly by time range of this session if needed
        // For now, simplistically using today's cash sales or just summing up orders since openedAt
        // Ideally store should provide specific session sales stats.

        // We can't easily get precise session sales without querying orders > openedAt.
        // Let's do a quick client-side filtering of `orders`
        const { orders } = useStore(); // Need to destructure orders inside component

        const sessionOrders = orders.filter(o =>
            o.status === 'completed' &&
            o.paymentMethod === 'cash' &&
            new Date(o.createdAt) >= new Date(currentRegister.openedAt)
        );

        totalSales = sessionOrders.reduce((sum, o) => sum + o.total, 0);
        expectedCash = currentRegister.startCash + totalSales;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

                {/* Header */}
                <div className={`p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between ${mode === 'open' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${mode === 'open' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                            {mode === 'open' ? <Unlock size={24} /> : <Lock size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {mode === 'open' ? 'Buka Register' : 'Tutup Register'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {mode === 'open' ? 'Masukkan duit float permulaan' : 'Sahkan duit tunai terkini'}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => onClose()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {mode === 'close' && currentRegister && (
                        <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Masa Buka:</span>
                                <span className="font-medium">{new Date(currentRegister.openedAt).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Duit Float (Mula):</span>
                                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(currentRegister.startCash)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Jualan Tunai (Sesi Ini):</span>
                                <span className="font-medium text-green-600">+{formatCurrency(totalSales)}</span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold">
                                <span className="text-gray-700 dark:text-gray-300">Jangkaan Tunai:</span>
                                <span className="text-blue-600 dark:text-blue-400">{formatCurrency(expectedCash)}</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {mode === 'open' ? 'Jumlah Float (BND)' : 'Jumlah Tunai Di Tangan (BND)'}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 font-bold">$</span>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="form-input pl-8 text-lg font-bold"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        {mode === 'close' && amount && (
                            <div className="flex items-center gap-2 text-sm mt-2">
                                <span className="text-gray-500">Variance:</span>
                                <span className={`font-bold ${parseFloat(amount) - expectedCash === 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatCurrency(parseFloat(amount) - expectedCash)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nota (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="form-input text-sm"
                            placeholder={mode === 'open' ? "Contoh: Duit pecah secukupnya" : "Contoh: Ada duit syiling extra"}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            <AlertTriangle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 py-3 px-4 text-white rounded-lg font-bold shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                ${mode === 'open' ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-200 dark:shadow-none' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200 dark:shadow-none'}
              `}
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {mode === 'open' ? <Unlock size={18} /> : <Lock size={18} />}
                                    {mode === 'open' ? 'Buka Register' : 'Tutup & Simpan'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
