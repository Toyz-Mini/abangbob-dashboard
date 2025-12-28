'use client';

import { useState, useMemo } from 'react';
import StaffLayout from '@/components/StaffLayout';
import { useStaffPortal } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    Clock,
    Plus,
    Calendar,
    DollarSign,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText
} from 'lucide-react';

// Default OT settings
const DEFAULT_OT_RATE = 5; // BND per hour
const DEFAULT_MULTIPLIER = 1.5;

export default function OTClaimPage() {
    const { currentStaff, isStaffLoggedIn } = useAuth();
    const { otClaims, addOTClaim, getStaffOTClaims } = useStaffPortal();

    const [showModal, setShowModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'paid'>('all');

    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '22:00',
        reason: '',
        hourlyRate: DEFAULT_OT_RATE,
        multiplier: DEFAULT_MULTIPLIER,
    });

    // Get staff's OT claims
    const myClaims = useMemo(() => {
        if (!currentStaff) return [];
        return getStaffOTClaims(currentStaff.id);
    }, [currentStaff, getStaffOTClaims, otClaims]);

    // Filtered claims
    const filteredClaims = useMemo(() => {
        if (filterStatus === 'all') return myClaims;
        return myClaims.filter(c => c.status === filterStatus);
    }, [myClaims, filterStatus]);

    // Calculate hours worked
    const calculateHours = (startTime: string, endTime: string): number => {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        let hours = endH - startH + (endM - startM) / 60;
        if (hours < 0) hours += 24; // Handle overnight OT
        return Math.max(0, hours);
    };

    // Form calculations
    const hoursWorked = calculateHours(formData.startTime, formData.endTime);
    const totalAmount = hoursWorked * formData.hourlyRate * formData.multiplier;

    // Stats
    const stats = useMemo(() => {
        const pending = myClaims.filter(c => c.status === 'pending').length;
        const approved = myClaims.filter(c => c.status === 'approved').length;
        const totalApprovedAmount = myClaims
            .filter(c => c.status === 'approved' || c.status === 'paid')
            .reduce((sum, c) => sum + c.totalAmount, 0);
        const totalHours = myClaims
            .filter(c => c.status === 'approved' || c.status === 'paid')
            .reduce((sum, c) => sum + c.hoursWorked, 0);
        return { pending, approved, totalApprovedAmount, totalHours };
    }, [myClaims]);

    const handleSubmit = async () => {
        if (!currentStaff) return;
        if (!formData.reason.trim()) {
            alert('Sila masukkan sebab OT');
            return;
        }
        if (hoursWorked <= 0) {
            alert('Masa OT tidak sah');
            return;
        }

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 500)); // Simulate processing

        addOTClaim({
            staffId: currentStaff.id,
            staffName: currentStaff.name,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            hoursWorked,
            hourlyRate: formData.hourlyRate,
            multiplier: formData.multiplier,
            totalAmount,
            reason: formData.reason.trim(),
            status: 'pending',
        });

        setShowModal(false);
        setIsProcessing(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            startTime: '18:00',
            endTime: '22:00',
            reason: '',
            hourlyRate: DEFAULT_OT_RATE,
            multiplier: DEFAULT_MULTIPLIER,
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="badge badge-warning">Menunggu</span>;
            case 'approved':
                return <span className="badge badge-success">Diluluskan</span>;
            case 'rejected':
                return <span className="badge badge-danger">Ditolak</span>;
            case 'paid':
                return <span className="badge badge-info">Dibayar</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    if (!isStaffLoggedIn || !currentStaff) {
        return (
            <StaffLayout>
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <AlertCircle size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
                    <h2>Sila Log Masuk</h2>
                    <p>Anda perlu log masuk sebagai staf untuk mengakses halaman ini.</p>
                </div>
            </StaffLayout>
        );
    }

    return (
        <StaffLayout>
            <div className="animate-fade-in">
                <div className="page-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 className="page-title">Tuntutan OT</h1>
                            <p className="page-subtitle">Hantar tuntutan kerja lebih masa untuk kelulusan</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={18} />
                            Tuntut OT Baru
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="content-grid cols-4 mb-lg">
                    <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                        <Clock size={24} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.pending}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Menunggu</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                        <CheckCircle size={24} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.approved}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Diluluskan</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                        <DollarSign size={24} color="var(--warning)" style={{ marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>BND {stats.totalApprovedAmount.toFixed(2)}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Jumlah OT</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                        <FileText size={24} color="var(--info)" style={{ marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalHours.toFixed(1)} jam</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Jam OT</div>
                    </div>
                </div>

                {/* Filter */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(['all', 'pending', 'approved', 'rejected', 'paid'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-outline'}`}
                        >
                            {status === 'all' ? 'Semua' : status === 'pending' ? 'Menunggu' : status === 'approved' ? 'Diluluskan' : status === 'rejected' ? 'Ditolak' : 'Dibayar'}
                        </button>
                    ))}
                </div>

                {/* Claims List */}
                {filteredClaims.length > 0 ? (
                    <div className="card">
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Tarikh</th>
                                        <th>Masa</th>
                                        <th>Jam</th>
                                        <th>Jumlah</th>
                                        <th>Sebab</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClaims.map(claim => (
                                        <tr key={claim.id}>
                                            <td>{new Date(claim.date).toLocaleDateString('ms-MY')}</td>
                                            <td>{claim.startTime} - {claim.endTime}</td>
                                            <td>{claim.hoursWorked.toFixed(1)} jam</td>
                                            <td style={{ fontWeight: 600 }}>BND {claim.totalAmount.toFixed(2)}</td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {claim.reason}
                                            </td>
                                            <td>
                                                {getStatusBadge(claim.status)}
                                                {claim.status === 'rejected' && claim.rejectionReason && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                                                        {claim.rejectionReason}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Clock size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            {filterStatus !== 'all' ? 'Tiada tuntutan untuk status ini' : 'Belum ada tuntutan OT'}
                        </p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={18} />
                            Tuntut OT Pertama
                        </button>
                    </div>
                )}

                {/* Add OT Claim Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Tuntutan OT Baru"
                    maxWidth="500px"
                >
                    <div className="form-group">
                        <label className="form-label">Tarikh OT *</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Masa Mula *</label>
                            <input
                                type="time"
                                className="form-input"
                                value={formData.startTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Masa Tamat *</label>
                            <input
                                type="time"
                                className="form-input"
                                value={formData.endTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sebab OT *</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="Contoh: Kena siapkan order untuk event..."
                        />
                    </div>

                    {/* Summary Card */}
                    <div className="card" style={{ background: 'var(--gray-100)', padding: '1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <div>Jam Kerja:</div>
                            <div style={{ fontWeight: 600 }}>{hoursWorked.toFixed(1)} jam</div>
                            <div>Kadar OT:</div>
                            <div style={{ fontWeight: 600 }}>BND {formData.hourlyRate} x {formData.multiplier}</div>
                            <div style={{ borderTop: '1px solid var(--gray-300)', paddingTop: '0.5rem' }}>Jumlah:</div>
                            <div style={{ borderTop: '1px solid var(--gray-300)', paddingTop: '0.5rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                                BND {totalAmount.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                            Batal
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={isProcessing || hoursWorked <= 0 || !formData.reason.trim()}
                            style={{ flex: 1 }}
                        >
                            {isProcessing ? <LoadingSpinner size="sm" /> : 'Hantar Tuntutan'}
                        </button>
                    </div>
                </Modal>
            </div>
        </StaffLayout>
    );
}
