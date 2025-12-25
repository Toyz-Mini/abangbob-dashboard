'use client';

import { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import { DisciplinaryAction, DisciplinaryActionType } from '@/lib/types';
import {
    AlertTriangle,
    Plus,
    Calendar,
    User,
    FileText,
    Trash2,
    Edit2,
    CheckCircle,
    XCircle,
    AlertOctagon,
    Filter,
} from 'lucide-react';

const ACTION_TYPES: { value: DisciplinaryActionType; label: string; color: string }[] = [
    { value: 'verbal_warning', label: 'Amaran Lisan', color: 'warning' },
    { value: 'written_warning', label: 'Amaran Bertulis', color: 'warning' },
    { value: 'final_warning', label: 'Amaran Akhir', color: 'danger' },
    { value: 'suspension', label: 'Penggantungan', color: 'danger' },
    { value: 'termination', label: 'Penamatan', color: 'danger' },
];

export default function DisciplinaryPage() {
    const { user, isStaffLoggedIn, currentStaff } = useAuth();
    const {
        staff,
        disciplinaryActions,
        addDisciplinaryAction,
        updateDisciplinaryAction,
        deleteDisciplinaryAction,
        refreshDisciplinaryActions,
        isInitialized
    } = useStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAction, setSelectedAction] = useState<DisciplinaryAction | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStaffId, setFilterStaffId] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');

    // Form state
    const [form, setForm] = useState({
        staffId: '',
        type: 'verbal_warning' as DisciplinaryActionType,
        reason: '',
        details: '',
    });

    // Get current user info for issuer
    const currentUserId = user?.id || currentStaff?.id || '1';
    const currentUserName = user?.email || currentStaff?.name || 'Admin';

    // Filter actions
    const filteredActions = useMemo(() => {
        return disciplinaryActions.filter(a => {
            if (filterStaffId !== 'all' && a.staffId !== filterStaffId) return false;
            if (filterType !== 'all' && a.type !== filterType) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [disciplinaryActions, filterStaffId, filterType]);

    // Stats
    const totalActions = disciplinaryActions.length;
    const pendingAck = disciplinaryActions.filter(a => !a.acknowledgedAt).length;
    const thisMonth = disciplinaryActions.filter(a => {
        const date = new Date(a.createdAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const getTypeInfo = (type: DisciplinaryActionType) => {
        return ACTION_TYPES.find(t => t.value === type) || ACTION_TYPES[0];
    };

    const resetForm = () => {
        setForm({
            staffId: '',
            type: 'verbal_warning',
            reason: '',
            details: '',
        });
    };

    const handleAdd = async () => {
        if (!form.staffId || !form.reason.trim()) {
            alert('Sila isi semua maklumat yang diperlukan');
            return;
        }

        const selectedStaff = staff.find(s => s.id === form.staffId);
        if (!selectedStaff) return;

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 300));

        addDisciplinaryAction({
            staffId: form.staffId,
            staffName: selectedStaff.name,
            type: form.type,
            reason: form.reason.trim(),
            details: form.details.trim() || undefined,
            issuedBy: currentUserId,
            issuedByName: currentUserName,
            issuedAt: new Date().toISOString(),
        });

        resetForm();
        setShowAddModal(false);
        setIsProcessing(false);
    };

    const handleEdit = async () => {
        if (!selectedAction || !form.reason.trim()) return;

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 300));

        updateDisciplinaryAction(selectedAction.id, {
            type: form.type,
            reason: form.reason.trim(),
            details: form.details.trim() || undefined,
        });

        setShowEditModal(false);
        setSelectedAction(null);
        setIsProcessing(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Padam rekod tindakan disiplin ini?')) return;
        deleteDisciplinaryAction(id);
    };

    const handleAcknowledge = async (id: string) => {
        updateDisciplinaryAction(id, {
            acknowledgedAt: new Date().toISOString(),
        });
    };

    const openEditModal = (action: DisciplinaryAction) => {
        setSelectedAction(action);
        setForm({
            staffId: action.staffId,
            type: action.type,
            reason: action.reason,
            details: action.details || '',
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
                            <AlertTriangle size={28} color="var(--warning)" />
                            Tindakan Disiplin
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Rekod amaran, penggantungan dan tindakan disiplin staf
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Plus size={18} />
                        Tambah Rekod
                    </button>
                </div>

                {/* Stats */}
                <div className="content-grid cols-3" style={{ marginBottom: '2rem' }}>
                    <StatCard
                        label="Jumlah Rekod"
                        value={totalActions}
                        icon={FileText}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Belum Diakui"
                        value={pendingAck}
                        change={pendingAck > 0 ? "perlu tindakan" : "semua diakui"}
                        changeType={pendingAck > 0 ? "negative" : "positive"}
                        icon={AlertOctagon}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Bulan Ini"
                        value={thisMonth}
                        change="rekod baru"
                        changeType="neutral"
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
                            style={{ minWidth: '180px' }}
                        >
                            <option value="all">Semua Staf</option>
                            {staff.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <select
                        className="form-select"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ minWidth: '180px' }}
                    >
                        <option value="all">Semua Jenis</option>
                        {ACTION_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* Actions List */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Senarai Tindakan Disiplin</div>
                    </div>

                    {filteredActions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <AlertTriangle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>Tiada rekod tindakan disiplin</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                            {filteredActions.map(action => {
                                const typeInfo = getTypeInfo(action.type);
                                return (
                                    <div
                                        key={action.id}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--gray-50)',
                                            border: `1px solid var(--${typeInfo.color})`,
                                            borderLeft: `4px solid var(--${typeInfo.color})`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                    <User size={18} color="var(--text-secondary)" />
                                                    <strong style={{ fontSize: '1.1rem' }}>{action.staffName}</strong>
                                                    <span className={`badge badge-${typeInfo.color}`}>{typeInfo.label}</span>
                                                    {action.acknowledgedAt ? (
                                                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Diakui</span>
                                                    ) : (
                                                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Belum Diakui</span>
                                                    )}
                                                </div>
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    <strong>Sebab:</strong> {action.reason}
                                                </div>
                                                {action.details && (
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                        <strong>Butiran:</strong> {action.details}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <span>
                                                        <Calendar size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                                        {new Date(action.issuedAt).toLocaleDateString('ms-MY')}
                                                    </span>
                                                    <span>Dikeluarkan oleh: {action.issuedByName}</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {!action.acknowledgedAt && (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleAcknowledge(action.id)}
                                                        title="Tandakan Diakui"
                                                    >
                                                        <CheckCircle size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => openEditModal(action)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(action.id)}
                                                    title="Padam"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Add Modal */}
                <Modal
                    isOpen={showAddModal}
                    onClose={() => !isProcessing && setShowAddModal(false)}
                    title="Tambah Tindakan Disiplin"
                    maxWidth="500px"
                >
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
                        <label className="form-label">Jenis Tindakan *</label>
                        <select
                            className="form-select"
                            value={form.type}
                            onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as DisciplinaryActionType }))}
                        >
                            {ACTION_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sebab *</label>
                        <textarea
                            className="form-input"
                            value={form.reason}
                            onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                            rows={3}
                            placeholder="Nyatakan sebab tindakan disiplin..."
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Butiran Tambahan</label>
                        <textarea
                            className="form-input"
                            value={form.details}
                            onChange={(e) => setForm(prev => ({ ...prev, details: e.target.value }))}
                            rows={2}
                            placeholder="Maklumat tambahan (optional)..."
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
                            disabled={isProcessing || !form.staffId || !form.reason.trim()}
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
                    title="Edit Tindakan Disiplin"
                    maxWidth="500px"
                >
                    <div className="form-group">
                        <label className="form-label">Staf</label>
                        <input
                            type="text"
                            className="form-input"
                            value={selectedAction?.staffName || ''}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Jenis Tindakan *</label>
                        <select
                            className="form-select"
                            value={form.type}
                            onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as DisciplinaryActionType }))}
                        >
                            {ACTION_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sebab *</label>
                        <textarea
                            className="form-input"
                            value={form.reason}
                            onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Butiran Tambahan</label>
                        <textarea
                            className="form-input"
                            value={form.details}
                            onChange={(e) => setForm(prev => ({ ...prev, details: e.target.value }))}
                            rows={2}
                        />
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
                            disabled={isProcessing || !form.reason.trim()}
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
