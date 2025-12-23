'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    UserCheck,
    UserX,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Phone,
    Mail,
    Calendar,
    MapPin,
    AlertCircle,
    Users,
} from 'lucide-react';

interface PendingUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    icNumber: string;
    dateOfBirth: string;
    address: string;
    emergencyContact: {
        name: string;
        relation: string;
        phone: string;
    };
    createdAt: string;
    status: string;
}

export default function UserApprovalsPage() {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const response = await fetch('/api/admin/pending-users');
            if (response.ok) {
                const data = await response.json();
                setPendingUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching pending users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        setProcessing(true);
        try {
            const response = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'approve' }),
            });

            if (response.ok) {
                setPendingUsers(prev => prev.filter(u => u.id !== userId));
                setSelectedUser(null);
            }
        } catch (error) {
            console.error('Error approving user:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (userId: string) => {
        const reason = prompt('Sebab penolakan (optional):');

        setProcessing(true);
        try {
            const response = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'reject', reason }),
            });

            if (response.ok) {
                setPendingUsers(prev => prev.filter(u => u.id !== userId));
                setSelectedUser(null);
            }
        } catch (error) {
            console.error('Error rejecting user:', error);
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ms-MY', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <MainLayout>
            <div className="animate-fade-in" style={{ padding: '1.5rem' }}>
                <div className="page-header">
                    <h1 className="page-title">
                        <UserCheck size={28} style={{ marginRight: '0.5rem' }} />
                        Kelulusan Pengguna
                    </h1>
                    <p className="page-subtitle">Semak dan luluskan pendaftaran pengguna baru</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <Clock size={24} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pendingUsers.length}</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>Menunggu</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <CheckCircle size={24} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>-</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>Diluluskan</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <XCircle size={24} style={{ color: '#ef4444', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>-</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>Ditolak</div>
                    </div>
                </div>

                {loading ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <LoadingSpinner />
                    </div>
                ) : pendingUsers.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <CheckCircle size={48} style={{ color: '#22c55e', marginBottom: '1rem' }} />
                        <h3>Tiada Permohonan Baru</h3>
                        <p style={{ color: '#666' }}>Semua permohonan telah diproses</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1rem' }}>
                        {/* User List */}
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">Senarai Permohonan</div>
                                <div className="card-subtitle">{pendingUsers.length} menunggu kelulusan</div>
                            </div>
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {pendingUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <div className="user-avatar">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="user-info">
                                            <div className="user-name">{user.name}</div>
                                            <div className="user-email">{user.email}</div>
                                        </div>
                                        <Eye size={18} style={{ color: '#999' }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* User Detail */}
                        {selectedUser ? (
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title">Butiran Permohonan</div>
                                </div>

                                <div className="detail-section">
                                    <h4>
                                        <Users size={16} />
                                        Maklumat Peribadi
                                    </h4>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Nama</span>
                                            <span className="detail-value">{selectedUser.name}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">
                                                <Mail size={14} /> Email
                                            </span>
                                            <span className="detail-value">{selectedUser.email}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">
                                                <Phone size={14} /> Telefon
                                            </span>
                                            <span className="detail-value">{selectedUser.phone || '-'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">No. IC</span>
                                            <span className="detail-value">{selectedUser.icNumber || '-'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">
                                                <Calendar size={14} /> Tarikh Lahir
                                            </span>
                                            <span className="detail-value">
                                                {selectedUser.dateOfBirth ? formatDate(selectedUser.dateOfBirth) : '-'}
                                            </span>
                                        </div>
                                        <div className="detail-item full">
                                            <span className="detail-label">
                                                <MapPin size={14} /> Alamat
                                            </span>
                                            <span className="detail-value">{selectedUser.address || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedUser.emergencyContact && (
                                    <div className="detail-section">
                                        <h4>
                                            <AlertCircle size={16} />
                                            Kenalan Kecemasan
                                        </h4>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">Nama</span>
                                                <span className="detail-value">{selectedUser.emergencyContact.name}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Hubungan</span>
                                                <span className="detail-value">{selectedUser.emergencyContact.relation || '-'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Telefon</span>
                                                <span className="detail-value">{selectedUser.emergencyContact.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="action-buttons">
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleReject(selectedUser.id)}
                                        disabled={processing}
                                    >
                                        <XCircle size={18} />
                                        Tolak
                                    </button>
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleApprove(selectedUser.id)}
                                        disabled={processing}
                                    >
                                        <CheckCircle size={18} />
                                        Luluskan
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                                <div style={{ textAlign: 'center', color: '#999' }}>
                                    <Eye size={48} style={{ marginBottom: '1rem' }} />
                                    <p>Pilih pengguna untuk melihat butiran</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
        .user-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
        }

        .user-item:hover {
          background: #f9fafb;
        }

        .user-item.selected {
          background: #fef2f2;
          border-left: 3px solid #CC1512;
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #CC1512, #8B0000);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1rem;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .user-email {
          font-size: 0.875rem;
          color: #666;
        }

        .detail-section {
          margin-bottom: 1.5rem;
        }

        .detail-section h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .detail-item {
          background: #f9fafb;
          padding: 0.75rem;
          border-radius: 8px;
        }

        .detail-item.full {
          grid-column: 1 / -1;
        }

        .detail-label {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .detail-value {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #f0f0f0;
        }

        .action-buttons .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-success {
          background: #22c55e;
          color: white;
          border: none;
        }

        .btn-danger {
          background: #f5f5f5;
          color: #ef4444;
          border: 1px solid #fecaca;
        }

        .btn-success:hover {
          background: #16a34a;
        }

        .btn-danger:hover {
          background: #fef2f2;
        }
      `}</style>
        </MainLayout>
    );
}
