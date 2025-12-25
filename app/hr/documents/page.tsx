'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import { StaffDocument } from '@/lib/types';
import {
    FileText,
    Plus,
    Calendar,
    User,
    Trash2,
    Edit2,
    AlertTriangle,
    Filter,
    Clock,
    File,
    ExternalLink,
} from 'lucide-react';

const DOC_TYPES: { value: StaffDocument['type']; label: string }[] = [
    { value: 'ic_front', label: 'IC (Depan)' },
    { value: 'ic_back', label: 'IC (Belakang)' },
    { value: 'contract', label: 'Kontrak' },
    { value: 'resume', label: 'Resume' },
    { value: 'offer_letter', label: 'Surat Tawaran' },
    { value: 'medical_report', label: 'Laporan Perubatan' },
    { value: 'work_permit', label: 'Permit Kerja' },
    { value: 'certificate', label: 'Sijil' },
    { value: 'other', label: 'Lain-lain' },
];

export default function DocumentsPage() {
    const {
        staff,
        staffDocuments,
        addStaffDocument,
        updateStaffDocument,
        deleteStaffDocument,
        getExpiringDocuments,
        isInitialized
    } = useStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<StaffDocument | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStaffId, setFilterStaffId] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');

    // Form state
    const [form, setForm] = useState({
        staffId: '',
        type: 'contract' as StaffDocument['type'],
        name: '',
        description: '',
        url: '',
        expiryDate: '',
    });

    // Filter documents
    const filteredDocs = useMemo(() => {
        return staffDocuments.filter(d => {
            if (filterStaffId !== 'all' && d.staffId !== filterStaffId) return false;
            if (filterType !== 'all' && d.type !== filterType) return false;
            return true;
        }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    }, [staffDocuments, filterStaffId, filterType]);

    // Stats
    const totalDocs = staffDocuments.length;
    const expiringCount = getExpiringDocuments(30).length;
    const expiredCount = staffDocuments.filter(d => {
        if (!d.expiryDate) return false;
        return new Date(d.expiryDate) < new Date();
    }).length;

    const getTypeLabel = (type: StaffDocument['type']) => {
        return DOC_TYPES.find(t => t.value === type)?.label || type;
    };

    const resetForm = () => {
        setForm({
            staffId: '',
            type: 'contract',
            name: '',
            description: '',
            url: '',
            expiryDate: '',
        });
    };

    const handleAdd = async () => {
        if (!form.staffId || !form.name.trim() || !form.url.trim()) {
            alert('Sila isi semua maklumat yang diperlukan');
            return;
        }

        const selectedStaff = staff.find(s => s.id === form.staffId);
        if (!selectedStaff) return;

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 300));

        addStaffDocument({
            staffId: form.staffId,
            staffName: selectedStaff.name,
            type: form.type,
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            url: form.url.trim(),
            expiryDate: form.expiryDate || undefined,
        });

        resetForm();
        setShowAddModal(false);
        setIsProcessing(false);
    };

    const handleEdit = async () => {
        if (!selectedDoc || !form.name.trim()) return;

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 300));

        updateStaffDocument(selectedDoc.id, {
            type: form.type,
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            url: form.url.trim(),
            expiryDate: form.expiryDate || undefined,
        });

        setShowEditModal(false);
        setSelectedDoc(null);
        setIsProcessing(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Padam dokumen ini?')) return;
        deleteStaffDocument(id);
    };

    const openEditModal = (doc: StaffDocument) => {
        setSelectedDoc(doc);
        setForm({
            staffId: doc.staffId || '',
            type: doc.type,
            name: doc.name,
            description: doc.description || '',
            url: doc.url,
            expiryDate: doc.expiryDate?.split('T')[0] || '',
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
                            <FileText size={28} color="var(--primary)" />
                            Dokumen Staf
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Urus dokumen staf seperti IC, kontrak, permit kerja
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Plus size={18} />
                        Tambah Dokumen
                    </button>
                </div>

                {/* Stats */}
                <div className="content-grid cols-3" style={{ marginBottom: '2rem' }}>
                    <StatCard
                        label="Jumlah Dokumen"
                        value={totalDocs}
                        icon={File}
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
                        change={expiredCount > 0 ? "perlu renew" : "tiada"}
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
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">Semua Jenis</option>
                        {DOC_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* Documents List */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Senarai Dokumen</div>
                    </div>

                    {filteredDocs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>Tiada dokumen</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Staf</th>
                                        <th>Dokumen</th>
                                        <th>Jenis</th>
                                        <th>Tarikh Upload</th>
                                        <th>Luput</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocs.map(doc => {
                                        const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                                        const isExpiringSoon = doc.expiryDate && !isExpired && new Date(doc.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                                        return (
                                            <tr key={doc.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <User size={14} />
                                                        {doc.staffName || '-'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{doc.name}</div>
                                                    {doc.description && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doc.description}</div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                                        {getTypeLabel(doc.type)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {new Date(doc.uploadedAt).toLocaleDateString('ms-MY')}
                                                </td>
                                                <td>
                                                    {doc.expiryDate ? (
                                                        <span style={{
                                                            color: isExpired ? 'var(--danger)' : isExpiringSoon ? 'var(--warning)' : 'inherit',
                                                            fontWeight: isExpired || isExpiringSoon ? 600 : 400
                                                        }}>
                                                            {new Date(doc.expiryDate).toLocaleDateString('ms-MY')}
                                                            {isExpired && <span className="badge badge-danger" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>LUPUT</span>}
                                                            {isExpiringSoon && <AlertTriangle size={12} style={{ marginLeft: '0.25rem', display: 'inline' }} />}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        {doc.url && (
                                                            <a
                                                                href={doc.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-outline btn-sm"
                                                                title="Lihat"
                                                            >
                                                                <ExternalLink size={14} />
                                                            </a>
                                                        )}
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => openEditModal(doc)}
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleDelete(doc.id)}
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
                    title="Tambah Dokumen"
                    maxWidth="500px"
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
                            <label className="form-label">Jenis Dokumen *</label>
                            <select
                                className="form-select"
                                value={form.type}
                                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as StaffDocument['type'] }))}
                            >
                                {DOC_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nama Dokumen *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Contoh: Kontrak Ahmad 2024"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">URL Dokumen *</label>
                        <input
                            type="url"
                            className="form-input"
                            value={form.url}
                            onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tarikh Luput</label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.expiryDate}
                            onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Catatan</label>
                        <textarea
                            className="form-input"
                            value={form.description}
                            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
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
                            disabled={isProcessing || !form.staffId || !form.name.trim() || !form.url.trim()}
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
                    title="Edit Dokumen"
                    maxWidth="500px"
                >
                    <div className="form-group">
                        <label className="form-label">Staf</label>
                        <input type="text" className="form-input" value={selectedDoc?.staffName || ''} disabled />
                    </div>

                    <div className="content-grid cols-2">
                        <div className="form-group">
                            <label className="form-label">Jenis Dokumen</label>
                            <select
                                className="form-select"
                                value={form.type}
                                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as StaffDocument['type'] }))}
                            >
                                {DOC_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tarikh Luput</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.expiryDate}
                                onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nama Dokumen *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">URL Dokumen *</label>
                        <input
                            type="url"
                            className="form-input"
                            value={form.url}
                            onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
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
                            disabled={isProcessing || !form.name.trim()}
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
