'use client';

import { ReactNode } from 'react';
import Modal from './Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: 'primary' | 'danger' | 'success' | 'warning' | 'info';
    showCancel?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Sahkan',
    cancelText = 'Batal',
    type = 'primary',
    showCancel = true
}: ConfirmModalProps) {

    const getButtonClass = () => {
        switch (type) {
            case 'danger': return 'btn-danger';
            case 'success': return 'btn-success';
            case 'warning': return 'btn-warning';
            case 'info': return 'btn-info';
            default: return 'btn-primary';
        }
    };

    const getButtonStyles = () => {
        const baseStyles = {
            flex: 1,
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontWeight: 600,
            border: 'none',
        };

        switch (type) {
            case 'danger': return { ...baseStyles, background: 'var(--danger)', color: 'white' };
            case 'success': return { ...baseStyles, background: 'var(--success)', color: 'white' };
            case 'warning': return { ...baseStyles, background: 'var(--warning)', color: 'white' };
            case 'info': return { ...baseStyles, background: 'var(--info)', color: 'white' };
            default: return { ...baseStyles, background: 'var(--primary)', color: 'white' };
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth="400px"
        >
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                    marginBottom: '1.5rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    fontSize: '0.95rem'
                }}>
                    {message}
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    {showCancel && (
                        <button
                            className="btn btn-outline"
                            onClick={onClose}
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem' }}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        className="btn"
                        onClick={onConfirm || onClose}
                        style={getButtonStyles()}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
