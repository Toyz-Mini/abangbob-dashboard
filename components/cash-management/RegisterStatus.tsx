'use client';

import { useStore } from '../../lib/store';
import { Lock, Unlock, Clock } from 'lucide-react';

interface RegisterStatusProps {
    onOpenClick?: () => void;
    onCloseClick?: () => void;
    className?: string;
}

export default function RegisterStatus({ onOpenClick, onCloseClick, className = '' }: RegisterStatusProps) {
    const { currentRegister } = useStore();

    if (!currentRegister) {
        return (
            <button
                onClick={onOpenClick}
                className={`flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors ${className}`}
            >
                <Lock size={14} />
                <span>Register Closed</span>
            </button>
        );
    }

    const startTime = new Date(currentRegister.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <button
            onClick={onCloseClick}
            className={`flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors ${className}`}
            title="Click to Close Register"
        >
            <Unlock size={14} />
            <span>Open ({startTime})</span>
        </button>
    );
}
