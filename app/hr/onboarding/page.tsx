'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import { OnboardingChecklist, OnboardingItem, OnboardingStatus } from '@/lib/types';
import {
    ClipboardList,
    Plus,
    Calendar,
    User,
    Trash2,
    Edit2,
    CheckCircle,
    Circle,
    Filter,
    Clock,
    CheckSquare,
    Users,
} from 'lucide-react';

const DEFAULT_ITEMS: Omit<OnboardingItem, 'id'>[] = [
    { title: 'Lengkapkan borang HR', isCompleted: false },
    { title: 'Setup email & akaun', isCompleted: false },
    { title: 'Terima uniform & badge', isCompleted: false },
    { title: 'Tour outlet & pengenalan pasukan', isCompleted: false },
    { title: 'Latihan keselamatan', isCompleted: false },
    { title: 'Latihan POS', isCompleted: false },
    { title: 'Baca SOP & tanda akuan', isCompleted: false },
    { title: 'Buddy/mentor assigned', isCompleted: false },
];

const STATUSES: { value: OnboardingStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Belum Mula', color: 'warning' },
    { value: 'in_progress', label: 'Sedang Berjalan', color: 'info' },
    { value: 'completed', label: 'Selesai', color: 'success' },
];

export default function OnboardingPage() {
    const {
        staff,
        onboardingChecklists,
        addOnboardingChecklist,
        updateOnboardingChecklist,
        deleteOnboardingChecklist,
        isInitialized
    } = useStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<OnboardingChecklist | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Form state
    const [form, setForm] = useState({
        staffId: '',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
    });

    // Filter checklists
    const filteredChecklists = useMemo(() => {
        return onboardingChecklists.filter(c => {
            if (filterStatus !== 'all' && c.status !== filterStatus) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [onboardingChecklists, filterStatus]);

    // Stats
    const totalChecklists = onboardingChecklists.length;
    const inProgressCount = onboardingChecklists.filter(c => c.status === 'in_progress').length;
    const completedCount = onboardingChecklists.filter(c => c.status === 'completed').length;
    const overdueCount = onboardingChecklists.filter(c => {
        if (!c.dueDate || c.status === 'completed') return false;
        return new Date(c.dueDate) < new Date();
    }).length;

    const getStatusInfo = (status: OnboardingStatus) => {
        return STATUSES.find(s => s.value === status) || STATUSES[0];
    };

    const getProgress = (items: OnboardingItem[]) => {
        const completed = items.filter(i => i.isCompleted).length;
        return { completed, total: items.length, percent: Math.round((completed / items.length) * 100) };
    };

    const resetForm = () => {
        setForm({
            staffId: '',
            startDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            notes: '',
        });
    };

    const handleAdd = async () => {
        if (!form.staffId) {
            alert('Sila pilih staf');
            return;
        }

        const selectedStaff = staff.find(s => s.id === form.staffId);
        if (!selectedStaff) return;

        // Check if already has onboarding
        if (onboardingChecklists.some(c => c.staffId === form.staffId)) {
            alert('Staf ini sudah ada checklist onboarding');
            return;
        }

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 300));

        addOnboardingChecklist({
            staffId: form.staffId,
            staffName: selectedStaff.name,
            startDate: form.startDate,
            dueDate: form.dueDate || undefined,
            items: DEFAULT_ITEMS.map((item, idx) => ({
                ...item,
                id: `item_${Date.now()}_${idx}`,
            })),
            status: 'pending',
            notes: form.notes.trim() || undefined,
        });

        resetForm();
        setShowAddModal(false);
        setIsProcessing(false);
    };

    const handleToggleItem = (checklistId: string, itemId: string) => {
        const checklist = onboardingChecklists.find(c => c.id === checklistId);
        if (!checklist) return;

        const updatedItems = checklist.items.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    isCompleted: !item.isCompleted,
                    completedAt: !item.isCompleted ? new Date().toISOString() : undefined,
                };
            }
            return item;
        });

        // Auto-update status
        const allCompleted = updatedItems.every(i => i.isCompleted);
        const anyCompleted = updatedItems.some(i => i.isCompleted);
        const newStatus: OnboardingStatus = allCompleted ? 'completed' : anyCompleted ? 'in_progress' : 'pending';

        updateOnboardingChecklist(checklistId, { items: updatedItems, status: newStatus });

        if (selectedChecklist?.id === checklistId) {
            setSelectedChecklist({ ...selectedChecklist, items: updatedItems, status: newStatus });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Padam checklist ini?')) return;
        deleteOnboardingChecklist(id);
        if (selectedChecklist?.id === id) {
            setShowViewModal(false);
            setSelectedChecklist(null);
        }
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
                            <ClipboardList size={28} color="var(--primary)" />
                            Onboarding Checklist
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Track onboarding progress untuk staf baru
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Plus size={18} />
                        Staf Baru
                    </button>
                </div>

                {/* Stats */}
                <div className="content-grid cols-4" style={{ marginBottom: '2rem' }}>
                    <StatCard
                        label="Total Onboarding"
                        value={totalChecklists}
                        icon={Users}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Sedang Berjalan"
                        value={inProgressCount}
                        icon={Clock}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Selesai"
                        value={completedCount}
                        icon={CheckCircle}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Overdue"
                        value={overdueCount}
                        change={overdueCount > 0 ? "perlu follow up" : "tiada"}
                        changeType={overdueCount > 0 ? "negative" : "positive"}
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
                </div>

                {/* Checklists Grid */}
                {filteredChecklists.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <ClipboardList size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>Tiada checklist onboarding</p>
                    </div>
                ) : (
                    <div className="content-grid cols-3">
                        {filteredChecklists.map(checklist => {
                            const statusInfo = getStatusInfo(checklist.status);
                            const progress = getProgress(checklist.items);
                            const isOverdue = checklist.dueDate && checklist.status !== 'completed' && new Date(checklist.dueDate) < new Date();

                            return (
                                <div key={checklist.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setSelectedChecklist(checklist); setShowViewModal(true); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{checklist.staffName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                Mula: {new Date(checklist.startDate).toLocaleDateString('ms-MY')}
                                            </div>
                                        </div>
                                        <span className={`badge badge-${statusInfo.color}`}>{statusInfo.label}</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                            <span>Progress</span>
                                            <span style={{ fontWeight: 600 }}>{progress.completed}/{progress.total}</span>
                                        </div>
                                        <div style={{ background: 'var(--bg-secondary)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${progress.percent}%`,
                                                height: '100%',
                                                background: progress.percent === 100 ? 'var(--success)' : 'var(--primary)',
                                                transition: 'width 0.3s ease',
                                            }} />
                                        </div>
                                    </div>

                                    {isOverdue && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={12} /> Overdue
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add Modal */}
                <Modal
                    isOpen={showAddModal}
                    onClose={() => !isProcessing && setShowAddModal(false)}
                    title="Onboarding Staf Baru"
                    maxWidth="450px"
                >
                    <div className="form-group">
                        <label className="form-label">Staf *</label>
                        <select
                            className="form-select"
                            value={form.staffId}
                            onChange={(e) => setForm(prev => ({ ...prev, staffId: e.target.value }))}
                        >
                            <option value="">-- Pilih Staf Baru --</option>
                            {staff.filter(s => !onboardingChecklists.some(c => c.staffId === s.id)).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="content-grid cols-2">
                        <div className="form-group">
                            <label className="form-label">Tarikh Mula</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.startDate}
                                onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Target Selesai</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.dueDate}
                                onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
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

                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Checklist Items ({DEFAULT_ITEMS.length})</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {DEFAULT_ITEMS.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <CheckSquare size={12} /> {item.title}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-outline" onClick={() => setShowAddModal(false)} disabled={isProcessing} style={{ flex: 1 }}>
                            Batal
                        </button>
                        <button className="btn btn-primary" onClick={handleAdd} disabled={isProcessing || !form.staffId} style={{ flex: 1 }}>
                            {isProcessing ? <LoadingSpinner size="sm" /> : 'Mula Onboarding'}
                        </button>
                    </div>
                </Modal>

                {/* View Modal */}
                <Modal
                    isOpen={showViewModal}
                    onClose={() => setShowViewModal(false)}
                    title={`Onboarding: ${selectedChecklist?.staffName}`}
                    maxWidth="500px"
                >
                    {selectedChecklist && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span className={`badge badge-${getStatusInfo(selectedChecklist.status).color}`}>
                                    {getStatusInfo(selectedChecklist.status).label}
                                </span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {getProgress(selectedChecklist.items).completed}/{getProgress(selectedChecklist.items).total} selesai
                                </span>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                {selectedChecklist.items.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleToggleItem(selectedChecklist.id, item.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem',
                                            background: item.isCompleted ? 'rgba(var(--success-rgb), 0.1)' : 'var(--bg-secondary)',
                                            borderRadius: '6px',
                                            marginBottom: '0.5rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {item.isCompleted ? (
                                            <CheckCircle size={20} color="var(--success)" />
                                        ) : (
                                            <Circle size={20} color="var(--text-muted)" />
                                        )}
                                        <span style={{
                                            flex: 1,
                                            textDecoration: item.isCompleted ? 'line-through' : 'none',
                                            color: item.isCompleted ? 'var(--text-muted)' : 'var(--text)',
                                        }}>
                                            {idx + 1}. {item.title}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-danger" onClick={() => handleDelete(selectedChecklist.id)} style={{ flex: 1 }}>
                                    <Trash2 size={16} /> Padam
                                </button>
                                <button className="btn btn-outline" onClick={() => setShowViewModal(false)} style={{ flex: 1 }}>
                                    Tutup
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
}
