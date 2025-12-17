import React from 'react';
import Modal from '@/components/Modal';
import { ClaimRequest } from '@/lib/types';
import { getClaimTypeLabel, getStatusLabel, getStatusColor } from '@/lib/staff-portal-data';
import {
    DollarSign,
    Calendar,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Receipt,
    Download
} from 'lucide-react';

interface ClaimDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    claim: ClaimRequest | null;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    isApprover?: boolean; // If true, show approve/reject buttons
    isProcessing?: boolean;
}

export default function ClaimDetailModal({
    isOpen,
    onClose,
    claim,
    onApprove,
    onReject,
    isApprover = false,
    isProcessing = false
}: ClaimDetailModalProps) {
    if (!claim) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Butiran Tuntutan"
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
                        <span className={`badge badge-${getStatusColor(claim.status)}`} style={{ fontSize: '1rem' }}>
                            {getStatusLabel(claim.status)}
                        </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Jumlah</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                            BND {claim.amount.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Main Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block">Pemohon</label>
                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>{claim.staffName}</div>
                    </div>

                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block">Jenis Tuntutan</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                background: 'var(--primary-light)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary)'
                            }}>
                                <DollarSign size={14} />
                            </div>
                            {getClaimTypeLabel(claim.type)}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block">Tarikh Tuntutan</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} className="text-gray-400" />
                            {claim.claimDate}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-1 block">Dihantar Pada</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={16} className="text-gray-400" />
                            {new Date(claim.createdAt).toLocaleDateString('ms-MY', {
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
                        borderRadius: 'var(--radius-md)'
                    }}>
                        {claim.description}
                    </div>
                </div>

                {/* Attachments / Receipts */}
                {claim.receiptUrls && claim.receiptUrls.length > 0 && (
                    <div className="form-group">
                        <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center gap-2">
                            <Receipt size={16} />
                            Bukti / Resit
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {claim.receiptUrls.map((url, index) => (
                                <div key={index} style={{
                                    position: 'relative',
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden',
                                    border: '1px solid var(--gray-200)',
                                    aspectRatio: '16/9'
                                }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`Receipt ${index + 1}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                                    />
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-light"
                                        style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', padding: '0.25rem 0.5rem' }}
                                    >
                                        <Download size={14} /> View Full
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Approval/Rejection Info */}
                {claim.status === 'rejected' && claim.rejectionReason && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <div className="font-semibold flex items-center gap-2 mb-1">
                            <XCircle size={16} />
                            Ditolak
                        </div>
                        <p className="text-sm">{claim.rejectionReason}</p>
                        {claim.approverName && (
                            <p className="text-xs mt-2 opacity-75">Oleh: {claim.approverName}</p>
                        )}
                    </div>
                )}

                {claim.status === 'approved' && claim.approverName && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        <div className="font-semibold flex items-center gap-2 mb-1">
                            <CheckCircle size={16} />
                            Diluluskan
                        </div>
                        <p className="text-sm">Oleh: {claim.approverName} pada {claim.approvedAt ? new Date(claim.approvedAt).toLocaleDateString() : ''}</p>
                    </div>
                )}

                {/* Action Buttons for Approver */}
                {isApprover && claim.status === 'pending' && onApprove && onReject && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                        <button
                            className="btn btn-danger"
                            onClick={() => onReject(claim.id)}
                            disabled={isProcessing}
                            style={{ flex: 1 }}
                        >
                            <XCircle size={18} />
                            Tolak
                        </button>
                        <button
                            className="btn btn-success"
                            onClick={() => onApprove(claim.id)}
                            disabled={isProcessing}
                            style={{ flex: 1 }}
                        >
                            <CheckCircle size={18} />
                            Luluskan
                        </button>
                    </div>
                )}

                {/* Close Button for Non-Approver or Non-Pending */}
                {(!isApprover || claim.status !== 'pending') && (
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
