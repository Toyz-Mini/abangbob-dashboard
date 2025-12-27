'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import LivePageHeader from '@/components/LivePageHeader';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    CheckCircle,
    XCircle,
    Clock,
    Mail,
    AlertCircle,
    RefreshCw,
    Edit3,
    X,
    Save,
    Phone,
    CreditCard,
    MapPin,
    Heart,
    Droplet,
    Shirt,
    User,
} from 'lucide-react';
import { BRUNEI_BANKS } from '@/lib/hr-data';

interface ExtendedData {
    bloodType?: string;
    allergies?: string;
    medicalConditions?: string;
    bankName?: string;
    bankAccountNo?: string;
    bankAccountName?: string;
    uniformSize?: string;
    shoeSize?: string;
}

interface EmergencyContact {
    name?: string;
    phone?: string;
    relationship?: string;
}

interface PendingUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
    icNumber?: string;
    dateOfBirth?: string;
    address?: string;
    emergencyContact?: string | EmergencyContact;
    status: string;
    createdAt: string;
    extendedData?: ExtendedData;
}

interface EditFormData {
    phone: string;
    icNumber: string;
    dateOfBirth: string;
    address: string;
    emergencyContact: EmergencyContact;
    bloodType: string;
    allergies: string;
    medicalConditions: string;
    bankName: string;
    bankAccountNo: string;
    bankAccountName: string;
    uniformSize: string;
    shoeSize: string;
}

