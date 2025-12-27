'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Users, Shield, ChevronDown, ChevronUp } from 'lucide-react';
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

const PERMISSION_GROUPS = [
    {
        title: 'Pengurusan HR',
        icon: '👥',
        permissions: [
            { key: 'canApproveLeave', label: 'Approve Cuti' },
            { key: 'canApproveClaims', label: 'Approve Claims' },
            { key: 'canManageStaff', label: 'Manage Staff' },
        ],
    },
    {
        title: 'Operasi POS',
        icon: '🛒',
        permissions: [
            { key: 'canAccessPOS', label: 'Akses POS' },
            { key: 'canGiveDiscount', label: 'Beri Diskaun' },
            { key: 'canVoidTransaction', label: 'Void Transaksi' },
        ],
    },
    {
        title: 'Akses Sistem',
        icon: '🔐',
        permissions: [
            { key: 'canViewReports', label: 'Lihat Report' },
            { key: 'canAccessInventory', label: 'Akses Inventory' },
            { key: 'canAccessFinance', label: 'Akses Kewangan' },
            { key: 'canAccessKDS', label: 'Akses KDS' },
            { key: 'canManageMenu', label: 'Manage Menu' },
        ],
    },
];

export default function PositionSettings() {
    const { positions, addPosition, updatePosition, deletePosition } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState<StaffPosition | null>(null);
    const [positionToDelete, setPositionToDelete] = useState<StaffPosition | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['Pengurusan HR', 'Operasi POS', 'Akses Sistem']);

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

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev =>
            prev.includes(title) ? prev.filter(g => g !== title) : [...prev, title]
        );
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
                    <h4 style={{
                        fontWeight: 600,
                        marginBottom: '0.75rem',
                        fontSize: '0.875rem',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--primary)'
                        }} />
                        Posisi Manager ({managerPositions.length})
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
                    <h4 style={{
                        fontWeight: 600,
                        marginBottom: '0.75rem',
                        fontSize: '0.875rem',
                        color: 'var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--success)'
                        }} />
                        Posisi Staff ({staffPositions.length})
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
                    padding: '3rem 2rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed var(--gray-200)'
                }}>
                    <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 500 }}>Tiada posisi</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Klik &quot;Tambah Posisi&quot; untuk bermula</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); resetForm(); }}
                title={editingPosition ? '✏️ Edit Posisi' : '➕ Tambah Posisi Baru'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Basic Info Section */}
                    <div style={{
                        background: 'var(--gray-50)',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {/* Name */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                color: 'var(--text-primary)'
                            }}>
                                Nama Posisi <span style={{ color: 'var(--danger)' }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Contoh: Shift Supervisor"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    fontSize: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '2px solid var(--gray-200)',
                                    background: 'white',
                                    transition: 'border-color 0.2s',
                                }}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                color: 'var(--text-primary)'
                            }}>
                                Keterangan
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Contoh: Penyelia shift harian"
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    fontSize: '0.9rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '2px solid var(--gray-200)',
                                    background: 'white',
                                }}
                            />
                        </div>

                        {/* Role & Display Order Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    color: 'var(--text-primary)'
                                }}>
                                    Role
                                </label>
                                <select
                                    className="input"
                                    value={formData.role}
                                    onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as 'Manager' | 'Staff' }))}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        fontSize: '0.9rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--gray-200)',
                                        background: 'white',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="Manager">👔 Manager</option>
                                    <option value="Staff">👷 Staff</option>
                                </select>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    color: 'var(--text-primary)'
                                }}>
                                    Susunan
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    min={1}
                                    value={formData.displayOrder}
                                    onChange={e => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        fontSize: '0.9rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--gray-200)',
                                        background: 'white',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            cursor: 'pointer',
                            padding: '0.75rem',
                            background: formData.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${formData.isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            transition: 'all 0.2s',
                        }}>
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    accentColor: 'var(--success)',
                                }}
                            />
                            <span style={{
                                fontWeight: 500,
                                fontSize: '0.9rem',
                                color: formData.isActive ? 'var(--success)' : 'var(--danger)'
                            }}>
                                {formData.isActive ? '✅ Posisi Aktif' : '❌ Posisi Tidak Aktif'}
                            </span>
                        </label>
                    </div>

                    {/* Permissions Section */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem',
                            paddingBottom: '0.75rem',
                            borderBottom: '2px solid var(--gray-100)'
                        }}>
                            <Shield size={20} style={{ color: 'var(--primary)' }} />
                            <h4 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Permissions</h4>
                        </div>

                        {PERMISSION_GROUPS.map(group => (
                            <div
                                key={group.title}
                                style={{
                                    marginBottom: '0.75rem',
                                    border: '1px solid var(--gray-200)',
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden',
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group.title)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem 1rem',
                                        background: 'var(--gray-50)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>{group.icon}</span>
                                        {group.title}
                                    </span>
                                    {expandedGroups.includes(group.title) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>

                                {expandedGroups.includes(group.title) && (
                                    <div style={{ padding: '0.75rem 1rem', background: 'white' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            {group.permissions.map(perm => (
                                                <label
                                                    key={perm.key}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        padding: '0.5rem 0.75rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        cursor: 'pointer',
                                                        background: formData.permissions[perm.key as keyof StaffPermissions] ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                                        transition: 'background 0.2s',
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.permissions[perm.key as keyof StaffPermissions] as boolean}
                                                        onChange={e => handlePermissionChange(perm.key as keyof StaffPermissions, e.target.checked)}
                                                        style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            accentColor: 'var(--success)',
                                                        }}
                                                    />
                                                    <span style={{ fontSize: '0.85rem' }}>{perm.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Max Discount */}
                        <div style={{
                            background: 'var(--gray-50)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                        }}>
                            <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                💰 Maksimum Diskaun (%)
                            </label>
                            <input
                                type="number"
                                className="input"
                                style={{
                                    width: '100px',
                                    padding: '0.5rem 0.75rem',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    border: '2px solid var(--gray-200)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                                min={0}
                                max={100}
                                value={formData.permissions.maxDiscountPercent}
                                onChange={e => handlePermissionChange('maxDiscountPercent', parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'flex-end',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--gray-100)'
                    }}>
                        <button
                            className="btn btn-outline"
                            onClick={() => { setShowModal(false); resetForm(); }}
                            style={{ padding: '0.75rem 1.5rem' }}
                        >
                            Batal
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            style={{ padding: '0.75rem 2rem' }}
                        >
                            {editingPosition ? '💾 Simpan' : '➕ Tambah'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setPositionToDelete(null); }}
                title="🗑️ Hapus Posisi"
            >
                <div>
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <p style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
                            Adakah anda pasti mahu menghapus posisi:
                        </p>
                        <p style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: 'var(--danger)',
                            margin: 0
                        }}>
                            &quot;{positionToDelete?.name}&quot;
                        </p>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        ⚠️ Tindakan ini tidak boleh dibatalkan. Staff yang menggunakan posisi ini perlu di-reassign ke posisi lain.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button
                            className="btn btn-outline"
                            onClick={() => { setShowDeleteModal(false); setPositionToDelete(null); }}
                            style={{ padding: '0.75rem 1.5rem' }}
                        >
                            Batal
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleDelete}
                            style={{ padding: '0.75rem 1.5rem' }}
                        >
                            <Trash2 size={16} />
                            Hapus Posisi
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
    // Count active permissions
    const activePerms = Object.entries(position.permissions).filter(
        ([key, val]) => key !== 'maxDiscountPercent' && val === true
    ).length;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            background: 'white',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--gray-200)',
            gap: '1rem',
            transition: 'all 0.2s',
        }}>
            {/* Icon */}
            <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: position.role === 'Manager' ? 'rgba(204, 21, 18, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0,
            }}>
                {position.role === 'Manager' ? '👔' : '👷'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    {position.name}
                    {!position.isActive && (
                        <span style={{
                            fontSize: '0.7rem',
                            padding: '0.125rem 0.5rem',
                            background: 'var(--gray-200)',
                            color: 'var(--text-secondary)',
                            borderRadius: 'var(--radius-sm)',
                        }}>
                            Tidak Aktif
                        </span>
                    )}
                </div>
                <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    {position.description && (
                        <span>{position.description}</span>
                    )}
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.125rem 0.5rem',
                        background: 'var(--gray-100)',
                        borderRadius: 'var(--radius-sm)',
                    }}>
                        <Shield size={12} />
                        {activePerms} permissions
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => onEdit(position)}
                    title="Edit"
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                    }}
                >
                    <Edit2 size={16} />
                </button>
                <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => onDelete(position)}
                    title="Hapus"
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--danger)'
                    }}
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
