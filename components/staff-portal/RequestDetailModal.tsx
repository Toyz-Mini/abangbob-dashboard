import React from 'react';
import Modal from '@/components/Modal';
import { StaffRequest } from '@/lib/types';
import { getStatusColor } from '@/lib/staff-portal-data';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import {
    FileText,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Hash,
    User,
    MessageSquare
} from 'lucide-react';

interface RequestDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: StaffRequest | null;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    isApprover?: boolean;
    isProcessing?: boolean;
}

export default function RequestDetailModal({
    isOpen,
    onClose,
    request,
    onApprove,
    onReject,
    isApprover = false,
    isProcessing = false
}: RequestDetailModalProps) {
    const { t } = useTranslation();

    if (!request) return null;

    const getStatusLabelText = (status: string) => {
        return t(`staffPortal.requests.status.${status}`);
    };

    const getCategoryLabelText = (category: string) => {
        return t(`staffPortal.requests.categories.${category}`);
    };

    const getPriorityLabelText = (priority: string) => {
        return t(`staffPortal.requests.priority.${priority}`);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('staffPortal.requests.detail.title')}
            maxWidth="600px"
        >
            <div className="space-y-6">
                {/* Header Status Bar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--gray-200)'
                }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            {t('staffPortal.requests.detail.status')}
                        </div>
                        <span className={`badge badge-${getStatusColor(request.status)}`} style={{ fontSize: '1rem' }}>
                            {getStatusLabelText(request.status)}
                        </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            {t('staffPortal.requests.detail.priority')}
                        </div>
                        <span className={`badge badge-${request.priority === 'high' ? 'danger' : request.priority === 'medium' ? 'warning' : 'info'}`}>
                            {getPriorityLabelText(request.priority)}
                        </span>
                    </div>
                </div>

                {/* Main Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                            {t('staffPortal.requests.detail.subject')}
                        </label>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{request.title}</div>
                    </div>

                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                            {t('staffPortal.requests.detail.category')}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                background: 'var(--secondary-light)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--secondary)'
                            }}>
                                <Hash size={14} />
                            </div>
                            {getCategoryLabelText(request.category)}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                            {t('staffPortal.requests.detail.applicant')}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} className="text-gray-400" />
                            {request.staffName}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                            {t('staffPortal.requests.detail.date')}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={16} className="text-gray-400" />
                            {new Date(request.createdAt).toLocaleDateString('ms-MY', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="form-group">
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                        {t('staffPortal.requests.detail.description')}
                    </label>
                    <div style={{
                        padding: '1rem',
                        background: 'var(--background)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {request.description}
                    </div>
                </div>

                {/* Response / Notes */}
                {request.responseNote && (
                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block flex items-center gap-2">
                            <MessageSquare size={16} />
                            {t('staffPortal.requests.detail.feedback')}
                        </label>
                        <div style={{
                            padding: '1rem',
                            background: request.status === 'rejected' ? '#fef2f2' : '#f0fdf4',
                            border: `1px solid ${request.status === 'rejected' ? '#fecaca' : '#bbf7d0'}`,
                            borderRadius: 'var(--radius-md)',
                            color: request.status === 'rejected' ? '#991b1b' : '#166534'
                        }}>
                            {request.responseNote}
                            {request.assignedTo && request.status !== 'rejected' && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
                                    {t('staffPortal.requests.detail.handledBy', { name: request.assigneeName ?? '' })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons for Approver */}
                {isApprover && (request.status === 'pending' || (request.status === 'in_progress' && request.category === 'shift_swap')) && onApprove && onReject && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                        <button
                            className="btn btn-danger"
                            onClick={() => onReject(request.id)}
                            disabled={isProcessing}
                            style={{ flex: 1 }}
                        >
                            <XCircle size={18} />
                            {t('staffPortal.requests.detail.reject')}
                        </button>
                        <button
                            className="btn btn-success"
                            onClick={() => onApprove(request.id)}
                            disabled={isProcessing}
                            style={{ flex: 1 }}
                        >
                            <CheckCircle size={18} />
                            {t('staffPortal.requests.detail.approve')}
                        </button>
                    </div>
                )}

                {/* Close Button */}
                {(!isApprover || request.status !== 'pending') && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button className="btn btn-outline" onClick={onClose}>
                            {t('staffPortal.requests.detail.close')}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
