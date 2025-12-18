'use client';

import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useAuth } from '../../lib/contexts/AuthContext';
import { Lock, Unlock } from 'lucide-react';
import ShiftWizardModal from './ShiftWizardModal';

interface RegisterStatusProps {
    onOpenClick?: () => void;
    onCloseClick?: () => void;
    className?: string;
}

export default function RegisterStatus({ onOpenClick, onCloseClick, className = '' }: RegisterStatusProps) {
    const { currentRegister } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'open' | 'close'>('open');

    // Handle Open Register (Clicking "Register Closed")
    const handleOpenClick = () => {
        setModalMode('open');
        setIsModalOpen(true);
        if (onOpenClick) onOpenClick();
    };

    // Handle Close Register (Clicking "Register Open")
    const handleCloseClick = () => {
        setModalMode('close');
        setIsModalOpen(true);
        if (onCloseClick) onCloseClick();
    };

    const handleModalClose = (success?: boolean) => {
        setIsModalOpen(false);
        if (success) {
            // Optional: Show success toast or refresh logic if needed
        }
    };

    if (!currentRegister) {
        return (
            <>
                <button
                    onClick={handleOpenClick}
                    className={`flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors ${className}`}
                >
                    <Lock size={14} />
                    <span>Register Closed</span>
                </button>
                <ShiftWizardModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    mode="open"
                />
            </>
        );
    }

    const startTime = new Date(currentRegister.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <button
                onClick={handleCloseClick}
                className={`flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors ${className}`}
                title="Click to Close Register"
            >
                <Unlock size={14} />
                <span>Open ({startTime})</span>
            </button>
            <ShiftWizardModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                mode="close"
            />
        </>
    );
}
