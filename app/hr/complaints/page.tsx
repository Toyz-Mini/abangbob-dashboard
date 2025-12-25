'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import { StaffComplaint, ComplaintCategory, ComplaintStatus } from '@/lib/types';
import {
    AlertTriangle,
    Plus,
    Calendar,
    User,
    Trash2,
    Filter,
    MessageSquare,
    Shield,
    CheckCircle,
    Clock,
    Search,
    Eye,
    Ghost,
} from 'lucide-react';

const CATEGORIES: { value: ComplaintCategory; label: string }[] = [
    { value: 'harassment', label: 'Gangguan (Harassment)' },
    { value: 'misconduct', label: 'Salah Laku' },
    { value: 'safety', label: 'Keselamatan' },
    { value: 'management', label: 'Pengurusan' },
    { value: 'other', label: 'Lain-lain' },
];

const STATUSES: { value: ComplaintStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Baru', color: 'var(--warning)' },
    { value: 'investigating', label: 'Siasatan', color: 'var(--info)' },
    { value: 'resolved', label: 'Selesai', color: 'var(--success)' },
    { value: 'dismissed', label: 'Ditolak', color: 'var(--text-muted)' },
];

export default function StaffComplaintsPage() {
    const { user } = useAuth();
    const {
        staff,
        staffComplaints,
        addStaffComplaint,
        updateStaffComplaint,
        deleteStaffComplaint,
        isInitialized
    } = useStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<StaffComplaint | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [form, setForm] = useState({
        isAnonymous: false,
        staffId: '',
        date: new Date().toISOString().split('T')[0],
        category: 'other' as ComplaintCategory,
        subject: '',
        description: '',
    });

    // Update Form state
    const [updateForm, setUpdateForm] = useState({
        status: 'pending' as ComplaintStatus,
        adminNotes: '',
    });

    const filteredComplaints = useMemo(() => {
        return staffComplaints.filter(c => {
            if (filterStatus !== 'all' && c.status !== filterStatus) return false;
            if (filterCategory !== 'all' && c.category !== filterCategory) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    c.subject.toLowerCase().includes(q) ||
                    c.description.toLowerCase().includes(q) ||
                    (c.staffName || '').toLowerCase().includes(q)
                );
            }
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [staffComplaints, filterStatus, filterCategory, searchQuery]);

    // Stats
    const stats = {
        total: staffComplaints.length,
        pending: staffComplaints.filter(c => c.status === 'pending').length,
        investigating: staffComplaints.filter(c => c.status === 'investigating').length,
        resolved: staffComplaints.filter(c => c.status === 'resolved').length,
    };

    const getCategoryLabel = (cat: ComplaintCategory) => CATEGORIES.find(c => c.value === cat)?.label || cat;
    const getStatusInfo = (status: ComplaintStatus) => STATUSES.find(s => s.value === status) || STATUSES[0];

    const resetForm = () => {
        setForm({
            isAnonymous: false,
            staffId: '',
            date: new Date().toISOString().split('T')[0],
            category: 'other',
            subject: '',
            description: '',
        });
    };

    const handleAdd = async () => {
        if (!form.subject || !form.description) {
            alert('Sila isi subjek dan keterangan');
            return;
        }
        if (!form.isAnonymous && !form.staffId) {
            alert('Sila pilih pengadu atau set sebagai Anonymous');
            return;
        }

        const selectedStaff = !form.isAnonymous ? staff.find(s => s.id === form.staffId) : null;

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 300));

        addStaffComplaint({
            isAnonymous: form.isAnonymous,
            staffId: selectedStaff?.id,
            staffName: form.isAnonymous ? 'Anonymous' : selectedStaff?.name,
            date: form.date,
            category: form.category,
            subject: form.subject,
            description: form.description,
            status: 'pending',
            createdAt: new Date().toISOString(),
        });

        resetForm();
        setShowAddModal(false);
        setIsProcessing(false);
    };

    const handleUpdate = async () => {
        if (!selectedComplaint || !user) return;

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 300));

        const updates: Partial<StaffComplaint> = {
            status: updateForm.status,
            adminNotes: updateForm.adminNotes,
        };

        if (updateForm.status === 'resolved' && selectedComplaint.status !== 'resolved') {
            updates.resolvedAt = new Date().toISOString();
            updates.resolvedBy = user.name || 'Admin';
        }

        updateStaffComplaint(selectedComplaint.id, updates);
        setShowViewModal(false);
        setIsProcessing(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Padam aduan ini? Tindakan ini tidak boleh dikembalikan.')) return;
        deleteStaffComplaint(id);
        if (selectedComplaint?.id === id) {
            setShowViewModal(false);
            setSelectedComplaint(null);
        }
    };

    const openViewModal = (complaint: StaffComplaint) => {
        setSelectedComplaint(complaint);
        setUpdateForm({
            status: complaint.status,
            adminNotes: complaint.adminNotes || '',
        });
        setShowViewModal(true);
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
                            <Shield size={28} color="var(--primary)" />
                            Aduan Staf
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Pengurusan aduan dan salah laku staf (Termasuk Anonymous)
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Plus size={18} />
                        Rekod Aduan
                    </button>
                </div>

                {/* Stats */}
                <div className="content-grid cols-4" style={{ marginBottom: '2rem' }}>
                    <StatCard
                        label="Total Aduan"
                        value={stats.total}
                        icon={AlertTriangle}
                        gradient="subtle"
                    />
                    <StatCard
                        label="Baru (Pending)"
                        value={stats.pending}
                        icon={Clock}
                        gradient="warning"
                    />
                    <StatCard
                        label="Dalam Siasatan"
                        value={stats.investigating}
                        icon={Search}
                        gradient="info"
                    />
                    <StatCard
                        label="Selesai"
                        value={stats.resolved}
                        icon={CheckCircle}
                        gradient="success"
                    />
                </div>

                {/* Filters */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                        <Search size={16} color="var(--text-secondary)" />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Cari subjek, nama..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ margin: 0 }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={16} color="var(--text-secondary)" />
                        <select
                            className="form-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Semua Status</option>
                            {STATUSES.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={16} color="var(--text-secondary)" />
                        <select
                            className="form-select"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="all">Semua Kategori</option>
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Complaints List */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Senarai Aduan</div>
                    </div>

                    {filteredComplaints.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <Shield size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>Tiada rekod aduan ditemui</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Tarikh</th>
                                        <th>Pengadu</th>
                                        <th>Kategori</th>
                                        <th>Subjek</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredComplaints.map(complaint => (
                                        <tr key={complaint.id}>
                                            <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                {new Date(complaint.createdAt).toLocaleDateString('ms-MY')}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {complaint.isAnonymous ? (
                                                        <Ghost size={14} color="var(--text-secondary)" />
                                                    ) : (
                                                        <User size={14} color="var(--primary)" />
                                                    )}
                                                    <span style={{ fontStyle: complaint.isAnonymous ? 'italic' : 'normal', color: complaint.isAnonymous ? 'var(--text-secondary)' : 'inherit' }}>
                                                        {complaint.staffName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                                                    {getCategoryLabel(complaint.category)}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{complaint.subject}</td>
                                            <td>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        backgroundColor: `color-mix(in srgb, ${getStatusInfo(complaint.status).color} 15%, transparent)`,
                                                        color: getStatusInfo(complaint.status).color,
                                                        border: `1px solid ${getStatusInfo(complaint.status).color}`
                                                    }}
                                                >
                                                    {getStatusInfo(complaint.status).label}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => openViewModal(complaint)}
                                                        title="Lihat / Kemaskini"
                                                    >
                                                        <Eye size={14} />
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
                    title="Rekod Aduan Baru"
                    maxWidth="600px"
                >
                    <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label className="form-label" style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={form.isAnonymous}
                                    onChange={(e) => {
                                        setForm(prev => ({ ...prev, isAnonymous: e.target.checked, staffId: '' }));
                                    }}
                                />
                                Aduan Tanpa Nama (Anonymous)
                            </label>
                        </div>
                        {form.isAnonymous && <Ghost size={20} color="var(--text-secondary)" />}
                    </div>

                    {!form.isAnonymous && (
                        <div className="form-group">
                            <label className="form-label">Pengadu *</label>
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
                    )}

                    <div className="content-grid cols-2">
                        <div className="form-group">
                            <label className="form-label">Tarikh Kejadian</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.date}
                                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kategori *</label>
                            <select
                                className="form-select"
                                value={form.category}
                                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as ComplaintCategory }))}
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Subjek / Tajuk *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.subject}
                            onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Ringkasan aduan"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Butiran Terperinci *</label>
                        <textarea
                            className="form-input"
                            value={form.description}
                            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={5}
                            placeholder="Sila jelaskan kejadian, tempat, masa, dan individu yang terlibat..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-outline" onClick={() => setShowAddModal(false)} disabled={isProcessing} style={{ flex: 1 }}>
                            Batal
                        </button>
                        <button className="btn btn-primary" onClick={handleAdd} disabled={isProcessing} style={{ flex: 1 }}>
                            {isProcessing ? <LoadingSpinner size="sm" /> : 'Hantar Aduan'}
                        </button>
                    </div>
                </Modal>

                {/* View/Update Modal */}
                <Modal
                    isOpen={showViewModal}
                    onClose={() => setShowViewModal(false)}
                    title="Butiran Aduan"
                    maxWidth="700px"
                >
                    {selectedComplaint && (
                        <div>
                            {/* Complaint Info */}
                            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {selectedComplaint.isAnonymous ? <Ghost size={18} /> : <User size={18} />}
                                        <span style={{ fontWeight: 600 }}>{selectedComplaint.staffName}</span>
                                    </div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {new Date(selectedComplaint.createdAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{selectedComplaint.subject}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <span className="badge badge-outline">{getCategoryLabel(selectedComplaint.category)}</span>
                                    <span className="badge" style={{ backgroundColor: getStatusInfo(selectedComplaint.status).color, color: 'white' }}>
                                        {getStatusInfo(selectedComplaint.status).label}
                                    </span>
                                </div>

                                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selectedComplaint.description}</p>
                            </div>

                            {/* Admin Actions */}
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Shield size={18} color="var(--primary)" />
                                    Tindakan Admin
                                </h4>

                                <div className="content-grid cols-2">
                                    <div className="form-group">
                                        <label className="form-label">Status Terkini</label>
                                        <select
                                            className="form-select"
                                            value={updateForm.status}
                                            onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value as ComplaintStatus }))}
                                        >
                                            {STATUSES.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Nota Siasatan / Tindakan</label>
                                    <textarea
                                        className="form-input"
                                        value={updateForm.adminNotes}
                                        onChange={(e) => setUpdateForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                                        rows={4}
                                        placeholder="Catatan admin mengenai siasatan atau penyelesaian..."
                                    />
                                </div>

                                {selectedComplaint.resolvedBy && (
                                    <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={14} />
                                        Diselesaikan oleh {selectedComplaint.resolvedBy} pada {new Date(selectedComplaint.resolvedAt!).toLocaleDateString()}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                                    <button
                                        className="btn btn-link text-danger"
                                        onClick={() => handleDelete(selectedComplaint.id)}
                                        style={{ paddingLeft: 0 }}
                                    >
                                        <Trash2 size={16} /> Padam Rekod
                                    </button>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-outline" onClick={() => setShowViewModal(false)}>
                                            Tutup
                                        </button>
                                        <button className="btn btn-primary" onClick={handleUpdate} disabled={isProcessing}>
                                            {isProcessing ? <LoadingSpinner size="sm" /> : 'Kemaskini Status'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
}
