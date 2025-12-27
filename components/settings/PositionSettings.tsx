'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Users, Shield } from 'lucide-react';
import { StaffPosition, StaffPermissions } from '@/lib/types';
import { useStore } from '@/lib/store';
import Modal from '@/components/Modal';

const DEFAULT_PERMISSIONS: StaffPermissions = {
    canApproveLeave: false,
    canApproveClaims: false,
    canViewReports: false,
    canManageStaff: false,
    canAccessPOS: true,
    canGiveDiscount: false,
    maxDiscountPercent: 0,
    canVoidTransaction: false,
    canAccessInventory: false,
    canAccessFinance: false,
    canAccessKDS: false,
    canManageMenu: false,
};

interface PositionFormData {
    name: string;
    description: string;
    role: 'Manager' | 'Staff';
    isActive: boolean;
    displayOrder: number;
    permissions: StaffPermissions;
}

const PERMISSION_LABELS: Record<keyof StaffPermissions, string> = {
    canApproveLeave: 'Boleh Approve Cuti',
    canApproveClaims: 'Boleh Approve Claims',
    canViewReports: 'Boleh Lihat Report',
    canManageStaff: 'Boleh Manage Staff',
    canAccessPOS: 'Boleh Akses POS',
    canGiveDiscount: 'Boleh Beri Diskaun',
    maxDiscountPercent: 'Maksimum Diskaun (%)',
    canVoidTransaction: 'Boleh Void Transaksi',
    canAccessInventory: 'Boleh Akses Inventory',
    canAccessFinance: 'Boleh Akses Kewangan',
    canAccessKDS: 'Boleh Akses KDS',
    canManageMenu: 'Boleh Manage Menu',
};

