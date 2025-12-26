'use client';

import { useState, useEffect } from 'react';
import { ShiftDefinition, StaffShift } from '@/lib/types';
import {
    fetchShiftDefinitions,
    insertShiftDefinition,
    updateShiftDefinition,
    deleteShiftDefinition,
    fetchSystemSettings,
    updateSystemSetting,
} from '@/lib/supabase/operations';
import { useToast } from '@/lib/contexts/ToastContext';
import Modal from '@/components/Modal';
import { getDayNameMalay } from '@/lib/timezone-utils';
import { Clock, Plus, Edit2, Trash2, Settings2, Save, AlertTriangle } from 'lucide-react';

interface AttendanceSetting {
    key: string;
    value: string;
    label: string;
    description: string;
}

export default function ShiftSettings() {
    const { showToast } = useToast();
    const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
    const [settings, setSettings] = useState<AttendanceSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [shiftForm, setShiftForm] = useState({
        name: '',
        nameMalay: '',
        code: '',
        startTime: '08:00',
        endTime: '14:00',
        color: '#3b82f6',
    });

    // Settings descriptions
    const settingsConfig: Record<string, { label: string; description: string }> = {
        late_threshold_minutes: { label: 'Grace Period (minit)', description: 'Minit selepas shift mula dikira lewat' },
        early_clock_in_limit_minutes: { label: 'Had Clock In Awal (minit)', description: 'Berapa minit awal staff boleh clock in' },
        overtime_threshold_minutes: { label: 'OT Threshold (minit)', description: 'Minit selepas shift tamat untuk dikira OT' },
        max_late_per_month: { label: 'Max Lewat/Bulan', description: 'Bilangan max lewat sebulan sebelum eskalasi' },
    };

    // Load shifts and settings
    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [shiftData, settingsData] = await Promise.all([
                fetchShiftDefinitions(),
                fetchSystemSettings('attendance'),
            ]);
            setShifts(shiftData);

            // Map settings with labels
            const mappedSettings = settingsData
                .filter((s: any) => settingsConfig[s.key])
                .map((s: any) => ({
                    key: s.key,
                    value: s.value,
                    label: settingsConfig[s.key]?.label || s.key,
                    description: settingsConfig[s.key]?.description || '',
                }));
            setSettings(mappedSettings);
        } catch (error) {
            console.error('Error loading shift settings:', error);
            showToast('Gagal memuatkan tetapan shift', 'error');
        } finally {
            setLoading(false);
        }
    }

    function openAddModal() {
        setEditingShift(null);
        setShiftForm({
            name: '',
            nameMalay: '',
            code: '',
            startTime: '08:00',
            endTime: '14:00',
            color: '#3b82f6',
        });
        setShowModal(true);
    }

    function openEditModal(shift: ShiftDefinition) {
        setEditingShift(shift);
        setShiftForm({
            name: shift.name,
            nameMalay: shift.nameMalay,
            code: shift.code,
            startTime: shift.startTime,
            endTime: shift.endTime,
            color: shift.color,
        });
        setShowModal(true);
    }

    async function handleSaveShift() {
        if (!shiftForm.name || !shiftForm.code || !shiftForm.startTime || !shiftForm.endTime) {
            showToast('Sila isi semua medan', 'error');
            return;
        }

        setSaving(true);
        try {
            if (editingShift) {
                await updateShiftDefinition(editingShift.id, {
                    name: shiftForm.name,
                    nameMalay: shiftForm.nameMalay || shiftForm.name,
                    startTime: shiftForm.startTime,
                    endTime: shiftForm.endTime,
                    color: shiftForm.color,
                });
                showToast('Shift dikemaskini!', 'success');
            } else {
                await insertShiftDefinition({
                    name: shiftForm.name,
                    nameMalay: shiftForm.nameMalay || shiftForm.name,
                    code: shiftForm.code.toUpperCase(),
                    startTime: shiftForm.startTime,
                    endTime: shiftForm.endTime,
                    color: shiftForm.color,
                    isActive: true,
                    sortOrder: shifts.length + 1,
                });
                showToast('Shift baru ditambah!', 'success');
            }
            setShowModal(false);
            loadData();
        } catch (error: any) {
            console.error('Error saving shift:', error);
            showToast(error.message || 'Gagal menyimpan shift', 'error');
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteShift(shift: ShiftDefinition) {
        if (!confirm(`Padam shift "${shift.name}"?`)) return;

        try {
            await deleteShiftDefinition(shift.id);
            showToast('Shift dipadam', 'success');
            loadData();
        } catch (error: any) {
            showToast(error.message || 'Gagal memadam shift', 'error');
        }
    }

    async function handleSettingChange(key: string, value: string) {
        try {
            await updateSystemSetting(key, value);
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
            showToast('Tetapan dikemaskini', 'success');
        } catch (error) {
            console.error('Error updating setting:', error);
            showToast('Gagal mengemaskini tetapan', 'error');
        }
    }

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="loading-spinner" />
                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Loading...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Shift Definitions Section */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={20} />
                            Definisi Shift
                        </div>
                        <div className="card-subtitle">Tetapkan masa mula dan tamat untuk setiap shift</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                        <Plus size={16} />
                        Tambah Shift
                    </button>
                </div>

                {shifts.length === 0 ? (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        background: 'var(--gray-50)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <AlertTriangle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                        <p>Tiada shift ditetapkan. Tambah shift pertama anda.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {shifts.map((shift) => (
                            <div
                                key={shift.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: 'var(--gray-50)',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: `4px solid ${shift.color}`,
                                }}
                            >
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: shift.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    {shift.code.slice(0, 2)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{shift.name}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {shift.nameMalay} • {shift.startTime} - {shift.endTime}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => openEditModal(shift)}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDeleteShift(shift)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Attendance Settings Section */}
            <div className="card">
                <div className="card-header">
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings2 size={20} />
                        Tetapan Kehadiran
                    </div>
                    <div className="card-subtitle">Konfigurasi grace period, had OT, dan lain-lain</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {settings.map((setting) => (
                        <div key={setting.key} className="form-group">
                            <label className="form-label">{setting.label}</label>
                            <input
                                type="number"
                                className="form-input"
                                value={setting.value}
                                onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                                min={0}
                                max={999}
                            />
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                {setting.description}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add/Edit Shift Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingShift ? 'Edit Shift' : 'Tambah Shift Baru'}
                maxWidth="450px"
            >
                <div className="form-group">
                    <label className="form-label">Nama Shift (English)</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Morning"
                        value={shiftForm.name}
                        onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Nama Shift (Malay)</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Pagi"
                        value={shiftForm.nameMalay}
                        onChange={(e) => setShiftForm({ ...shiftForm, nameMalay: e.target.value })}
                    />
                </div>

                {!editingShift && (
                    <div className="form-group">
                        <label className="form-label">Code</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="MORNING"
                            value={shiftForm.code}
                            onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value.toUpperCase() })}
                            maxLength={10}
                        />
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Masa Mula</label>
                        <input
                            type="time"
                            className="form-input"
                            value={shiftForm.startTime}
                            onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Masa Tamat</label>
                        <input
                            type="time"
                            className="form-input"
                            value={shiftForm.endTime}
                            onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Warna</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="color"
                            value={shiftForm.color}
                            onChange={(e) => setShiftForm({ ...shiftForm, color: e.target.value })}
                            style={{ width: '50px', height: '40px', cursor: 'pointer', border: 'none' }}
                        />
                        <input
                            type="text"
                            className="form-input"
                            value={shiftForm.color}
                            onChange={(e) => setShiftForm({ ...shiftForm, color: e.target.value })}
                            style={{ flex: 1 }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                        Batal
                    </button>
                    <button className="btn btn-primary" onClick={handleSaveShift} disabled={saving}>
                        <Save size={16} />
                        {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
