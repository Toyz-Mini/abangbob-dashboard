'use client';

import { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import { StaffTraining, TrainingStatus } from '@/lib/types';
import {
    GraduationCap,
    Plus,
    Calendar,
    User,
    Award,
    Trash2,
    Edit2,
    CheckCircle,
    AlertTriangle,
    Filter,
    Clock,
    FileCheck,
} from 'lucide-react';

const CATEGORIES: { value: StaffTraining['category']; label: string }[] = [
    { value: 'food_safety', label: 'Keselamatan Makanan' },
    { value: 'health_safety', label: 'Kesihatan & Keselamatan' },
    { value: 'customer_service', label: 'Perkhidmatan Pelanggan' },
    { value: 'technical', label: 'Teknikal' },
    { value: 'compliance', label: 'Pematuhan' },
    { value: 'other', label: 'Lain-lain' },
];

const STATUSES: { value: TrainingStatus; label: string; color: string }[] = [
    { value: 'scheduled', label: 'Dijadualkan', color: 'info' },
    { value: 'in_progress', label: 'Sedang Berjalan', color: 'warning' },
    { value: 'completed', label: 'Selesai', color: 'success' },
    { value: 'expired', label: 'Tamat Tempoh', color: 'danger' },
];

export default function TrainingPage() {
    const { user, isStaffLoggedIn, currentStaff } = useAuth();
    const {
        staff,
        staffTraining,
        addStaffTraining,
        updateStaffTraining,
        deleteStaffTraining,
        getExpiringTraining,
        isInitialized
    } = useStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState<StaffTraining | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStaffId, setFilterStaffId] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Form state
    const [form, setForm] = useState({
        staffId: '',
        courseName: '',
        provider: '',
        category: 'food_safety' as StaffTraining['category'],
        scheduledDate: '',
        completedAt: '',
        expiresAt: '',
        certificateNumber: '',
        notes: '',
        status: 'scheduled' as TrainingStatus,
    });

    // Filter training records
    const filteredTraining = useMemo(() => {
        return staffTraining.filter(t => {
            if (filterStaffId !== 'all' && t.staffId !== filterStaffId) return false;
            if (filterCategory !== 'all' && t.category !== filterCategory) return false;
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [staffTraining, filterStaffId, filterCategory, filterStatus]);

    // Stats
    const totalRecords = staffTraining.length;
    const completedCount = staffTraining.filter(t => t.status === 'completed').length;
    const expiringCount = getExpiringTraining(30).length;
    const expiredCount = staffTraining.filter(t => t.status === 'expired').length;

    const getCategoryLabel = (category: StaffTraining['category']) => {
        return CATEGORIES.find(c => c.value === category)?.label || category;
    };

    const getStatusInfo = (status: TrainingStatus) => {
        return STATUSES.find(s => s.value === status) || STATUSES[0];
    };

    const resetForm = () => {
        setForm({
            staffId: '',
            courseName: '',
            provider: '',
            category: 'food_safety',
            scheduledDate: '',
            completedAt: '',
            expiresAt: '',
            certificateNumber: '',
            notes: '',
            status: 'scheduled',
        });
    };

    const handleAdd = async () => {
        if (!form.staffId || !form.courseName.trim() || !form.provider.trim()) {
            alert('Sila isi semua maklumat yang diperlukan');
            return;
        }

        const selectedStaff = staff.find(s => s.id === form.staffId);
        if (!selectedStaff) return;

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 300));

        addStaffTraining({
            staffId: form.staffId,
            staffName: selectedStaff.name,
            courseName: form.courseName.trim(),
            provider: form.provider.trim(),
            category: form.category,
            scheduledDate: form.scheduledDate || undefined,
            completedAt: form.completedAt || undefined,
            expiresAt: form.expiresAt || undefined,
            certificateNumber: form.certificateNumber.trim() || undefined,
            notes: form.notes.trim() || undefined,
            status: form.status,
        });

        resetForm();
        setShowAddModal(false);
        setIsProcessing(false);
    };

    const handleEdit = async () => {
        if (!selectedTraining || !form.courseName.trim()) return;

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 300));

        updateStaffTraining(selectedTraining.id, {
            courseName: form.courseName.trim(),
            provider: form.provider.trim(),
            category: form.category,
            scheduledDate: form.scheduledDate || undefined,
            completedAt: form.completedAt || undefined,
            expiresAt: form.expiresAt || undefined,
            certificateNumber: form.certificateNumber.trim() || undefined,
            notes: form.notes.trim() || undefined,
            status: form.status,
        });

        setShowEditModal(false);
        setSelectedTraining(null);
        setIsProcessing(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Padam rekod latihan ini?')) return;
        deleteStaffTraining(id);
    };

    const handleMarkComplete = (training: StaffTraining) => {
        updateStaffTraining(training.id, {
            status: 'completed',
            completedAt: new Date().toISOString().split('T')[0],
        });
    };

    const openEditModal = (training: StaffTraining) => {
        setSelectedTraining(training);
        setForm({
            staffId: training.staffId,
            courseName: training.courseName,
            provider: training.provider,
            category: training.category,
            scheduledDate: training.scheduledDate || '',
            completedAt: training.completedAt?.split('T')[0] || '',
            expiresAt: training.expiresAt?.split('T')[0] || '',
            certificateNumber: training.certificateNumber || '',
            notes: training.notes || '',
            status: training.status,
        });
        setShowEditModal(true);
    };

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
                            <GraduationCap size={28} color="var(--primary)" />
                            Latihan & Sijil
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Track latihan staf dan sijil dengan tarikh luput
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Plus size={18} />
                        Tambah Latihan
                    </button>
                </div>

                {/* Stats */}
                <div className="content-grid cols-4" style={{ marginBottom: '2rem' }}>
                    <StatCard
                        label="Jumlah Rekod"
                        value={totalRecords}
                        icon={FileCheck}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Selesai"
                        value={completedCount}
                        icon={CheckCircle}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Hampir Luput (30 hari)"
                        value={expiringCount}
                        change={expiringCount > 0 ? "perlu perhatian" : "tiada"}
                        changeType={expiringCount > 0 ? "negative" : "positive"}
                        icon={Clock}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Tamat Tempoh"
                        value={expiredCount}
                        change={expiredCount > 0 ? "perlu refresh" : "tiada"}
                        changeType={expiredCount > 0 ? "negative" : "positive"}
                        icon={AlertTriangle}
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
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">Semua Kategori</option>
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                    <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">Semua Status</option>
                        {STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>

                {/* Training List */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Senarai Latihan & Sijil</div>
                    </div>

                    {filteredTraining.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <GraduationCap size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>Tiada rekod latihan</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Staf</th>
                                        <th>Kursus</th>
                                        <th>Kategori</th>
                                        <th>Tarikh</th>
                                        <th>Luput</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTraining.map(training => {
                                        const statusInfo = getStatusInfo(training.status);
                                        const isExpiringSoon = training.expiresAt && new Date(training.expiresAt) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                                        return (
                                            <tr key={training.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <User size={14} />
                                                        {training.staffName}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{training.courseName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{training.provider}</div>
                                                </td>
                                                <td>
                                                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                                        {getCategoryLabel(training.category)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {training.completedAt ? (
                                                        <span>{new Date(training.completedAt).toLocaleDateString('ms-MY')}</span>
                                                    ) : training.scheduledDate ? (
                                                        <span style={{ color: 'var(--warning)' }}>{new Date(training.scheduledDate).toLocaleDateString('ms-MY')}</span>
                                                    ) : '-'}
                                                </td>
                                                <td>
                                                    {training.expiresAt ? (
                                                        <span style={{ color: isExpiringSoon ? 'var(--danger)' : 'inherit', fontWeight: isExpiringSoon ? 600 : 400 }}>
                                                            {new Date(training.expiresAt).toLocaleDateString('ms-MY')}
                                                            {isExpiringSoon && <AlertTriangle size={12} style={{ marginLeft: '0.25rem', display: 'inline' }} />}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${statusInfo.color}`}>{statusInfo.label}</span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        {training.status !== 'completed' && training.status !== 'expired' && (
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => handleMarkComplete(training)}
                                                                title="Tandakan Selesai"
                                                            >
                                                                <CheckCircle size={14} />
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => openEditModal(training)}
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleDelete(training.id)}
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
                    title="Tambah Latihan"
                    maxWidth="550px"
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
                            <label className="form-label">Kategori *</label>
                            <select
                                className="form-select"
                                value={form.category}
                                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as StaffTraining['category'] }))}
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nama Kursus *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.courseName}
                            onChange={(e) => setForm(prev => ({ ...prev, courseName: e.target.value }))}
                            placeholder="Contoh: Food Safety Level 1"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Pembekal/Institusi *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.provider}
                            onChange={(e) => setForm(prev => ({ ...prev, provider: e.target.value }))}
                            placeholder="Contoh: JPMC"
                        />
                    </div>

                    <div className="content-grid cols-2">
                        <div className="form-group">
                            <label className="form-label">Status *</label>
                            <select
                                className="form-select"
                                value={form.status}
                                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as TrainingStatus }))}
                            >
                                {STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">No. Sijil</label>
                            <input
                                type="text"
                                className="form-input"
                                value={form.certificateNumber}
                                onChange={(e) => setForm(prev => ({ ...prev, certificateNumber: e.target.value }))}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="content-grid cols-3">
                        <div className="form-group">
                            <label className="form-label">Tarikh Jadual</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.scheduledDate}
                                onChange={(e) => setForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tarikh Selesai</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.completedAt}
                                onChange={(e) => setForm(prev => ({ ...prev, completedAt: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tarikh Luput</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.expiresAt}
                                onChange={(e) => setForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Catatan</label>
                        <textarea
                            className="form-input"
                            value={form.notes}
                            onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                            rows={2}
                            placeholder="Optional"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button
                            className="btn btn-outline"
                            onClick={() => setShowAddModal(false)}
                            disabled={isProcessing}
                            style={{ flex: 1 }}
                        >
                            Batal
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleAdd}
                            disabled={isProcessing || !form.staffId || !form.courseName.trim() || !form.provider.trim()}
                            style={{ flex: 1 }}
                        >
                            {isProcessing ? <LoadingSpinner size="sm" /> : 'Simpan'}
                        </button>
                    </div>
                </Modal>

                {/* Edit Modal */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => !isProcessing && setShowEditModal(false)}
                    title="Edit Latihan"
                    maxWidth="550px"
                >
                    <div className="form-group">
                        <label className="form-label">Staf</label>
                        <input type="text" className="form-input" value={selectedTraining?.staffName || ''} disabled />
                    </div>

                    <div className="content-grid cols-2">
                        <div className="form-group">
                            <label className="form-label">Nama Kursus *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={form.courseName}
                                onChange={(e) => setForm(prev => ({ ...prev, courseName: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Pembekal *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={form.provider}
                                onChange={(e) => setForm(prev => ({ ...prev, provider: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="content-grid cols-2">
                        <div className="form-group">
                            <label className="form-label">Kategori</label>
                            <select
                                className="form-select"
                                value={form.category}
                                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as StaffTraining['category'] }))}
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={form.status}
                                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as TrainingStatus }))}
                            >
                                {STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="content-grid cols-2">
                        <div className="form-group">
                            <label className="form-label">Tarikh Selesai</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.completedAt}
                                onChange={(e) => setForm(prev => ({ ...prev, completedAt: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tarikh Luput</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.expiresAt}
                                onChange={(e) => setForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button
                            className="btn btn-outline"
                            onClick={() => setShowEditModal(false)}
                            disabled={isProcessing}
                            style={{ flex: 1 }}
                        >
                            Batal
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleEdit}
                            disabled={isProcessing || !form.courseName.trim()}
                            style={{ flex: 1 }}
                        >
                            {isProcessing ? <LoadingSpinner size="sm" /> : 'Kemaskini'}
                        </button>
                    </div>
                </Modal>
            </div>
        </MainLayout>
    );
}