export default function PositionSettings() {
    const { positions, addPosition, updatePosition, deletePosition } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState<StaffPosition | null>(null);
    const [positionToDelete, setPositionToDelete] = useState<StaffPosition | null>(null);

    const [formData, setFormData] = useState<PositionFormData>({
        name: '',
        description: '',
        role: 'Staff',
        isActive: true,
        displayOrder: positions.length + 1,
        permissions: { ...DEFAULT_PERMISSIONS },
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            role: 'Staff',
            isActive: true,
            displayOrder: positions.length + 1,
            permissions: { ...DEFAULT_PERMISSIONS },
        });
        setEditingPosition(null);
    };

    const handleOpenAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEditModal = (position: StaffPosition) => {
        setEditingPosition(position);
        setFormData({
            name: position.name,
            description: position.description || '',
            role: position.role,
            isActive: position.isActive,
            displayOrder: position.displayOrder,
            permissions: { ...position.permissions },
        });
        setShowModal(true);
    };

    const handleOpenDeleteModal = (position: StaffPosition) => {
        setPositionToDelete(position);
        setShowDeleteModal(true);
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            alert('Sila masukkan nama posisi');
            return;
        }

        if (editingPosition) {
            updatePosition(editingPosition.id, formData);
        } else {
            addPosition(formData);
        }

        setShowModal(false);
        resetForm();
    };

    const handleDelete = () => {
        if (positionToDelete) {
            deletePosition(positionToDelete.id);
            setShowDeleteModal(false);
            setPositionToDelete(null);
        }
    };

    const handlePermissionChange = (key: keyof StaffPermissions, value: boolean | number) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: value,
            },
        }));
    };

    // Sort positions by displayOrder
    const sortedPositions = [...positions].sort((a, b) => a.displayOrder - b.displayOrder);
    const managerPositions = sortedPositions.filter(p => p.role === 'Manager');
    const staffPositions = sortedPositions.filter(p => p.role === 'Staff');

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} />
                    Pengurusan Posisi Staff
                </div>
                <div className="card-subtitle">
                    Tetapkan posisi seperti Supervisor, Manager, Senior Crew, Runner dan sebagainya dengan permissions masing-masing
                </div>
            </div>

            {/* Add Position Button */}
            <div style={{ marginBottom: '1.5rem' }}>
                <button className="btn btn-primary" onClick={handleOpenAddModal}>
                    <Plus size={18} />
                    Tambah Posisi
                </button>
            </div>

            {/* Manager Positions */}
            {managerPositions.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--primary)' }}>
                        Posisi Manager
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {managerPositions.map(position => (
                            <PositionRow
                                key={position.id}
                                position={position}
                                onEdit={handleOpenEditModal}
                                onDelete={handleOpenDeleteModal}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Staff Positions */}
            {staffPositions.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--success)' }}>
                        Posisi Staff
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {staffPositions.map(position => (
                            <PositionRow
                                key={position.id}
                                position={position}
                                onEdit={handleOpenEditModal}
                                onDelete={handleOpenDeleteModal}
                            />
                        ))}
                    </div>
                </div>
            )}

            {positions.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <Users size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p>Tiada posisi. Klik &quot;Tambah Posisi&quot; untuk bermula.</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); resetForm(); }}
                title={editingPosition ? 'Edit Posisi' : 'Tambah Posisi Baru'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Name */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                            Nama Posisi <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Contoh: Shift Supervisor"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                            Keterangan
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Contoh: Penyelia shift harian"
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                            Role
                        </label>
                        <select
                            className="input"
                            value={formData.role}
                            onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as 'Manager' | 'Staff' }))}
                        >
                            <option value="Manager">Manager</option>
                            <option value="Staff">Staff</option>
                        </select>
                    </div>

                    {/* Display Order */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                            Susunan Paparan
                        </label>
                        <input
                            type="number"
                            className="input"
                            min={1}
                            value={formData.displayOrder}
                            onChange={e => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
                        />
                    </div>

                    {/* Active Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        />
                        <label htmlFor="isActive" style={{ fontSize: '0.875rem' }}>
                            Aktif
                        </label>
                    </div>

                    {/* Permissions Section */}
                    <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={16} />
                            Permissions
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {Object.keys(PERMISSION_LABELS).map(key => {
                                const permKey = key as keyof StaffPermissions;

                                if (permKey === 'maxDiscountPercent') {
                                    return (
                                        <div key={permKey} style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.875rem', flex: 1 }}>
                                                {PERMISSION_LABELS[permKey]}
                                            </label>
                                            <input
                                                type="number"
                                                className="input"
                                                style={{ width: '80px' }}
                                                min={0}
                                                max={100}
                                                value={formData.permissions.maxDiscountPercent}
                                                onChange={e => handlePermissionChange(permKey, parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    );
                                }

                                return (
                                    <div key={permKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            id={permKey}
                                            checked={formData.permissions[permKey] as boolean}
                                            onChange={e => handlePermissionChange(permKey, e.target.checked)}
                                        />
                                        <label htmlFor={permKey} style={{ fontSize: '0.8rem' }}>
                                            {PERMISSION_LABELS[permKey]}
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button className="btn btn-outline" onClick={() => { setShowModal(false); resetForm(); }}>
                            Batal
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingPosition ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setPositionToDelete(null); }}
                title="Hapus Posisi"
            >
                <div>
                    <p style={{ marginBottom: '1rem' }}>
                        Adakah anda pasti mahu menghapus posisi <strong>{positionToDelete?.name}</strong>?
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Tindakan ini tidak boleh dibatalkan. Staff yang menggunakan posisi ini perlu di-reassign ke posisi lain.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" onClick={() => { setShowDeleteModal(false); setPositionToDelete(null); }}>
                            Batal
                        </button>
                        <button className="btn btn-danger" onClick={handleDelete}>
                            <Trash2 size={16} />
                            Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Position Row Component
function PositionRow({
    position,
    onEdit,
    onDelete
}: {
    position: StaffPosition;
    onEdit: (p: StaffPosition) => void;
    onDelete: (p: StaffPosition) => void;
}) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius-sm)',
            gap: '1rem',
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{position.name}</div>
                {position.description && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {position.description}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!position.isActive && (
                    <span className="badge" style={{ background: 'var(--gray-200)', color: 'var(--text-secondary)' }}>
                        Tidak Aktif
                    </span>
                )}
                <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => onEdit(position)}
                    title="Edit"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => onDelete(position)}
                    title="Hapus"
                    style={{ color: 'var(--danger)' }}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}
