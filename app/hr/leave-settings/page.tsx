'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStaff, useStaffPortal } from '@/lib/store';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    Settings,
    Calendar,
    Save,
    X,
    Search,
    Edit3,
    RefreshCw,
    Users,
    Briefcase,
    Building,
    Heart,
    Plane,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import * as SupabaseSync from '@/lib/supabase-sync';

// Leave types configuration - using theme colors
const LEAVE_TYPES = [
    { key: 'annual', label: 'Tahunan', defaultDays: 14, icon: Plane },
    { key: 'medical', label: 'Sakit', defaultDays: 14, icon: Heart },
    { key: 'emergency', label: 'Kecemasan', defaultDays: 3, icon: AlertCircle },
    { key: 'replacement', label: 'Ganti', defaultDays: 0, icon: RefreshCw },
    { key: 'maternity', label: 'Bersalin', defaultDays: 105, icon: Heart },
    { key: 'paternity', label: 'Paternity', defaultDays: 3, icon: Users },
    { key: 'compassionate', label: 'Compassionate', defaultDays: 3, icon: Heart },
] as const;

type LeaveType = typeof LEAVE_TYPES[number]['key'];

interface EditingState {
    staffId: string;
    staffName: string;
    values: Record<LeaveType, number>;
}

// Role badge colors
const getRoleBadgeStyle = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('admin') || roleLower.includes('owner')) {
        return { background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', color: 'white' };
    }
    if (roleLower.includes('manager') || roleLower.includes('supervisor')) {
        return { background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white' };
    }
    if (roleLower.includes('chef') || roleLower.includes('cook')) {
        return { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' };
    }
    return { background: 'var(--gray-200)', color: 'var(--gray-700)' };
};

export default function LeaveSettingsPage() {
    const { staff, isInitialized } = useStaff();
    const { leaveBalances, getLeaveBalance, updateLeaveBalance } = useStaffPortal();

    const [searchQuery, setSearchQuery] = useState('');
    const [editing, setEditing] = useState<EditingState | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Filter active staff
    const activeStaff = useMemo(() => {
        return staff
            .filter(s => s.status === 'active')
            .filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.role.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [staff, searchQuery]);

    const currentYear = new Date().getFullYear();

    // Calculate stats
    const stats = useMemo(() => {
        const totalStaff = activeStaff.length;
        const withEntitlements = activeStaff.filter(s => getLeaveBalance(s.id, currentYear)).length;
        const totalAnnualDays = activeStaff.reduce((sum, s) => {
            const balance = getLeaveBalance(s.id, currentYear);
            return sum + (balance?.annual?.entitled || 14);
        }, 0);

        // DIAGNOSTIC LOG
        if (activeStaff.length > 0) {
            console.log('[LeaveStats] Diagnostic:', {
                yearToMatch: currentYear,
                balancesCount: leaveBalances.length,
                // Log strictly the IDs for easy comparison
                IDS_IN_STORE: leaveBalances.map(lb => ({ id: lb.id, staffId: lb.staffId })),
                IDS_IN_STAFF: activeStaff.map(s => ({ name: s.name, id: s.id })),

                matches: activeStaff.map(s => {
                    const found = leaveBalances.find(lb => lb.staffId === s.id);
                    return {
                        name: s.name,
                        id: s.id,
                        matched: !!found,
                        foundStaffId: found?.staffId
                    };
                })
            });
        }

        return { totalStaff, withEntitlements, totalAnnualDays };
    }, [activeStaff, getLeaveBalance, currentYear, leaveBalances]);

    // Get entitlement for a staff member
    const getEntitlement = (staffId: string, type: LeaveType): number => {
        const balance = getLeaveBalance(staffId, currentYear);
        if (!balance) {
            const leaveType = LEAVE_TYPES.find(lt => lt.key === type);
            return leaveType?.defaultDays || 0;
        }
        return (balance[type] as any)?.entitled || 0;
    };

    // Get used days for a staff member
    const getUsed = (staffId: string, type: LeaveType): number => {
        const balance = getLeaveBalance(staffId, currentYear);
        if (!balance) return 0;
        return (balance[type] as any)?.taken || 0;
    };

    // Start editing a staff's entitlements
    const startEditing = (staffId: string, staffName: string) => {
        const values: Record<LeaveType, number> = {} as any;
        LEAVE_TYPES.forEach(lt => {
            values[lt.key] = getEntitlement(staffId, lt.key);
        });
        setEditing({ staffId, staffName, values });
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditing(null);
    };

    // Update value while editing
    const updateValue = (type: LeaveType, value: number) => {
        if (!editing) return;
        setEditing({
            ...editing,
            values: { ...editing.values, [type]: Math.max(0, value) }
        });
    };

    // Apply default values
    const applyDefaults = () => {
        if (!editing) return;
        const values: Record<LeaveType, number> = {} as any;
        LEAVE_TYPES.forEach(lt => {
            values[lt.key] = lt.defaultDays;
        });
        setEditing({ ...editing, values });
    };

    // Save entitlements
    const saveEntitlements = async () => {
        if (!editing) return;

        setSaving(true);
        setMessage(null);

        try {
            const existingBalance = getLeaveBalance(editing.staffId, currentYear);

            const newBalance = {
                id: existingBalance?.id || crypto.randomUUID(),
                staffId: editing.staffId,
                year: currentYear,
                annual: {
                    entitled: editing.values.annual,
                    taken: existingBalance?.annual?.taken || 0,
                    pending: existingBalance?.annual?.pending || 0,
                    balance: editing.values.annual - (existingBalance?.annual?.taken || 0) - (existingBalance?.annual?.pending || 0)
                },
                medical: {
                    entitled: editing.values.medical,
                    taken: existingBalance?.medical?.taken || 0,
                    pending: existingBalance?.medical?.pending || 0,
                    balance: editing.values.medical - (existingBalance?.medical?.taken || 0) - (existingBalance?.medical?.pending || 0)
                },
                emergency: {
                    entitled: editing.values.emergency,
                    taken: existingBalance?.emergency?.taken || 0,
                    pending: existingBalance?.emergency?.pending || 0,
                    balance: editing.values.emergency - (existingBalance?.emergency?.taken || 0) - (existingBalance?.emergency?.pending || 0)
                },
                replacement: {
                    entitled: editing.values.replacement,
                    taken: existingBalance?.replacement?.taken || 0,
                    pending: existingBalance?.replacement?.pending || 0,
                    balance: editing.values.replacement - (existingBalance?.replacement?.taken || 0) - (existingBalance?.replacement?.pending || 0)
                },
                maternity: {
                    entitled: editing.values.maternity,
                    taken: existingBalance?.maternity?.taken || 0,
                    pending: existingBalance?.maternity?.pending || 0,
                    balance: editing.values.maternity - (existingBalance?.maternity?.taken || 0) - (existingBalance?.maternity?.pending || 0)
                },
                paternity: {
                    entitled: editing.values.paternity,
                    taken: existingBalance?.paternity?.taken || 0,
                    pending: existingBalance?.paternity?.pending || 0,
                    balance: editing.values.paternity - (existingBalance?.paternity?.taken || 0) - (existingBalance?.paternity?.pending || 0)
                },
                compassionate: {
                    entitled: editing.values.compassionate,
                    taken: existingBalance?.compassionate?.taken || 0,
                    pending: existingBalance?.compassionate?.pending || 0,
                    balance: editing.values.compassionate - (existingBalance?.compassionate?.taken || 0) - (existingBalance?.compassionate?.pending || 0)
                },
                unpaid: { taken: existingBalance?.unpaid?.taken || 0 },
                createdAt: existingBalance?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const result = await SupabaseSync.syncUpsertLeaveBalance(newBalance);

            if (!result) {
                throw new Error('Failed to save to server');
            }

            updateLeaveBalance(newBalance);

            setMessage({ type: 'success', text: `✓ Entitlement untuk ${editing.staffName} berjaya dikemaskini!` });
            setEditing(null);

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save entitlements:', error);
            setMessage({ type: 'error', text: 'Gagal menyimpan. Sila semak sambungan atau cuba lagi.' });
        } finally {
            setSaving(false);
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
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}>
                            <Settings size={24} />
                        </div>
                        Tetapan Cuti {currentYear}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Urus entitlement cuti untuk setiap staf
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ background: 'var(--primary)', color: 'white', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Users size={32} style={{ opacity: 0.9 }} />
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.totalStaff}</div>
                                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Staf Aktif</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ background: 'var(--success)', color: 'white', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <CheckCircle size={32} style={{ opacity: 0.9 }} />
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.withEntitlements}</div>
                                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Ada Rekod Cuti</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ background: 'var(--secondary)', color: 'white', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Calendar size={32} style={{ opacity: 0.9 }} />
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.totalAnnualDays}</div>
                                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Jumlah Hari (Tahunan)</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div
                        style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius)',
                            marginBottom: '1rem',
                            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                            color: message.type === 'success' ? '#166534' : '#991b1b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 500
                        }}
                    >
                        {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {message.text}
                    </div>
                )}

                {/* Search */}
                <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Cari nama atau peranan staf..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input"
                            style={{ paddingLeft: '44px', width: '100%', fontSize: '1rem' }}
                        />
                    </div>
                </div>

                {/* Edit Modal */}
                {editing && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}>
                        <div className="card" style={{
                            width: '100%',
                            maxWidth: '500px',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            animation: 'slideUp 0.2s ease'
                        }}>
                            <div className="card-header" style={{ borderBottom: '1px solid var(--gray-200)', paddingBottom: '1rem' }}>
                                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Edit3 size={20} />
                                    Edit Entitlement
                                </div>
                                <div className="card-subtitle" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                    {editing.staffName}
                                </div>
                            </div>

                            <div style={{ padding: '1rem 0' }}>
                                {LEAVE_TYPES.map(lt => {
                                    const Icon = lt.icon;
                                    return (
                                        <div
                                            key={lt.key}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.75rem 0',
                                                borderBottom: '1px solid var(--gray-100)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '8px',
                                                    background: 'var(--primary-light)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Icon size={18} style={{ color: 'var(--primary)' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{lt.label}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        Default: {lt.defaultDays} hari
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={editing.values[lt.key]}
                                                    onChange={(e) => updateValue(lt.key, parseInt(e.target.value) || 0)}
                                                    className="input"
                                                    style={{
                                                        width: '80px',
                                                        textAlign: 'center',
                                                        padding: '0.5rem',
                                                        fontWeight: 600,
                                                        fontSize: '1.1rem'
                                                    }}
                                                />
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>hari</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '0.75rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--gray-200)'
                            }}>
                                <button
                                    className="btn btn-outline"
                                    onClick={applyDefaults}
                                    style={{ flex: 1 }}
                                >
                                    <RefreshCw size={16} />
                                    Default
                                </button>
                                <button
                                    className="btn btn-outline"
                                    onClick={cancelEditing}
                                    disabled={saving}
                                    style={{ flex: 1 }}
                                >
                                    Batal
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={saveEntitlements}
                                    disabled={saving}
                                    style={{ flex: 1.5 }}
                                >
                                    {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Staff Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1rem' }}>
                    {activeStaff.map(staffMember => {
                        const balance = getLeaveBalance(staffMember.id, currentYear);
                        const hasRecord = !!balance;

                        return (
                            <div
                                key={staffMember.id}
                                className="card"
                                style={{
                                    padding: '1.25rem',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                    border: hasRecord ? '2px solid var(--primary-light)' : '2px solid transparent'
                                }}
                                onClick={() => startEditing(staffMember.id, staffMember.name)}
                            >
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{staffMember.name}</div>
                                        <span
                                            style={{
                                                ...getRoleBadgeStyle(staffMember.role),
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                display: 'inline-block',
                                                marginTop: '0.25rem'
                                            }}
                                        >
                                            {staffMember.role.toUpperCase()}
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEditing(staffMember.id, staffMember.name);
                                        }}
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                </div>

                                {/* Leave Summary */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                    {LEAVE_TYPES.slice(0, 4).map(lt => {
                                        const entitled = getEntitlement(staffMember.id, lt.key);
                                        const used = getUsed(staffMember.id, lt.key);
                                        const Icon = lt.icon;

                                        return (
                                            <div
                                                key={lt.key}
                                                style={{
                                                    textAlign: 'center',
                                                    padding: '0.5rem 0.25rem',
                                                    borderRadius: '8px',
                                                    background: 'var(--bg-secondary)',
                                                    border: '1px solid var(--border-color)'
                                                }}
                                                title={`${lt.label}: ${entitled} hari (${used} digunakan)`}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                                    <Icon size={12} style={{ color: 'var(--text-secondary)' }} />
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{lt.label}</div>
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{entitled}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {activeStaff.length === 0 && (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <Users size={48} style={{ color: 'var(--gray-300)', marginBottom: '1rem' }} />
                        <div style={{ color: 'var(--text-secondary)' }}>Tiada staf dijumpai</div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
