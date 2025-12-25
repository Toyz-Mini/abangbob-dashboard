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
    RefreshCw
} from 'lucide-react';
import * as SupabaseSync from '@/lib/supabase-sync';

// Leave types configuration
const LEAVE_TYPES = [
    { key: 'annual', label: 'Tahunan', defaultDays: 14 },
    { key: 'medical', label: 'Sakit', defaultDays: 14 },
    { key: 'emergency', label: 'Kecemasan', defaultDays: 3 },
    { key: 'replacement', label: 'Ganti', defaultDays: 0 },
    { key: 'maternity', label: 'Bersalin', defaultDays: 105 },
    { key: 'paternity', label: 'Paternity', defaultDays: 3 },
    { key: 'compassionate', label: 'Compassionate', defaultDays: 3 },
] as const;

type LeaveType = typeof LEAVE_TYPES[number]['key'];

interface EditingState {
    staffId: string;
    values: Record<LeaveType, number>;
}

export default function LeaveSettingsPage() {
    const { staff, isInitialized } = useStaff();
    const { leaveBalances, getLeaveBalance } = useStaffPortal();

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

    // Get entitlement for a staff member
    const getEntitlement = (staffId: string, type: LeaveType): number => {
        const balance = getLeaveBalance(staffId, currentYear);
        if (!balance) {
            // Return default
            const leaveType = LEAVE_TYPES.find(lt => lt.key === type);
            return leaveType?.defaultDays || 0;
        }
        return (balance[type] as any)?.entitled || 0;
    };

    // Start editing a staff's entitlements
    const startEditing = (staffId: string) => {
        const values: Record<LeaveType, number> = {} as any;
        LEAVE_TYPES.forEach(lt => {
            values[lt.key] = getEntitlement(staffId, lt.key);
        });
        setEditing({ staffId, values });
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

    // Save entitlements
    const saveEntitlements = async () => {
        if (!editing) return;

        setSaving(true);
        setMessage(null);

        try {
            const staffMember = staff.find(s => s.id === editing.staffId);
            const existingBalance = getLeaveBalance(editing.staffId, currentYear);

            const newBalance = {
                id: existingBalance?.id || `lb_${Date.now()}`,
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

            // Sync to Supabase
            await SupabaseSync.syncUpsertLeaveBalance(newBalance);

            setMessage({ type: 'success', text: `Entitlement untuk ${staffMember?.name} berjaya dikemaskini!` });
            setEditing(null);

            // Refresh after short delay
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save entitlements:', error);
            setMessage({ type: 'error', text: 'Gagal menyimpan. Sila cuba lagi.' });
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Settings size={32} />
                            Tetapan Cuti
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Edit entitlement cuti untuk setiap staf - Tahun {currentYear}
                        </p>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}
                        style={{ marginBottom: '1rem' }}
                    >
                        {message.text}
                    </div>
                )}

                {/* Search */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Cari staf..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input"
                            style={{ paddingLeft: '40px', width: '100%' }}
                        />
                    </div>
                </div>

                {/* Staff Entitlements Table */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={20} />
                            Entitlement Cuti Staf ({activeStaff.length})
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="table" style={{ minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th>Staf</th>
                                    <th>Peranan</th>
                                    {LEAVE_TYPES.map(lt => (
                                        <th key={lt.key} style={{ textAlign: 'center' }}>{lt.label}</th>
                                    ))}
                                    <th style={{ textAlign: 'center' }}>Tindakan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeStaff.map(staffMember => {
                                    const isEditing = editing?.staffId === staffMember.id;

                                    return (
                                        <tr key={staffMember.id}>
                                            <td style={{ fontWeight: 600 }}>{staffMember.name}</td>
                                            <td>
                                                <span className="badge badge-outline">{staffMember.role}</span>
                                            </td>
                                            {LEAVE_TYPES.map(lt => (
                                                <td key={lt.key} style={{ textAlign: 'center' }}>
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={editing.values[lt.key]}
                                                            onChange={(e) => updateValue(lt.key, parseInt(e.target.value) || 0)}
                                                            className="input"
                                                            style={{ width: '60px', textAlign: 'center', padding: '0.25rem' }}
                                                        />
                                                    ) : (
                                                        <span style={{
                                                            fontWeight: 500,
                                                            color: getEntitlement(staffMember.id, lt.key) === 0 ? 'var(--text-secondary)' : 'inherit'
                                                        }}>
                                                            {getEntitlement(staffMember.id, lt.key)}
                                                        </span>
                                                    )}
                                                </td>
                                            ))}
                                            <td style={{ textAlign: 'center' }}>
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={saveEntitlements}
                                                            disabled={saving}
                                                        >
                                                            {saving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                                                        </button>
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={cancelEditing}
                                                            disabled={saving}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => startEditing(staffMember.id)}
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {activeStaff.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Tiada staf dijumpai
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div className="card-header">
                        <div className="card-title">Nota</div>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                        <li><strong>Tahunan</strong> - Cuti tahunan standard</li>
                        <li><strong>Sakit</strong> - Cuti sakit (MC)</li>
                        <li><strong>Kecemasan</strong> - Cuti kecemasan</li>
                        <li><strong>Ganti</strong> - Cuti ganti untuk kerja lebih masa (OT)</li>
                        <li><strong>Bersalin</strong> - Maternity leave (perempuan)</li>
                        <li><strong>Paternity</strong> - Paternity leave (lelaki)</li>
                        <li><strong>Compassionate</strong> - Cuti compassionate (kematian, dll)</li>
                    </ul>
                </div>
            </div>
        </MainLayout>
    );
}
