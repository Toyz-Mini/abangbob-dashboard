'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import { ExitInterview, ExitReason } from '@/lib/types';
import {
    UserMinus,
    Plus,
    Calendar,
    User,
    Trash2,
    Star,
    ThumbsUp,
    ThumbsDown,
    Filter,
    MessageSquare,
} from 'lucide-react';

const REASONS: { value: ExitReason; label: string }[] = [
    { value: 'resignation', label: 'Meletak Jawatan' },
    { value: 'termination', label: 'Diberhentikan' },
    { value: 'contract_end', label: 'Tamat Kontrak' },
    { value: 'retirement', label: 'Pencen' },
    { value: 'other', label: 'Lain-lain' },
];

export default function ExitInterviewPage() {
    const { user } = useAuth();
    const {
        staff,
        exitInterviews,
        addExitInterview,
        deleteExitInterview,
        isInitialized
    } = useStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState<ExitInterview | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterReason, setFilterReason] = useState<string>('all');

    // Form state
    const [form, setForm] = useState({
        staffId: '',
        exitDate: new Date().toISOString().split('T')[0],
        reason: 'resignation' as ExitReason,
        reasonDetails: '',
        overallExperience: 3,
        managementRating: 3,
        workEnvironment: 3,
        careerGrowth: 3,
        whatLiked: '',
        whatDisliked: '',
        suggestions: '',
        wouldRecommend: true,
    });

    // Filter interviews
    const filteredInterviews = useMemo(() => {
        return exitInterviews.filter(i => {
            if (filterReason !== 'all' && i.reason !== filterReason) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [exitInterviews, filterReason]);

    // Stats
    const totalInterviews = exitInterviews.length;
    const avgRating = exitInterviews.length > 0
        ? (exitInterviews.reduce((sum, i) => sum + i.overallExperience, 0) / exitInterviews.length).toFixed(1)
        : '0.0';
    const wouldRecommendPercent = exitInterviews.length > 0
        ? Math.round((exitInterviews.filter(i => i.wouldRecommend).length / exitInterviews.length) * 100)
        : 0;
    const thisYearCount = exitInterviews.filter(i => new Date(i.createdAt).getFullYear() === new Date().getFullYear()).length;

    const getReasonLabel = (reason: ExitReason) => {
        return REASONS.find(r => r.value === reason)?.label || reason;
    };

    const resetForm = () => {
        setForm({
            staffId: '',
            exitDate: new Date().toISOString().split('T')[0],
            reason: 'resignation',
            reasonDetails: '',
            overallExperience: 3,
            managementRating: 3,
            workEnvironment: 3,
            careerGrowth: 3,
            whatLiked: '',
            whatDisliked: '',
            suggestions: '',
            wouldRecommend: true,
        });
    };

    const handleAdd = async () => {
        if (!form.staffId) {
            alert('Sila pilih staf');
            return;
        }

        const selectedStaff = staff.find(s => s.id === form.staffId);
        if (!selectedStaff || !user) return;

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 300));

        addExitInterview({
            staffId: form.staffId,
            staffName: selectedStaff.name,
            exitDate: form.exitDate,
            reason: form.reason,
            reasonDetails: form.reasonDetails.trim() || undefined,
            overallExperience: form.overallExperience,
            managementRating: form.managementRating,
            workEnvironment: form.workEnvironment,
            careerGrowth: form.careerGrowth,
            whatLiked: form.whatLiked.trim() || undefined,
            whatDisliked: form.whatDisliked.trim() || undefined,
            suggestions: form.suggestions.trim() || undefined,
            wouldRecommend: form.wouldRecommend,
            interviewedBy: user.id,
            interviewedByName: user.name || 'Admin',
        });

        resetForm();
        setShowAddModal(false);
        setIsProcessing(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Padam rekod exit interview ini?')) return;
        deleteExitInterview(id);
        if (selectedInterview?.id === id) {
            setShowViewModal(false);
            setSelectedInterview(null);
        }
    };

    const renderRatingInput = (label: string, value: number, onChange: (val: number) => void) => (
        <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                {label}
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{value}/5</span>
            </label>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[1, 2, 3, 4, 5].map(rating => (
                    <button
                        key={rating}
                        type="button"
                        onClick={() => onChange(rating)}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: `2px solid ${value >= rating ? 'var(--primary)' : 'var(--border)'}`,
                            background: value >= rating ? 'var(--primary)' : 'transparent',
                            color: value >= rating ? 'white' : 'var(--text)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        {rating}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStars = (rating: number) => (
        <div style={{ display: 'flex', gap: '0.1rem' }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={14} fill={i <= rating ? 'var(--warning)' : 'none'} color={i <= rating ? 'var(--warning)' : 'var(--text-muted)'} />
            ))}
        </div>
    );

    if (!isInitialized) {
        return (
            <MainLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <LoadingSpinner />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="animate-fade-in">
                {/* Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <UserMinus size={28} color="var(--primary)" />
                            Exit Interview
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Rekod feedback daripada staf yang keluar
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Plus size={18} />
                        Rekod Baru
                    </button>
                </div>

                {/* Stats */}
                <div className="content-grid cols-4" style={{ marginBottom: '2rem' }}>
                    <StatCard
                        label="Total Interviews"
                        value={totalInterviews}
                        icon={MessageSquare}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Purata Rating"
                        value={avgRating}
                        icon={Star}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Would Recommend"
                        value={`${wouldRecommendPercent}%`}
                        icon={ThumbsUp}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Tahun Ini"
                        value={thisYearCount}
                        icon={Calendar}
                        gradient="subtle"
                    />
                </div>

                {/* Filters */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={16} color="var(--text-secondary)" />
                        <select
                            className="form-select"
                            value={filterReason}
                            onChange={(e) => setFilterReason(e.target.value)}
                            style={{ minWidth: '150px' }}
                        >
                            <option value="all">Semua Sebab</option>
                            {REASONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Interviews List */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Senarai Exit Interview</div>
                    </div>

                    {filteredInterviews.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <UserMinus size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>Tiada rekod exit interview</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Staf</th>
                                        <th>Tarikh Keluar</th>
                                        <th>Sebab</th>
                                        <th>Rating</th>
                                        <th>Recommend?</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInterviews.map(interview => (
                                        <tr key={interview.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <User size={14} />
                                                    {interview.staffName}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>
                                                {new Date(interview.exitDate).toLocaleDateString('ms-MY')}
                                            </td>
                                            <td>
                                                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                                    {getReasonLabel(interview.reason)}
                                                </span>
                                            </td>
                                            <td>{renderStars(interview.overallExperience)}</td>
                                            <td>
                                                {interview.wouldRecommend ? (
                                                    <ThumbsUp size={16} color="var(--success)" />
                                                ) : (
                                                    <ThumbsDown size={16} color="var(--danger)" />
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => { setSelectedInterview(interview); setShowViewModal(true); }}
                                                        title="Lihat"
                                                    >
                                                        <MessageSquare size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(interview.id)}
                                                        title="Padam"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Add Modal */}
                <Modal
                    isOpen={showAddModal}
                    onClose={() => !isProcessing && setShowAddModal(false)}
                    title="Rekod Exit Interview"
                    maxWidth="600px"
                >
                    <div className="content-grid cols-2">
                        <div className="form-group">
                            <label className="form-label">Staf *</label>
                            <select
                                className="form-select"
                                value={form.staffId}
                                onChange={(e) => setForm(prev => ({ ...prev, staffId: e.target.value }))}
                            >
                                <option value="">-- Pilih Staf --</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tarikh Keluar</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.exitDate}
                                onChange={(e) => setForm(prev => ({ ...prev, exitDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="content-grid cols-2">
                        <div className="form-group">
                            <label className="form-label">Sebab Keluar *</label>
                            <select
                                className="form-select"
                                value={form.reason}
                                onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value as ExitReason }))}
                            >
                                {REASONS.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Would Recommend?</label>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="radio" checked={form.wouldRecommend} onChange={() => setForm(prev => ({ ...prev, wouldRecommend: true }))} />
                                    <ThumbsUp size={16} /> Ya
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="radio" checked={!form.wouldRecommend} onChange={() => setForm(prev => ({ ...prev, wouldRecommend: false }))} />
                                    <ThumbsDown size={16} /> Tidak
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>Rating (1-5)</h4>
                        <div className="content-grid cols-2" style={{ gap: '0.75rem' }}>
                            {renderRatingInput('Pengalaman Keseluruhan', form.overallExperience, (v) => setForm(prev => ({ ...prev, overallExperience: v })))}
                            {renderRatingInput('Pengurusan', form.managementRating, (v) => setForm(prev => ({ ...prev, managementRating: v })))}
                            {renderRatingInput('Persekitaran Kerja', form.workEnvironment, (v) => setForm(prev => ({ ...prev, workEnvironment: v })))}
                            {renderRatingInput('Perkembangan Kerjaya', form.careerGrowth, (v) => setForm(prev => ({ ...prev, careerGrowth: v })))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Apa yang disukai?</label>
                        <textarea className="form-input" value={form.whatLiked} onChange={(e) => setForm(prev => ({ ...prev, whatLiked: e.target.value }))} rows={2} placeholder="Optional" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Apa yang tidak disukai?</label>
                        <textarea className="form-input" value={form.whatDisliked} onChange={(e) => setForm(prev => ({ ...prev, whatDisliked: e.target.value }))} rows={2} placeholder="Optional" />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-outline" onClick={() => setShowAddModal(false)} disabled={isProcessing} style={{ flex: 1 }}>
                            Batal
                        </button>
                        <button className="btn btn-primary" onClick={handleAdd} disabled={isProcessing || !form.staffId} style={{ flex: 1 }}>
                            {isProcessing ? <LoadingSpinner size="sm" /> : 'Simpan'}
                        </button>
                    </div>
                </Modal>

                {/* View Modal */}
                <Modal
                    isOpen={showViewModal}
                    onClose={() => setShowViewModal(false)}
                    title={`Exit Interview: ${selectedInterview?.staffName}`}
                    maxWidth="500px"
                >
                    {selectedInterview && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span className="badge badge-info">{getReasonLabel(selectedInterview.reason)}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {new Date(selectedInterview.exitDate).toLocaleDateString('ms-MY')}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                                    <span>Overall</span>
                                    <strong>{selectedInterview.overallExperience}/5</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                                    <span>Management</span>
                                    <strong>{selectedInterview.managementRating}/5</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                                    <span>Environment</span>
                                    <strong>{selectedInterview.workEnvironment}/5</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                                    <span>Growth</span>
                                    <strong>{selectedInterview.careerGrowth}/5</strong>
                                </div>
                            </div>

                            {selectedInterview.whatLiked && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <strong>👍 Apa yang disukai:</strong>
                                    <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>{selectedInterview.whatLiked}</p>
                                </div>
                            )}

                            {selectedInterview.whatDisliked && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <strong>👎 Apa yang tidak disukai:</strong>
                                    <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>{selectedInterview.whatDisliked}</p>
                                </div>
                            )}

                            <div style={{ padding: '0.75rem', background: selectedInterview.wouldRecommend ? 'rgba(var(--success-rgb), 0.1)' : 'rgba(var(--danger-rgb), 0.1)', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
                                {selectedInterview.wouldRecommend ? (
                                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Akan mengesyorkan syarikat</span>
                                ) : (
                                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>❌ Tidak akan mengesyorkan</span>
                                )}
                            </div>

                            <button className="btn btn-outline" onClick={() => setShowViewModal(false)} style={{ width: '100%' }}>
                                Tutup
                            </button>
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
}
