'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import { PerformanceReview, ReviewPeriod, ReviewStatus } from '@/lib/types';
import {
    Star,
    Plus,
    Calendar,
    User,
    Trash2,
    Edit2,
    CheckCircle,
    Filter,
    Clock,
    TrendingUp,
    Award,
} from 'lucide-react';

const PERIODS: { value: ReviewPeriod; label: string }[] = [
    { value: 'monthly', label: 'Bulanan' },
    { value: 'quarterly', label: 'Suku Tahunan' },
    { value: 'semi_annual', label: '6 Bulan' },
    { value: 'annual', label: 'Tahunan' },
];

const STATUSES: { value: ReviewStatus; label: string; color: string }[] = [
    { value: 'draft', label: 'Draf', color: 'warning' },
    { value: 'pending_acknowledgement', label: 'Pending', color: 'info' },
    { value: 'completed', label: 'Selesai', color: 'success' },
];

const RATING_CRITERIA = [
    { key: 'punctuality', label: 'Ketepatan Masa' },
    { key: 'teamwork', label: 'Kerja Berpasukan' },
    { key: 'productivity', label: 'Produktiviti' },
    { key: 'communication', label: 'Komunikasi' },
    { key: 'initiative', label: 'Inisiatif' },
] as const;

export default function PerformancePage() {
    const { user } = useAuth();
    const {
        staff,
        performanceReviews,
        addPerformanceReview,
        updatePerformanceReview,
        deletePerformanceReview,
        isInitialized
    } = useStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStaffId, setFilterStaffId] = useState<string>('all');
    const [filterPeriod, setFilterPeriod] = useState<string>('all');

    // Form state
    const [form, setForm] = useState({
        staffId: '',
        period: 'quarterly' as ReviewPeriod,
        periodStart: '',
        periodEnd: '',
        punctuality: 3,
        teamwork: 3,
        productivity: 3,
        communication: 3,
        initiative: 3,
        strengths: '',
        improvements: '',
        goals: '',
        comments: '',
        status: 'draft' as ReviewStatus,
    });

    // Filter reviews
    const filteredReviews = useMemo(() => {
        return performanceReviews.filter(r => {
            if (filterStaffId !== 'all' && r.staffId !== filterStaffId) return false;
            if (filterPeriod !== 'all' && r.period !== filterPeriod) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [performanceReviews, filterStaffId, filterPeriod]);

    // Stats
    const totalReviews = performanceReviews.length;
    const avgRating = performanceReviews.length > 0
        ? (performanceReviews.reduce((sum, r) => sum + r.overallRating, 0) / performanceReviews.length).toFixed(1)
        : '0.0';
    const pendingCount = performanceReviews.filter(r => r.status === 'pending_acknowledgement').length;
    const thisYearCount = performanceReviews.filter(r => new Date(r.createdAt).getFullYear() === new Date().getFullYear()).length;

    const getPeriodLabel = (period: ReviewPeriod) => {
        return PERIODS.find(p => p.value === period)?.label || period;
    };

    const getStatusInfo = (status: ReviewStatus) => {
        return STATUSES.find(s => s.value === status) || STATUSES[0];
    };

    const calculateOverallRating = () => {
        return Math.round((form.punctuality + form.teamwork + form.productivity + form.communication + form.initiative) / 5);
    };

    const resetForm = () => {
        setForm({
            staffId: '',
            period: 'quarterly',
            periodStart: '',
            periodEnd: '',
            punctuality: 3,
            teamwork: 3,
            productivity: 3,
            communication: 3,
            initiative: 3,
            strengths: '',
            improvements: '',
            goals: '',
            comments: '',
            status: 'draft',
        });
    };

    const handleAdd = async () => {
        if (!form.staffId || !form.periodStart || !form.periodEnd) {
            alert('Sila isi semua maklumat yang diperlukan');
            return;
        }

        const selectedStaff = staff.find(s => s.id === form.staffId);
        if (!selectedStaff || !user) return;

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 300));

        addPerformanceReview({
            staffId: form.staffId,
            staffName: selectedStaff.name,
            reviewerId: user.id,
            reviewerName: user.name || 'Admin',
            period: form.period,
            periodStart: form.periodStart,
            periodEnd: form.periodEnd,
            overallRating: calculateOverallRating(),
            punctuality: form.punctuality,
            teamwork: form.teamwork,
            productivity: form.productivity,
            communication: form.communication,
            initiative: form.initiative,
            strengths: form.strengths.trim() || undefined,
            improvements: form.improvements.trim() || undefined,
            goals: form.goals.trim() || undefined,
            comments: form.comments.trim() || undefined,
            status: form.status,
        });

        resetForm();
        setShowAddModal(false);
        setIsProcessing(false);
    };

    const handleEdit = async () => {
        if (!selectedReview) return;

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 300));

        updatePerformanceReview(selectedReview.id, {
            period: form.period,
            periodStart: form.periodStart,
            periodEnd: form.periodEnd,
            overallRating: calculateOverallRating(),
            punctuality: form.punctuality,
            teamwork: form.teamwork,
            productivity: form.productivity,
            communication: form.communication,
            initiative: form.initiative,
            strengths: form.strengths.trim() || undefined,
            improvements: form.improvements.trim() || undefined,
            goals: form.goals.trim() || undefined,
            comments: form.comments.trim() || undefined,
            status: form.status,
        });

        setShowEditModal(false);
        setSelectedReview(null);
        setIsProcessing(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Padam rekod penilaian ini?')) return;
        deletePerformanceReview(id);
    };

    const openEditModal = (review: PerformanceReview) => {
        setSelectedReview(review);
        setForm({
            staffId: review.staffId,
            period: review.period,
            periodStart: review.periodStart.split('T')[0],
            periodEnd: review.periodEnd.split('T')[0],
            punctuality: review.punctuality,
            teamwork: review.teamwork,
            productivity: review.productivity,
            communication: review.communication,
            initiative: review.initiative,
            strengths: review.strengths || '',
            improvements: review.improvements || '',
            goals: review.goals || '',
            comments: review.comments || '',
            status: review.status,
        });
        setShowEditModal(true);
    };

    const renderRatingInput = (key: keyof typeof form, label: string, value: number, onChange: (val: number) => void) => (
        <div className="form-group" key={key}>
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
                            <TrendingUp size={28} color="var(--primary)" />
                            Performance Review
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Penilaian prestasi staf dengan 5 kriteria
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Plus size={18} />
                        Buat Penilaian
                    </button>
                </div>

                {/* Stats */}
                <div className="content-grid cols-4" style={{ marginBottom: '2rem' }}>
                    <StatCard
                        label="Jumlah Penilaian"
                        value={totalReviews}
                        icon={Award}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Purata Rating"
                        value={avgRating}
                        icon={Star}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Pending"
                        value={pendingCount}
                        change={pendingCount > 0 ? "perlu acknowledge" : "tiada"}
                        changeType={pendingCount > 0 ? "neutral" : "positive"}
                        icon={Clock}
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
                            value={filterStaffId}
                            onChange={(e) => setFilterStaffId(e.target.value)}
                            style={{ minWidth: '150px' }}
                        >
                            <option value="all">Semua Staf</option>
                            {staff.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <select
                        className="form-select"
                        value={filterPeriod}
                        onChange={(e) => setFilterPeriod(e.target.value)}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">Semua Tempoh</option>
                        {PERIODS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                </div>

                {/* Reviews List */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Senarai Penilaian</div>
                    </div>

                    {filteredReviews.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <TrendingUp size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>Tiada rekod penilaian</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Staf</th>
                                        <th>Tempoh</th>
                                        <th>Rating</th>
                                        <th>Penilai</th>
                                        <th>Status</th>
                                        <th>Tarikh</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReviews.map(review => {
                                        const statusInfo = getStatusInfo(review.status);
                                        return (
                                            <tr key={review.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <User size={14} />
                                                        {review.staffName}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                                        {getPeriodLabel(review.period)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {renderStars(review.overallRating)}
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {review.reviewerName}
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${statusInfo.color}`}>{statusInfo.label}</span>
                                                </td>
                                                <td style={{ fontSize: '0.85rem' }}>
                                                    {new Date(review.createdAt).toLocaleDateString('ms-MY')}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => { setSelectedReview(review); setShowViewModal(true); }}
                                                            title="Lihat"
                                                        >
                                                            <Star size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => openEditModal(review)}
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleDelete(review.id)}
                                                            title="Padam"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Add Modal */}
                <Modal
                    isOpen={showAddModal}
                    onClose={() => !isProcessing && setShowAddModal(false)}
                    title="Buat Penilaian Prestasi"
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
                            <label className="form-label">Tempoh *</label>
                            <select
                                className="form-select"
                                value={form.period}
                                onChange={(e) => setForm(prev => ({ ...prev, period: e.target.value as ReviewPeriod }))}
                            >
                                {PERIODS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="content-grid cols-2">
                        <div className="form-group">
                            <label className="form-label">Tarikh Mula *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.periodStart}
                                onChange={(e) => setForm(prev => ({ ...prev, periodStart: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tarikh Tamat *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.periodEnd}
                                onChange={(e) => setForm(prev => ({ ...prev, periodEnd: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>Rating (1-5)</h4>
                        <div className="content-grid cols-2" style={{ gap: '0.75rem' }}>
                            {renderRatingInput('punctuality', 'Ketepatan Masa', form.punctuality, (v) => setForm(prev => ({ ...prev, punctuality: v })))}
                            {renderRatingInput('teamwork', 'Kerja Berpasukan', form.teamwork, (v) => setForm(prev => ({ ...prev, teamwork: v })))}
                            {renderRatingInput('productivity', 'Produktiviti', form.productivity, (v) => setForm(prev => ({ ...prev, productivity: v })))}
                            {renderRatingInput('communication', 'Komunikasi', form.communication, (v) => setForm(prev => ({ ...prev, communication: v })))}
                            {renderRatingInput('initiative', 'Inisiatif', form.initiative, (v) => setForm(prev => ({ ...prev, initiative: v })))}
                        </div>
                        <div style={{ marginTop: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>
                            Overall: {calculateOverallRating()}/5 {renderStars(calculateOverallRating())}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Kekuatan</label>
                        <textarea className="form-input" value={form.strengths} onChange={(e) => setForm(prev => ({ ...prev, strengths: e.target.value }))} rows={2} placeholder="Optional" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Perlu Diperbaiki</label>
                        <textarea className="form-input" value={form.improvements} onChange={(e) => setForm(prev => ({ ...prev, improvements: e.target.value }))} rows={2} placeholder="Optional" />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-outline" onClick={() => setShowAddModal(false)} disabled={isProcessing} style={{ flex: 1 }}>
                            Batal
                        </button>
                        <button className="btn btn-primary" onClick={handleAdd} disabled={isProcessing || !form.staffId || !form.periodStart || !form.periodEnd} style={{ flex: 1 }}>
                            {isProcessing ? <LoadingSpinner size="sm" /> : 'Simpan'}
                        </button>
                    </div>
                </Modal>

                {/* View Modal */}
                <Modal
                    isOpen={showViewModal}
                    onClose={() => setShowViewModal(false)}
                    title={`Penilaian: ${selectedReview?.staffName}`}
                    maxWidth="500px"
                >
                    {selectedReview && (
                        <div>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                {renderStars(selectedReview.overallRating)}
                                <div style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>{selectedReview.overallRating}/5</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                {RATING_CRITERIA.map(({ key, label }) => (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                                        <span>{label}</span>
                                        <strong>{selectedReview[key]}/5</strong>
                                    </div>
                                ))}
                            </div>

                            {selectedReview.strengths && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <strong>Kekuatan:</strong>
                                    <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>{selectedReview.strengths}</p>
                                </div>
                            )}

                            {selectedReview.improvements && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <strong>Perlu Diperbaiki:</strong>
                                    <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>{selectedReview.improvements}</p>
                                </div>
                            )}

                            <button className="btn btn-outline" onClick={() => setShowViewModal(false)} style={{ width: '100%', marginTop: '1rem' }}>
                                Tutup
                            </button>
                        </div>
                    )}
                </Modal>

                {/* Edit Modal - simplified */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => !isProcessing && setShowEditModal(false)}
                    title="Edit Penilaian"
                    maxWidth="500px"
                >
                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <div className="content-grid cols-2" style={{ gap: '0.75rem' }}>
                            {renderRatingInput('punctuality', 'Ketepatan Masa', form.punctuality, (v) => setForm(prev => ({ ...prev, punctuality: v })))}
                            {renderRatingInput('teamwork', 'Kerja Berpasukan', form.teamwork, (v) => setForm(prev => ({ ...prev, teamwork: v })))}
                            {renderRatingInput('productivity', 'Produktiviti', form.productivity, (v) => setForm(prev => ({ ...prev, productivity: v })))}
                            {renderRatingInput('communication', 'Komunikasi', form.communication, (v) => setForm(prev => ({ ...prev, communication: v })))}
                            {renderRatingInput('initiative', 'Inisiatif', form.initiative, (v) => setForm(prev => ({ ...prev, initiative: v })))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as ReviewStatus }))}>
                            {STATUSES.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-outline" onClick={() => setShowEditModal(false)} disabled={isProcessing} style={{ flex: 1 }}>
                            Batal
                        </button>
                        <button className="btn btn-primary" onClick={handleEdit} disabled={isProcessing} style={{ flex: 1 }}>
                            {isProcessing ? <LoadingSpinner size="sm" /> : 'Kemaskini'}
                        </button>
                    </div>
                </Modal>
            </div>
        </MainLayout>
    );
}
