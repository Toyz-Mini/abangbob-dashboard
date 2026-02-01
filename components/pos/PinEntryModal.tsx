import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Delete } from 'lucide-react';

interface PinEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    requiredRole?: 'Manager' | 'Admin';
}

export default function PinEntryModal({
    isOpen,
    onClose,
    onSuccess,
    title = 'Manager Authorization Required',
    requiredRole = 'Manager'
}: PinEntryModalProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError('');
            setIsVerifying(false);
        }
    }, [isOpen]);

    const handleNumberClick = (num: number) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
            setError('');
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    const handleVerify = async () => {
        if (pin.length < 4) {
            setError('Enter at least 4 digits');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            // Import dynamically to avoid client-side import issues if verified server-side
            const verifyPin = (await import('@/app/actions/verify-pin')).verifyPin;

            const result = await verifyPin(pin);

            if (result.success) {
                // Check role requirement
                if (requiredRole === 'Manager' && result.role !== 'Manager' && result.role !== 'Admin') {
                    setError('Insufficient permissions. Manager required.');
                } else {
                    onSuccess();
                    onClose();
                }
            } else {
                setError(result.error || 'Invalid PIN');
            }
        } catch (err) {
            console.error(err);
            setError('Verification failed');
        } finally {
            setIsVerifying(false);
        }
    };

    // Auto-verify when 6 digits reached? Optional. Let's stick to manual enter or 6 digits.
    useEffect(() => {
        if (pin.length === 6) {
            handleVerify();
        }
    }, [pin]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-gray-800 font-bold">
                        <div className="bg-red-100 p-1.5 rounded-lg text-red-600">
                            <Lock size={18} />
                        </div>
                        <span>{title}</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Display */}
                <div className="p-6 flex flex-col items-center gap-4">
                    <div className="w-full flex justify-center gap-4 mb-2">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full border-2 transition-all ${i < pin.length
                                        ? 'bg-gray-800 border-gray-800'
                                        : 'border-gray-200'
                                    }`}
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm font-bold animate-pulse">
                            {error}
                        </div>
                    )}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-1 p-4 bg-gray-50">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className="h-16 bg-white rounded-lg shadow-sm border border-gray-200 text-2xl font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all outline-none"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="flex items-center justify-center">
                        {/* Empty or Back */}
                    </div>
                    <button
                        onClick={() => handleNumberClick(0)}
                        className="h-16 bg-white rounded-lg shadow-sm border border-gray-200 text-2xl font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all outline-none"
                    >
                        0
                    </button>
                    <button
                        onClick={handleBackspace}
                        className="h-16 bg-red-50 rounded-lg shadow-sm border border-red-100 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all outline-none"
                    >
                        <Delete size={24} />
                    </button>
                </div>

                {/* Footer */}
                {pin.length > 0 && pin.length < 6 && (
                    <div className="p-4 bg-white border-t border-gray-100">
                        <button
                            onClick={handleVerify}
                            disabled={isVerifying}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold active:scale-95 transition-transform"
                        >
                            {isVerifying ? 'Checking...' : 'Enter'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
