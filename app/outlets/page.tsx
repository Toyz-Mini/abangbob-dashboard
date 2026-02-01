'use client';

import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { getSupabaseClient } from '@/lib/supabase/client';
import Modal from '@/components/Modal';

const supabase = getSupabaseClient();
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    Store,
    Plus,
    Edit2,
    Trash2,
    Users,
    MapPin,
    Phone,
    Warehouse,
    CheckCircle,
    XCircle,
    UserPlus,
    RefreshCw,
    Calendar,
    Activity,
} from 'lucide-react';
import { useToast } from '@/lib/contexts/ToastContext';

interface Outlet {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    is_active: boolean;
    is_warehouse: boolean;
    status: string | null;
    code: string | null;
    settings: Record<string, unknown> | null;
    created_at: string;
}

interface StaffAssignment {
    id: string;
    staff_id: string;
    outlet_id: string;
    assignment_date: string;
    is_primary_outlet: boolean;
    staff?: {
        id: string;
        name: string;
        role: string;
    };
}

interface Staff {
    id: string;
    name: string;
    role: string;
    status: string;
}

type ModalType = 'add' | 'edit' | 'delete' | 'staff' | null;

export default function OutletsPage() {
    const { showToast } = useToast();
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    // Modal state
    const [modalType, setModalType] = useState<ModalType>(null);
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        code: '',
        is_warehouse: false,
        status: 'active',
    });

    // Staff assignment state
    const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);
    const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState('');

    useEffect(() => {
        setIsMounted(true);
        fetchOutlets();
    }, []);

    const fetchOutlets = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('outlets')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching outlets:', error);
            showToast('Gagal memuatkan outlet', 'error');
        } else {
            setOutlets(data || []);
        }
        setLoading(false);
    };

    const fetchStaffAssignments = async (outletId: string) => {
        const today = new Date().toISOString().split('T')[0];

        // Fetch today's assignments for this outlet
        const { data: assignments, error: assignmentsError } = await supabase
            .from('staff_outlet_assignments')
            .select(`
        *,
        staff:staff_id (id, name, role)
      `)
            .eq('outlet_id', outletId)
            .eq('assignment_date', today);

        if (assignmentsError) {
            console.error('Error fetching assignments:', assignmentsError);
        } else {
            setStaffAssignments(assignments || []);
        }

        // Fetch available staff
        const { data: staff, error: staffError } = await supabase
            .from('staff')
            .select('id, name, role, status')
            .eq('status', 'active');

        if (staffError) {
            console.error('Error fetching staff:', staffError);
        } else {
            setAvailableStaff(staff || []);
        }
    };

    // Modal handlers
    const openAddModal = () => {
        setFormData({
            name: '',
            address: '',
            phone: '',
            email: '',
            code: '',
            is_warehouse: false,
            status: 'active',
        });
        setModalType('add');
    };

    const openEditModal = (outlet: Outlet) => {
        setSelectedOutlet(outlet);
        setFormData({
            name: outlet.name,
            address: outlet.address || '',
            phone: outlet.phone || '',
            email: outlet.email || '',
            code: outlet.code || '',
            is_warehouse: outlet.is_warehouse || false,
            status: outlet.status || 'active',
        });
        setModalType('edit');
    };

    const openDeleteModal = (outlet: Outlet) => {
        setSelectedOutlet(outlet);
        setModalType('delete');
    };

    const openStaffModal = async (outlet: Outlet) => {
        setSelectedOutlet(outlet);
        await fetchStaffAssignments(outlet.id);
        setModalType('staff');
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedOutlet(null);
        setIsProcessing(false);
        setStaffAssignments([]);
        setSelectedStaffId('');
    };

    // CRUD handlers
    const handleAddOutlet = async () => {
        if (!formData.name.trim()) {
            showToast('Sila masukkan nama outlet', 'warning');
            return;
        }

        setIsProcessing(true);

        const { error } = await supabase.from('outlets').insert({
            name: formData.name.trim(),
            address: formData.address.trim() || null,
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            code: formData.code.trim() || null,
            is_warehouse: formData.is_warehouse,
            status: formData.status,
            is_active: formData.status === 'active',
        });

        if (error) {
            console.error('Error adding outlet:', error);
            showToast('Gagal menambah outlet: ' + error.message, 'error');
        } else {
            showToast('Outlet berjaya ditambah!', 'success');
            fetchOutlets();
            closeModal();
        }
        setIsProcessing(false);
    };

    const handleEditOutlet = async () => {
        if (!selectedOutlet || !formData.name.trim()) return;

        setIsProcessing(true);

        const { error } = await supabase
            .from('outlets')
            .update({
                name: formData.name.trim(),
                address: formData.address.trim() || null,
                phone: formData.phone.trim() || null,
                email: formData.email.trim() || null,
                code: formData.code.trim() || null,
                is_warehouse: formData.is_warehouse,
                status: formData.status,
                is_active: formData.status === 'active',
                updated_at: new Date().toISOString(),
            })
            .eq('id', selectedOutlet.id);

        if (error) {
            console.error('Error updating outlet:', error);
            showToast('Gagal mengemas kini outlet', 'error');
        } else {
            showToast('Outlet berjaya dikemas kini!', 'success');
            fetchOutlets();
            closeModal();
        }
        setIsProcessing(false);
    };

    const handleDeleteOutlet = async () => {
        if (!selectedOutlet) return;

        setIsProcessing(true);

        const { error } = await supabase
            .from('outlets')
            .delete()
            .eq('id', selectedOutlet.id);

        if (error) {
            console.error('Error deleting outlet:', error);
            showToast('Gagal memadam outlet: ' + error.message, 'error');
        } else {
            showToast('Outlet berjaya dipadam!', 'success');
            fetchOutlets();
            closeModal();
        }
        setIsProcessing(false);
    };

    const handleAssignStaff = async () => {
        if (!selectedOutlet || !selectedStaffId) {
            showToast('Sila pilih staff', 'warning');
            return;
        }

        setIsProcessing(true);
        const today = new Date().toISOString().split('T')[0];

        const { error } = await supabase.from('staff_outlet_assignments').insert({
            staff_id: selectedStaffId,
            outlet_id: selectedOutlet.id,
            assignment_date: today,
            is_primary_outlet: staffAssignments.length === 0, // First assignment is primary
        });

        if (error) {
            console.error('Error assigning staff:', error);
            showToast('Gagal mengassign staff: ' + error.message, 'error');
        } else {
            showToast('Staff berjaya di-assign!', 'success');
            fetchStaffAssignments(selectedOutlet.id);
            setSelectedStaffId('');
        }
        setIsProcessing(false);
    };

    const handleRemoveAssignment = async (assignmentId: string) => {
        if (!selectedOutlet) return;

        const { error } = await supabase
            .from('staff_outlet_assignments')
            .delete()
            .eq('id', assignmentId);

        if (error) {
            console.error('Error removing assignment:', error);
            showToast('Gagal memadam assignment', 'error');
        } else {
            showToast('Assignment dipadam!', 'success');
            fetchStaffAssignments(selectedOutlet.id);
        }
    };

    const getStatusBadge = (outlet: Outlet) => {
        if (outlet.is_warehouse) {
            return <span className="badge" style={{ background: '#dbeafe', color: '#1e40af' }}>Warehouse</span>;
        }
        if (outlet.is_active) {
            return <span className="badge badge-success">Aktif</span>;
        }
        return <span className="badge badge-warning">Tidak Aktif</span>;
    };

    if (!isMounted) return null;

    if (loading) {
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            Pengurusan Outlet
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Urus outlet dan assign staff ke lokasi
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" onClick={fetchOutlets}>
                            <RefreshCw size={18} />
                            Refresh
                        </button>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <Plus size={18} />
                            Tambah Outlet
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)' }}>
                                <Store size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{outlets.filter(o => !o.is_warehouse && o.is_active).length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Outlet Aktif</div>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', background: '#dbeafe', borderRadius: '50%', color: '#1e40af' }}>
                                <Warehouse size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{outlets.filter(o => o.is_warehouse).length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Warehouse</div>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', background: '#fef3c7', borderRadius: '50%', color: '#d97706' }}>
                                <Activity size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{outlets.filter(o => !o.is_active).length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tidak Aktif</div>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', background: '#d1fae5', borderRadius: '50%', color: '#059669' }}>
                                <MapPin size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{outlets.length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Jumlah Lokasi</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Outlets Grid */}
                {outlets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1rem' }}>
                        {outlets.map(outlet => (
                            <div key={outlet.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                                {/* Warehouse ribbon */}
                                {outlet.is_warehouse && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.75rem',
                                        right: '-2rem',
                                        background: '#1e40af',
                                        color: 'white',
                                        padding: '0.25rem 2rem',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        transform: 'rotate(45deg)',
                                    }}>
                                        WAREHOUSE
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                            {outlet.name}
                                        </div>
                                        {outlet.code && (
                                            <span style={{
                                                fontSize: '0.7rem',
                                                background: 'var(--gray-100)',
                                                padding: '0.125rem 0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                marginRight: '0.5rem'
                                            }}>
                                                {outlet.code}
                                            </span>
                                        )}
                                        {getStatusBadge(outlet)}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                    {outlet.address && (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <MapPin size={14} color="var(--text-secondary)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                                            <span style={{ color: 'var(--text-secondary)' }}>{outlet.address}</span>
                                        </div>
                                    )}
                                    {outlet.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Phone size={14} color="var(--text-secondary)" />
                                            <span>{outlet.phone}</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => openStaffModal(outlet)}
                                        style={{ flex: 1 }}
                                    >
                                        <Users size={14} />
                                        Staff
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => openEditModal(outlet)}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => openDeleteModal(outlet)}
                                        style={{ color: 'var(--danger)' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <Store size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Belum ada outlet
                        </p>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <Plus size={18} />
                            Tambah Outlet Pertama
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalType === 'add' || modalType === 'edit'}
                onClose={closeModal}
                title={modalType === 'add' ? 'Tambah Outlet Baru' : 'Edit Outlet'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="form-label">Nama Outlet *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="cth: Rimba Point"
                        />
                    </div>
                    <div>
                        <label className="form-label">Kod Outlet</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.code}
                            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                            placeholder="cth: RP"
                            maxLength={10}
                        />
                    </div>
                    <div>
                        <label className="form-label">Alamat</label>
                        <textarea
                            className="form-input"
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Alamat penuh outlet"
                            rows={2}
                        />
                    </div>
                    <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                        <div>
                            <label className="form-label">Telefon</label>
                            <input
                                type="tel"
                                className="form-input"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="+673 xxx xxxx"
                            />
                        </div>
                        <div>
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="outlet@email.com"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                        <div>
                            <label className="form-label">Status</label>
                            <select
                                className="form-input"
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="active">Aktif</option>
                                <option value="inactive">Tidak Aktif</option>
                                <option value="under_renovation">Dalam Pengubahsuaian</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
                            <input
                                type="checkbox"
                                id="is_warehouse"
                                checked={formData.is_warehouse}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_warehouse: e.target.checked }))}
                            />
                            <label htmlFor="is_warehouse" style={{ cursor: 'pointer' }}>
                                Ini adalah Warehouse
                            </label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button className="btn btn-outline" onClick={closeModal} disabled={isProcessing}>
                            Batal
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={modalType === 'add' ? handleAddOutlet : handleEditOutlet}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Menyimpan...' : modalType === 'add' ? 'Tambah' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={modalType === 'delete'}
                onClose={closeModal}
                title="Padam Outlet"
            >
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <Trash2 size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                    <p style={{ marginBottom: '0.5rem' }}>
                        Adakah anda pasti mahu memadam outlet ini?
                    </p>
                    <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' }}>
                        {selectedOutlet?.name}
                    </p>
                    <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>
                        Perhatian: Semua data berkaitan outlet ini akan dipadam.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <button className="btn btn-outline" onClick={closeModal} disabled={isProcessing}>
                        Batal
                    </button>
                    <button
                        className="btn"
                        style={{ background: 'var(--danger)', color: 'white' }}
                        onClick={handleDeleteOutlet}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Memadam...' : 'Ya, Padam'}
                    </button>
                </div>
            </Modal>

            {/* Staff Assignment Modal */}
            <Modal
                isOpen={modalType === 'staff'}
                onClose={closeModal}
                title={`Staff Assignments - ${selectedOutlet?.name}`}
            >
                <div>
                    {/* Assign new staff */}
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserPlus size={16} />
                            Assign Staff untuk Hari Ini
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                className="form-input"
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                style={{ flex: 1 }}
                            >
                                <option value="">-- Pilih Staff --</option>
                                {availableStaff
                                    .filter(s => !staffAssignments.some(a => a.staff_id === s.id))
                                    .map(staff => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.name} ({staff.role})
                                        </option>
                                    ))}
                            </select>
                            <button
                                className="btn btn-primary"
                                onClick={handleAssignStaff}
                                disabled={!selectedStaffId || isProcessing}
                            >
                                <Plus size={16} />
                                Assign
                            </button>
                        </div>
                    </div>

                    {/* Current assignments */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Calendar size={16} />
                            <strong>Staff Hari Ini ({new Date().toLocaleDateString('ms-MY')})</strong>
                        </div>

                        {staffAssignments.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {staffAssignments.map(assignment => (
                                    <div
                                        key={assignment.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem',
                                            background: 'white',
                                            border: '1px solid var(--gray-200)',
                                            borderRadius: 'var(--radius-sm)',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{assignment.staff?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {assignment.staff?.role || 'Unknown role'}
                                                {assignment.is_primary_outlet && (
                                                    <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>Primary</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-sm"
                                            style={{ color: 'var(--danger)' }}
                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                <p>Tiada staff di-assign untuk hari ini</p>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button className="btn btn-outline" onClick={closeModal}>
                            Tutup
                        </button>
                    </div>
                </div>
            </Modal>
        </MainLayout>
    );
}
