'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { LateReasonCategory, LateReasonCode } from '@/lib/types';
import { fetchLateReasonCategories } from '@/lib/supabase/operations';
import { formatMinutesAsTime } from '@/lib/timezone-utils';
import { AlertTriangle } from 'lucide-react';

interface LateReasonModalProps {
    isOpen: boolean;
    lateMinutes: number;
    onSubmit: (reasonCode: LateReasonCode, reasonNote?: string) => void;
    onCancel: () => void;
}

export default function LateReasonModal({
    isOpen,
    lateMinutes,
    onSubmit,
    onCancel
}: LateReasonModalProps) {
    const [categories, setCategories] = useState<LateReasonCategory[]>([]);
    const [selectedCode, setSelectedCode] = useState<LateReasonCode | ''>('');
    const [reasonNote, setReasonNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Load categories
    useEffect(() => {
        async function loadCategories() {
            setLoading(true);
            try {
                const data = await fetchLateReasonCategories();
                setCategories(data);
            } catch (error) {
                console.error('Error loading late reason categories:', error);
                // Fallback categories
                setCategories([
                    { id: '1', code: 'TRAFFIC', name: 'Traffic Jam', nameMalay: 'Kesesakan Lalu Lintas', icon: '🚗', requiresNote: false, isActive: true, sortOrder: 1 },
                    { id: '2', code: 'MEDICAL', name: 'Medical', nameMalay: 'Temu-Janji Perubatan', icon: '🏥', requiresNote: false, isActive: true, sortOrder: 2 },
                    { id: '3', code: 'FAMILY', name: 'Family Emergency', nameMalay: 'Kecemasan Keluarga', icon: '🏠', requiresNote: false, isActive: true, sortOrder: 3 },
                    { id: '4', code: 'TRANSPORT', name: 'Transport Issue', nameMalay: 'Masalah Pengangkutan', icon: '🚌', requiresNote: false, isActive: true, sortOrder: 4 },
                    { id: '5', code: 'WEATHER', name: 'Bad Weather', nameMalay: 'Cuaca Buruk', icon: '🌧️', requiresNote: false, isActive: true, sortOrder: 5 },
                    { id: '6', code: 'VEHICLE', name: 'Vehicle Breakdown', nameMalay: 'Kerosakan Kenderaan', icon: '🔧', requiresNote: false, isActive: true, sortOrder: 6 },
                    { id: '7', code: 'OTHER', name: 'Other', nameMalay: 'Lain-lain', icon: '📝', requiresNote: true, isActive: true, sortOrder: 99 },
                ]);
            } finally {
                setLoading(false);
            }
        }

        if (isOpen) {
            loadCategories();
            setSelectedCode('');
            setReasonNote('');
        }
    }, [isOpen]);

    const selectedCategory = categories.find(c => c.code === selectedCode);
    const requiresNote = selectedCategory?.requiresNote || false;

    const handleSubmit = () => {
        if (!selectedCode) return;
        if (requiresNote && !reasonNote.trim()) return;

        setSubmitting(true);
        onSubmit(selectedCode as LateReasonCode, reasonNote.trim() || undefined);
        setSubmitting(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title="Anda Lewat"
            maxWidth="450px"
        >
            <div className="animate-fade-in">
                {/* Warning Banner */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: 'var(--warning-light, #fef3c7)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.5rem'
                }}>
                    <AlertTriangle size={24} style={{ color: 'var(--warning, #f59e0b)' }} />
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--warning-dark, #92400e)' }}>
                            Anda lewat {formatMinutesAsTime(lateMinutes)}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Sila pilih sebab kelewatan anda
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="loading-spinner" />
                        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Loading...</p>
                    </div>
                ) : (
                    <>
                        {/* Category Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '0.75rem',
                            marginBottom: '1.5rem'
                        }}>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCode(cat.code)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: selectedCode === cat.code
                                            ? '2px solid var(--primary)'
                                            : '2px solid var(--gray-200)',
                                        background: selectedCode === cat.code
                                            ? 'var(--primary-light, #dbeafe)'
                                            : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                                    <span style={{
                                        fontSize: '0.875rem',
                                        fontWeight: selectedCode === cat.code ? 600 : 400,
                                        color: selectedCode === cat.code ? 'var(--primary)' : 'var(--text-primary)',
                                        textAlign: 'center'
                                    }}>
                                        {cat.nameMalay}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Note Field (required for OTHER) */}
                        {selectedCode && (
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">
                                    Catatan Tambahan {requiresNote && <span style={{ color: 'var(--danger)' }}>*</span>}
                                </label>
                                <textarea
                                    className="form-input"
                                    placeholder={requiresNote ? 'Sila nyatakan sebab...' : 'Catatan tambahan (optional)...'}
                                    value={reasonNote}
                                    onChange={(e) => setReasonNote(e.target.value)}
                                    rows={3}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={onCancel}
                                disabled={submitting}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={!selectedCode || (requiresNote && !reasonNote.trim()) || submitting}
                            >
                                {submitting ? 'Processing...' : 'Hantar & Clock In'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
