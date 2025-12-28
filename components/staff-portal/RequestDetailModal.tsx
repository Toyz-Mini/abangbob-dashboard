import React from 'react';
import Modal from '@/components/Modal';
import { StaffRequest } from '@/lib/types';
import { getRequestCategoryLabel, getStatusLabel, getStatusColor } from '@/lib/staff-portal-data';
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
    if (!request) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Butiran Permohonan"
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
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Status</div>
                        <span className={`badge badge-${getStatusColor(request.status)}`} style={{ fontSize: '1rem' }}>
                            {getStatusLabel(request.status)}
                        </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Prioriti</div>
                        <span className={`badge badge-${request.priority === 'high' ? 'danger' : request.priority === 'medium' ? 'warning' : 'info'}`}>
                            {request.priority === 'high' ? 'Urgent' : request.priority === 'medium' ? 'Sederhana' : 'Rendah'}
                        </span>
                    </div>
                </div>

                {/* Main Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block">Tajuk</label>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{request.title}</div>
                    </div>

                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block">Kategori</label>
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
                            {getRequestCategoryLabel(request.category)}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block">Pemohon</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} className="text-gray-400" />
                            {request.staffName}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block">Dihantar Pada</label>
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
                    <label className="text-sm font-medium text-gray-500 mb-1 block">Keterangan</label>
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
                            Maklum Balas / Nota
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
                                    Dikendalikan oleh: {request.assigneeName}
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
                            Tolak
                        </button>
                        <button
                            className="btn btn-success"
                            onClick={() => onApprove(request.id)}
                            disabled={isProcessing}
                            style={{ flex: 1 }}
                        >
                            <CheckCircle size={18} />
                            Selesai / Lulus
                        </button>
                    </div>
                )}

                {/* Close Button */}
                {(!isApprover || request.status !== 'pending') && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button className="btn btn-outline" onClick={onClose}>
                            Tutup
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