export default function PendingUsersPage() {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Edit Modal State
    const [editingUser, setEditingUser] = useState<PendingUser | null>(null);
    const [editForm, setEditForm] = useState<EditFormData>({
        phone: '',
        icNumber: '',
        dateOfBirth: '',
        address: '',
        emergencyContact: { name: '', phone: '', relationship: '' },
        bloodType: '',
        allergies: '',
        medicalConditions: '',
        bankName: '',
        bankAccountNo: '',
        bankAccountName: '',
        uniformSize: '',
        shoeSize: '',
    });
    const [saving, setSaving] = useState(false);

    const fetchPendingUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/pending-users');
            if (!res.ok) {
                throw new Error('Gagal mendapatkan senarai pending users');
            }
            const data = await res.json();
            setPendingUsers(data.users || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ralat tidak dijangka');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const openEditModal = (user: PendingUser) => {
        const ec = typeof user.emergencyContact === 'string'
            ? JSON.parse(user.emergencyContact || '{}')
            : (user.emergencyContact || {});
        const ext = user.extendedData || {};

        setEditForm({
            phone: user.phone || '',
            icNumber: user.icNumber || '',
            dateOfBirth: user.dateOfBirth?.split('T')[0] || '',
            address: user.address || '',
            emergencyContact: {
                name: ec.name || '',
                phone: ec.phone || '',
                relationship: ec.relationship || '',
            },
            bloodType: ext.bloodType || '',
            allergies: ext.allergies || '',
            medicalConditions: ext.medicalConditions || '',
            bankName: ext.bankName || '',
            bankAccountNo: ext.bankAccountNo || '',
            bankAccountName: ext.bankAccountName || '',
            uniformSize: ext.uniformSize || '',
            shoeSize: ext.shoeSize || '',
        });
        setEditingUser(user);
    };

    const closeEditModal = () => {
        setEditingUser(null);
    };

    const handleSaveProfile = async () => {
        if (!editingUser) return;

        setSaving(true);
        try {
            const res = await fetch('/api/admin/update-user-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: editingUser.id,
                    ...editForm,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Gagal kemaskini profile');
            }

            setSuccessMessage(data.message);
            await fetchPendingUsers();
            closeEditModal();

            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ralat semasa menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async (userId: string, userName: string) => {
        if (!confirm(`Adakah anda pasti ingin meluluskan pendaftaran ${userName}?`)) {
            return;
        }

        setActionLoading(userId);
        setError(null); // Clear previous errors
        try {
            console.log('[Approve] Starting approval for:', userId, userName);
            const res = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'approve' }),
            });

            const data = await res.json();
            console.log('[Approve] Response:', res.status, data);

            if (!res.ok) {
                throw new Error(data.error || `Gagal meluluskan pengguna (Status: ${res.status})`);
            }

            setSuccessMessage(`${userName} telah diluluskan dan ditambah ke senarai staf!`);
            setPendingUsers((prev) => prev.filter((u) => u.id !== userId));

            setTimeout(() => setSuccessMessage(null), 8000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ralat semasa meluluskan';
            console.error('[Approve] Error:', errorMessage, err);
            setError(errorMessage);
            // Keep error visible longer
            setTimeout(() => setError(null), 10000);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (userId: string, userName: string) => {
        const reason = prompt(`Sila masukkan sebab penolakan untuk ${userName}:`);
        if (reason === null) return;

        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'reject', reason }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Gagal menolak pengguna');
            }

            setSuccessMessage(`Pendaftaran ${userName} telah ditolak.`);
            setPendingUsers((prev) => prev.filter((u) => u.id !== userId));

            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ralat semasa menolak');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ms-MY', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isProfileComplete = (user: PendingUser) => {
        return user.phone && user.icNumber;
    };

    return (
        <MainLayout>
            <div className="animate-fade-in">
                <LivePageHeader
                    title="Pending Approvals"
                    subtitle="Luluskan pendaftaran staf baru"
                    rightContent={
                        <PremiumButton
                            icon={RefreshCw}
                            variant="outline"
                            onClick={fetchPendingUsers}
                            disabled={loading}
                        >
                            Refresh
                        </PremiumButton>
                    }
                />

                {/* Success Message */}
                {successMessage && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '1rem 1.25rem',
                        background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                        borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem',
                        border: '1px solid #86efac',
                    }}>
                        <CheckCircle size={20} color="#16a34a" />
                        <span style={{ fontWeight: 500, color: '#166534' }}>{successMessage}</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '1rem 1.25rem',
                        background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
                        borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem',
                        border: '1px solid #fca5a5',
                    }}>
                        <AlertCircle size={20} color="#dc2626" />
                        <span style={{ fontWeight: 500, color: '#991b1b' }}>{error}</span>
                        <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <XCircle size={18} color="#991b1b" />
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="content-grid cols-3 mb-lg">
                    <GlassCard gradient="subtle">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'rgba(234, 179, 8, 0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Clock size={24} color="var(--warning)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{pendingUsers.length}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Menunggu Kelulusan
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Loading */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <LoadingSpinner />
                    </div>
                ) : pendingUsers.length === 0 ? (
                    /* Empty State */
                    <GlassCard>
                        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <div style={{
                                width: '80px', height: '80px', margin: '0 auto 1.5rem',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <CheckCircle size={40} color="#16a34a" />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                Tiada Pending Approvals
                            </h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Semua pendaftaran telah diproses. 🎉
                            </p>
                        </div>
                    </GlassCard>
                ) : (
                    /* User List */
                    <div className="flex flex-col gap-4">
                        {pendingUsers.map((user) => (
                            <GlassCard key={user.id} className="hover-lift">
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--primary), #8B0000)',
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '1.25rem', flexShrink: 0,
                                    }}>
                                        {user.name.substring(0, 2).toUpperCase()}
                                    </div>

                                    {/* Details */}
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user.name}</h3>
                                            <span style={{
                                                padding: '0.25rem 0.5rem', borderRadius: '6px',
                                                fontSize: '0.7rem', fontWeight: 600,
                                                background: isProfileComplete(user) ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                                color: isProfileComplete(user) ? '#16a34a' : '#ca8a04',
                                            }}>
                                                {isProfileComplete(user) ? '✓ Sedia Approve' : '⏳ Profile Belum Lengkap'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            <Mail size={14} /> {user.email}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            <Clock size={14} /> Didaftar pada {formatDate(user.createdAt)}
                                        </div>
                                        {user.phone && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                📱 {user.phone}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <PremiumButton
                                            icon={Edit3}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditModal(user)}
                                        >
                                            Lihat/Edit
                                        </PremiumButton>
                                        <PremiumButton
                                            icon={CheckCircle}
                                            variant="primary"
                                            size="sm"
                                            onClick={() => {
                                                if (!isProfileComplete(user)) {
                                                    if (!confirm(`⚠️ AMARAN: Profil ${user.name} belum lengkap (tiada telefon/IC).\n\nAdakah anda masih mahu meneruskan kelulusan?`)) {
                                                        return;
                                                    }
                                                }
                                                handleApprove(user.id, user.name);
                                            }}
                                            disabled={actionLoading === user.id}
                                        >
                                            {actionLoading === user.id ? '...' : 'Luluskan'}
                                        </PremiumButton>
                                        <PremiumButton
                                            icon={XCircle}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReject(user.id, user.name)}
                                            disabled={actionLoading === user.id}
                                            style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                                        >
                                            Tolak
                                        </PremiumButton>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}

                {/* Edit Modal */}
                {editingUser && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, padding: '1rem',
                    }} onClick={closeEditModal}>
                        <div style={{
                            background: 'white', borderRadius: '16px',
                            width: '100%', maxWidth: '700px', maxHeight: '90vh',
                            overflow: 'auto',
                        }} onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div style={{
                                padding: '1.5rem', borderBottom: '1px solid #e5e7eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                position: 'sticky', top: 0, background: 'white', zIndex: 1,
                            }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Profile</h2>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{editingUser.name} • {editingUser.email}</p>
                                </div>
                                <button onClick={closeEditModal} style={{
                                    background: '#f3f4f6', border: 'none', borderRadius: '8px',
                                    padding: '0.5rem', cursor: 'pointer',
                                }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <div style={{ padding: '1.5rem' }}>
                                {/* Required Section */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#dc2626', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <AlertCircle size={16} /> Maklumat Wajib
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <Phone size={14} /> No Telefon *
                                            </label>
                                            <input
                                                type="tel"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                placeholder="+673 8123456"
                                                style={{
                                                    width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb',
                                                    borderRadius: '8px', fontSize: '0.95rem',
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <CreditCard size={14} /> No IC *
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.icNumber}
                                                onChange={(e) => setEditForm({ ...editForm, icNumber: e.target.value })}
                                                placeholder="00-123456"
                                                style={{
                                                    width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb',
                                                    borderRadius: '8px', fontSize: '0.95rem',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Info */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <User size={16} /> Maklumat Peribadi
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                                                Tarikh Lahir
                                            </label>
                                            <input
                                                type="date"
                                                value={editForm.dateOfBirth}
                                                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                                                style={{
                                                    width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb',
                                                    borderRadius: '8px', fontSize: '0.95rem',
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <Droplet size={14} /> Jenis Darah
                                            </label>
                                            <select
                                                value={editForm.bloodType}
                                                onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })}
                                                style={{
                                                    width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb',
                                                    borderRadius: '8px', fontSize: '0.95rem', background: 'white',
                                                }}
                                            >
                                                <option value="">Pilih...</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <MapPin size={14} /> Alamat
                                        </label>
                                        <textarea
                                            value={editForm.address}
                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                            placeholder="Alamat penuh..."
                                            rows={2}
                                            style={{
                                                width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb',
                                                borderRadius: '8px', fontSize: '0.95rem', resize: 'vertical',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Medical Info */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Heart size={16} /> Maklumat Kesihatan
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                                                Alergi
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.allergies}
                                                onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                                                placeholder="Contoh: Kacang, Seafood"
                                                style={{
                                                    width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb',
                                                    borderRadius: '8px', fontSize: '0.95rem',
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                                                Penyakit/Kondisi
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.medicalConditions}
                                                onChange={(e) => setEditForm({ ...editForm, medicalConditions: e.target.value })}
                                                placeholder="Contoh: Asthma, Diabetes"
                                                style={{
                                                    width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb',
                                                    borderRadius: '8px', fontSize: '0.95rem',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                                        🚨 Kontak Kecemasan
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>Nama</label>
                                            <input
                                                type="text"
                                                value={editForm.emergencyContact.name}
                                                onChange={(e) => setEditForm({ ...editForm, emergencyContact: { ...editForm.emergencyContact, name: e.target.value } })}
                                                placeholder="Nama waris"
                                                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>No Telefon</label>
                                            <input
                                                type="tel"
                                                value={editForm.emergencyContact.phone}
                                                onChange={(e) => setEditForm({ ...editForm, emergencyContact: { ...editForm.emergencyContact, phone: e.target.value } })}
                                                placeholder="+673 8123456"
                                                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>Hubungan</label>
                                            <select
                                                value={editForm.emergencyContact.relationship}
                                                onChange={(e) => setEditForm({ ...editForm, emergencyContact: { ...editForm.emergencyContact, relationship: e.target.value } })}
                                                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', background: 'white' }}
                                            >
                                                <option value="">Pilih...</option>
                                                <option value="Ibu">Ibu</option>
                                                <option value="Bapa">Bapa</option>
                                                <option value="Suami">Suami</option>
                                                <option value="Isteri">Isteri</option>
                                                <option value="Adik-beradik">Adik-beradik</option>
                                                <option value="Lain-lain">Lain-lain</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank & Uniform */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Shirt size={16} /> Bank & Uniform
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>Nama Bank</label>
                                            <select
                                                value={editForm.bankName}
                                                onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', background: 'white' }}
                                            >
                                                <option value="">Pilih bank...</option>
                                                {BRUNEI_BANKS.map((bank) => (
                                                    <option key={bank} value={bank}>{bank}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>No Akaun Bank</label>
                                            <input
                                                type="text"
                                                value={editForm.bankAccountNo}
                                                onChange={(e) => setEditForm({ ...editForm, bankAccountNo: e.target.value })}
                                                placeholder="0123456789"
                                                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>Nama Akaun Bank</label>
                                            <input
                                                type="text"
                                                value={editForm.bankAccountName}
                                                onChange={(e) => setEditForm({ ...editForm, bankAccountName: e.target.value })}
                                                placeholder="Nama seperti dalam buku bank"
                                                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>Saiz Uniform</label>
                                            <select
                                                value={editForm.uniformSize}
                                                onChange={(e) => setEditForm({ ...editForm, uniformSize: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', background: 'white' }}
                                            >
                                                <option value="">Pilih saiz...</option>
                                                <option value="XS">XS</option>
                                                <option value="S">S</option>
                                                <option value="M">M</option>
                                                <option value="L">L</option>
                                                <option value="XL">XL</option>
                                                <option value="XXL">XXL</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>Saiz Kasut</label>
                                            <input
                                                type="text"
                                                value={editForm.shoeSize}
                                                onChange={(e) => setEditForm({ ...editForm, shoeSize: e.target.value })}
                                                placeholder="Contoh: 40, 42"
                                                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '1.5rem', borderTop: '1px solid #e5e7eb',
                                display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
                                position: 'sticky', bottom: 0, background: 'white',
                            }}>
                                <PremiumButton variant="outline" onClick={closeEditModal}>
                                    Batal
                                </PremiumButton>
                                <PremiumButton icon={Save} variant="primary" onClick={handleSaveProfile} disabled={saving}>
                                    {saving ? 'Menyimpan...' : 'Simpan Profile'}
                                </PremiumButton>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
