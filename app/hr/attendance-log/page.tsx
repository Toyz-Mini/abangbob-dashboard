'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useStaff } from '@/lib/store';
import { getAllAttendance, AttendanceRecord as AttendanceSyncRecord } from '@/lib/supabase/attendance-sync';
import {
    Clock,
    MapPin,
    Camera,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Calendar,
    User,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    ArrowUpDown,
    Download,
    RefreshCw,
} from 'lucide-react';

interface ExtendedAttendanceRecord extends AttendanceSyncRecord {
    staff?: { name: string; email: string } | null;
    location?: { name: string; address: string } | null;
}

interface PhotoModalState {
    isOpen: boolean;
    photoUrl: string | null;
    staffName: string;
    clockTime: string;
    type: 'in' | 'out';
}

export default function AttendanceLogPage() {
    const { user, isAdmin, isManager } = useAuth();
    const { staff } = useStaff();
    const [isLoading, setIsLoading] = useState(true);
    const [records, setRecords] = useState<ExtendedAttendanceRecord[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');

    // Sorting
    const [sortBy, setSortBy] = useState<'date' | 'staff' | 'clockIn'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Photo Modal
    const [photoModal, setPhotoModal] = useState<PhotoModalState>({
        isOpen: false,
        photoUrl: null,
        staffName: '',
        clockTime: '',
        type: 'in'
    });

    // Calculate date range
    const getDateRange = () => {
        const today = new Date();
        let startDate = selectedDate;
        let endDate = selectedDate;

        switch (dateRange) {
            case 'today':
                startDate = today.toISOString().split('T')[0];
                endDate = startDate;
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - 7);
                startDate = weekStart.toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                startDate = monthStart.toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'custom':
                startDate = selectedDate;
                endDate = selectedDate;
                break;
        }

        return { startDate, endDate };
    };

    // Load attendance data
    const loadAttendance = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { startDate, endDate } = getDateRange();
            const result = await getAllAttendance(startDate, endDate);

            if (result.success && result.data) {
                setRecords(result.data as ExtendedAttendanceRecord[]);
            } else {
                setError(result.error || 'Gagal memuatkan data kehadiran');
            }
        } catch (err: any) {
            console.error('Error loading attendance:', err);
            setError(err.message || 'Ralat tidak dijangka');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAttendance();
    }, [dateRange, selectedDate]);

    // Filter and sort records
    const filteredRecords = useMemo(() => {
        let filtered = [...records];

        // Filter by search query (staff name)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.staff?.name?.toLowerCase().includes(query) ||
                r.staff?.email?.toLowerCase().includes(query)
            );
        }

        // Filter by selected staff
        if (selectedStaff !== 'all') {
            filtered = filtered.filter(r => r.staff_id === selectedStaff);
        }

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                    break;
                case 'staff':
                    comparison = (a.staff?.name || '').localeCompare(b.staff?.name || '');
                    break;
                case 'clockIn':
                    comparison = new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime();
                    break;
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });

        return filtered;
    }, [records, searchQuery, selectedStaff, sortBy, sortOrder]);

    // Format time
    const formatTime = (isoString: string | null) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleTimeString('ms-MY', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ms-MY', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Open photo modal
    const openPhotoModal = (photoUrl: string | null, staffName: string, clockTime: string, type: 'in' | 'out') => {
        if (photoUrl) {
            setPhotoModal({
                isOpen: true,
                photoUrl,
                staffName,
                clockTime,
                type
            });
        }
    };

    if (!isAdmin && !isManager) {
        return (
            <MainLayout>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <XCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                    <h2>Akses Ditolak</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Anda tidak mempunyai akses ke halaman ini.</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                            📋 Log Kehadiran
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Lihat rekod check-in/out staff termasuk selfie dan lokasi
                        </p>
                    </div>

                    <button
                        onClick={loadAttendance}
                        disabled={isLoading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 600,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        Muat Semula
                    </button>
                </div>

                {/* Filters Card */}
                <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        alignItems: 'end'
                    }}>
                        {/* Search */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                Cari Staff
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    type="text"
                                    placeholder="Nama atau email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 0.75rem 0.75rem 40px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-secondary)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Staff Filter */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                Staff
                            </label>
                            <select
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem',
                                    background: 'var(--bg-secondary)'
                                }}
                            >
                                <option value="all">Semua Staff</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                Tempoh
                            </label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as any)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem',
                                    background: 'var(--bg-secondary)'
                                }}
                            >
                                <option value="today">Hari Ini</option>
                                <option value="week">7 Hari Lepas</option>
                                <option value="month">Bulan Ini</option>
                                <option value="custom">Tarikh Khusus</option>
                            </select>
                        </div>

                        {/* Custom Date */}
                        {dateRange === 'custom' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                    Pilih Tarikh
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-secondary)'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: 'var(--danger-light)',
                        color: 'var(--danger-dark)',
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <XCircle size={20} />
                        {error}
                    </div>
                )}

                {/* Loading */}
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        {/* Summary Stats */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                borderRadius: '12px',
                                padding: '1rem',
                                color: 'white',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{filteredRecords.length}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', fontWeight: 600 }}>Jumlah Rekod</div>
                            </div>

                            <div style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                borderRadius: '12px',
                                padding: '1rem',
                                color: 'white',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                                    {filteredRecords.filter(r => r.location_verified).length}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', fontWeight: 600 }}>Lokasi Disahkan</div>
                            </div>

                            <div style={{
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                borderRadius: '12px',
                                padding: '1rem',
                                color: 'white',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                                    {filteredRecords.filter(r => r.selfie_url).length}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', fontWeight: 600 }}>Dengan Selfie</div>
                            </div>

                            <div style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                borderRadius: '12px',
                                padding: '1rem',
                                color: 'white',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                                    {filteredRecords.filter(r => r.clock_out).length}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', fontWeight: 600 }}>Sudah Clock Out</div>
                            </div>
                        </div>

                        {/* Records Table */}
                        <div style={{
                            background: 'var(--bg-primary)',
                            borderRadius: '16px',
                            border: '1px solid var(--border-color)',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            {/* Table Header */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1fr',
                                gap: '0.5rem',
                                padding: '1rem 1.5rem',
                                background: 'var(--bg-secondary)',
                                borderBottom: '1px solid var(--border-color)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: 'var(--text-secondary)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={14} /> Staff
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={14} /> Tarikh
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={14} /> Masuk
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={14} /> Keluar
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={14} /> Lokasi
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Camera size={14} /> Selfie
                                </div>
                            </div>

                            {/* Table Body */}
                            {filteredRecords.length === 0 ? (
                                <div style={{
                                    padding: '3rem',
                                    textAlign: 'center',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                    <p>Tiada rekod kehadiran untuk tempoh ini.</p>
                                </div>
                            ) : (
                                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                    {filteredRecords.map((record) => (
                                        <div
                                            key={record.id}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1fr',
                                                gap: '0.5rem',
                                                padding: '1rem 1.5rem',
                                                borderBottom: '1px solid var(--border-color)',
                                                alignItems: 'center',
                                                transition: 'background 0.2s',
                                                cursor: 'default'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {/* Staff */}
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                                    {record.staff?.name || 'Unknown'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {record.staff?.email || record.staff_id}
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                {formatDate(record.date)}
                                            </div>

                                            {/* Clock In */}
                                            <div>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    background: 'var(--success-light)',
                                                    color: 'var(--success-dark)',
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: '8px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600
                                                }}>
                                                    {formatTime(record.clock_in)}
                                                </span>
                                            </div>

                                            {/* Clock Out */}
                                            <div>
                                                {record.clock_out ? (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        background: 'var(--primary-50)',
                                                        color: 'var(--primary)',
                                                        padding: '0.35rem 0.75rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600
                                                    }}>
                                                        {formatTime(record.clock_out)}
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        background: 'var(--warning-light)',
                                                        color: 'var(--warning-dark)',
                                                        padding: '0.35rem 0.75rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}>
                                                        Belum
                                                    </span>
                                                )}
                                            </div>

                                            {/* Location */}
                                            <div>
                                                {record.location_verified ? (
                                                    <div>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            color: 'var(--success)',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 600
                                                        }}>
                                                            <CheckCircle size={14} />
                                                            {record.location?.name || 'Disahkan'}
                                                        </div>
                                                        {record.distance_meters !== null && (
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                                Jarak: {Math.round(record.distance_meters || 0)}m
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{
                                                        color: 'var(--text-light)',
                                                        fontSize: '0.85rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem'
                                                    }}>
                                                        <XCircle size={14} />
                                                        Tidak Disahkan
                                                    </span>
                                                )}
                                            </div>

                                            {/* Selfie */}
                                            <div>
                                                {record.selfie_url ? (
                                                    <button
                                                        onClick={() => openPhotoModal(
                                                            record.selfie_url,
                                                            record.staff?.name || 'Staff',
                                                            formatTime(record.clock_in),
                                                            'in'
                                                        )}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            padding: '0.35rem 0.75rem',
                                                            background: 'var(--primary)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <Eye size={14} />
                                                        Lihat
                                                    </button>
                                                ) : (
                                                    <span style={{
                                                        color: 'var(--text-light)',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        Tiada
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Photo Modal */}
                {photoModal.isOpen && photoModal.photoUrl && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            padding: '2rem'
                        }}
                        onClick={() => setPhotoModal(prev => ({ ...prev, isOpen: false }))}
                    >
                        <div
                            style={{
                                background: 'var(--bg-primary)',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                maxWidth: '500px',
                                width: '100%',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                        📸 Selfie {photoModal.type === 'in' ? 'Clock In' : 'Clock Out'}
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {photoModal.staffName} • {photoModal.clockTime}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setPhotoModal(prev => ({ ...prev, isOpen: false }))}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Photo */}
                            <div style={{ padding: '1.5rem' }}>
                                <img
                                    src={photoModal.photoUrl}
                                    alt={`Selfie ${photoModal.staffName}`}
                                    style={{
                                        width: '100%',
                                        borderRadius: '12px',
                                        boxShadow: 'var(--shadow-md)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
