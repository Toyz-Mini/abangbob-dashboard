'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    Calendar,
    Plus,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Settings,
    Gift,
    Clock,
    DollarSign,
    RefreshCw,
    Check,
    X,
    AlertTriangle,
    Users,
    FileText
} from 'lucide-react';
import {
    PublicHoliday,
    HolidayPolicy,
    HolidayWorkLog,
    ReplacementLeave,
    HolidayCompensationType
} from '@/lib/types';
import {
    fetchPublicHolidays,
    insertPublicHoliday,
    updatePublicHoliday,
    deletePublicHoliday,
    fetchHolidayPolicies,
    insertHolidayPolicy,
    updateHolidayPolicy,
    deleteHolidayPolicy,
    fetchHolidayWorkLogs,
    insertHolidayWorkLog,
    updateHolidayWorkLog,
    fetchReplacementLeaves,
    insertReplacementLeave,
    updateReplacementLeave
} from '@/lib/supabase/operations';
import { usePublicHolidaysRealtime, useHolidayPoliciesRealtime } from '@/lib/supabase/realtime-hooks';

type ModalType = 'addHoliday' | 'editHoliday' | 'editPolicy' | 'viewWorkLogs' | null;

const COMPENSATION_OPTIONS: { value: HolidayCompensationType; label: string; description: string; icon: any }[] = [
    { value: 'none', label: 'Tutup', description: 'Outlet tutup, semua cuti', icon: X },
    { value: 'double_pay', label: 'Double Pay', description: 'Staff kerja dapat 2x gaji', icon: DollarSign },
    { value: 'replacement_leave', label: 'Replacement Leave', description: 'Staff kerja dapat cuti ganti', icon: RefreshCw },
    { value: 'staff_choice', label: 'Staff Pilih', description: 'Staff boleh pilih sendiri', icon: Users },
];

const MONTHS = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

export default function PublicHolidaysPage() {
    // State
    const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
    const [policies, setPolicies] = useState<HolidayPolicy[]>([]);
    const [workLogs, setWorkLogs] = useState<HolidayWorkLog[]>([]);
    const [replacementLeaves, setReplacementLeaves] = useState<ReplacementLeave[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [modalType, setModalType] = useState<ModalType>(null);
    const [selectedHoliday, setSelectedHoliday] = useState<PublicHoliday | null>(null);
    const [selectedPolicy, setSelectedPolicy] = useState<HolidayPolicy | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        isRecurring: false,
        isNational: true,
        notes: '',
    });

    const [policyData, setPolicyData] = useState({
        isOperating: false,
        compensationType: 'none' as HolidayCompensationType,
        payMultiplier: 2.0,
        allowStaffChoice: true,
        notes: '',
    });

    // Load data
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [holidaysData, policiesData, workLogsData, replacementData] = await Promise.all([
                fetchPublicHolidays(selectedYear),
                fetchHolidayPolicies(selectedYear),
                fetchHolidayWorkLogs({ processed: false }),
                fetchReplacementLeaves({ status: 'available' }),
            ]);
            setHolidays(holidaysData);
            setPolicies(policiesData);
            setWorkLogs(workLogsData);
            setReplacementLeaves(replacementData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Realtime subscriptions
    usePublicHolidaysRealtime(useCallback(() => {
        loadData();
    }, [loadData]));

    useHolidayPoliciesRealtime(useCallback(() => {
        loadData();
    }, [loadData]));

    // Helpers
    const getHolidayPolicy = (holidayId: string): HolidayPolicy | undefined => {
        return policies.find(p => p.holidayId === holidayId);
    };

    const getCompensationLabel = (type: HolidayCompensationType) => {
        return COMPENSATION_OPTIONS.find(o => o.value === type)?.label || type;
    };

    const getCompensationColor = (type: HolidayCompensationType) => {
        switch (type) {
            case 'none': return 'bg-gray-100 text-gray-700';
            case 'double_pay': return 'bg-green-100 text-green-700';
            case 'replacement_leave': return 'bg-blue-100 text-blue-700';
            case 'staff_choice': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Modal handlers
    const openAddHoliday = () => {
        setFormData({
            name: '',
            date: '',
            isRecurring: false,
            isNational: true,
            notes: '',
        });
        setModalType('addHoliday');
    };

    const openEditHoliday = (holiday: PublicHoliday) => {
        setSelectedHoliday(holiday);
        setFormData({
            name: holiday.name,
            date: holiday.date,
            isRecurring: holiday.isRecurring,
            isNational: holiday.isNational,
            notes: holiday.notes || '',
        });
        setModalType('editHoliday');
    };

    const openEditPolicy = (holiday: PublicHoliday) => {
        const policy = getHolidayPolicy(holiday.id);
        setSelectedHoliday(holiday);
        setSelectedPolicy(policy || null);
        setPolicyData({
            isOperating: policy?.isOperating ?? false,
            compensationType: policy?.compensationType ?? 'none',
            payMultiplier: policy?.payMultiplier ?? 2.0,
            allowStaffChoice: policy?.allowStaffChoice ?? true,
            notes: policy?.notes || '',
        });
        setModalType('editPolicy');
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedHoliday(null);
        setSelectedPolicy(null);
    };

    // CRUD handlers
    const handleAddHoliday = async () => {
        try {
            const id = `ph_${Date.now()}`;
            const dateObj = new Date(formData.date);

            await insertPublicHoliday({
                id,
                name: formData.name,
                date: formData.date,
                isRecurring: formData.isRecurring,
                recurringMonth: formData.isRecurring ? dateObj.getMonth() + 1 : undefined,
                recurringDay: formData.isRecurring ? dateObj.getDate() : undefined,
                country: 'BN',
                isNational: formData.isNational,
                notes: formData.notes || undefined,
            });

            // Auto-create policy for current year
            await insertHolidayPolicy({
                id: `hp_${Date.now()}`,
                holidayId: id,
                year: selectedYear,
                isOperating: false,
                compensationType: 'none',
                payMultiplier: 2.0,
                allowStaffChoice: true,
            });

            await loadData();
            closeModal();
        } catch (error) {
            console.error('Error adding holiday:', error);
            alert('Gagal menambah cuti. Sila cuba lagi.');
        }
    };

    const handleUpdateHoliday = async () => {
        if (!selectedHoliday) return;

        try {
            const dateObj = new Date(formData.date);

            await updatePublicHoliday(selectedHoliday.id, {
                name: formData.name,
                date: formData.date,
                isRecurring: formData.isRecurring,
                recurringMonth: formData.isRecurring ? dateObj.getMonth() + 1 : null,
                recurringDay: formData.isRecurring ? dateObj.getDate() : null,
                isNational: formData.isNational,
                notes: formData.notes || null,
            });

            await loadData();
            closeModal();
        } catch (error) {
            console.error('Error updating holiday:', error);
            alert('Gagal mengemaskini cuti. Sila cuba lagi.');
        }
    };

    const handleDeleteHoliday = async (id: string) => {
        if (!confirm('Adakah anda pasti mahu memadam cuti ini?')) return;

        try {
            await deletePublicHoliday(id);
            await loadData();
        } catch (error) {
            console.error('Error deleting holiday:', error);
            alert('Gagal memadam cuti. Sila cuba lagi.');
        }
    };

    const handleSavePolicy = async () => {
        if (!selectedHoliday) return;

        try {
            if (selectedPolicy) {
                await updateHolidayPolicy(selectedPolicy.id, policyData);
            } else {
                await insertHolidayPolicy({
                    id: `hp_${Date.now()}`,
                    holidayId: selectedHoliday.id,
                    year: selectedYear,
                    ...policyData,
                });
            }

            await loadData();
            closeModal();
        } catch (error) {
            console.error('Error saving policy:', error);
            alert('Gagal menyimpan policy. Sila cuba lagi.');
        }
    };

    // Stats
    const stats = useMemo(() => {
        const totalHolidays = holidays.length;
        const operatingDays = policies.filter(p => p.isOperating).length;
        const closedDays = policies.filter(p => !p.isOperating).length;
        const pendingCompensations = workLogs.filter(w => !w.compensationProcessed).length;

        return { totalHolidays, operatingDays, closedDays, pendingCompensations };
    }, [holidays, policies, workLogs]);

    // Group holidays by month
    const holidaysByMonth = useMemo(() => {
        const grouped: Record<number, PublicHoliday[]> = {};
        holidays.forEach(holiday => {
            const month = new Date(holiday.date).getMonth();
            if (!grouped[month]) grouped[month] = [];
            grouped[month].push(holiday);
        });
        return grouped;
    }, [holidays]);

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">Cuti Umum</h1>
                    <p className="text-gray-500">Public Holidays</p>
                </div>

                {/* Year Navigation and Add Button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedYear(y => y - 1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-bold">{selectedYear}</h2>
                        <button
                            onClick={() => setSelectedYear(y => y + 1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={openAddHoliday}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Cuti
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Jumlah Cuti</p>
                                <p className="text-xl font-bold">{stats.totalHolidays}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Check className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Hari Operasi</p>
                                <p className="text-xl font-bold">{stats.operatingDays}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Hari Tutup</p>
                                <p className="text-xl font-bold">{stats.closedDays}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-xl font-bold">{stats.pendingCompensations}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Holiday List by Month */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Gift className="w-5 h-5 text-red-600" />
                            Senarai Cuti Umum {selectedYear}
                        </h3>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {holidays.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Tiada cuti umum untuk tahun {selectedYear}</p>
                                <button
                                    onClick={openAddHoliday}
                                    className="mt-3 text-red-600 hover:underline"
                                >
                                    Tambah cuti pertama
                                </button>
                            </div>
                        ) : (
                            holidays.map(holiday => {
                                const policy = getHolidayPolicy(holiday.id);
                                const dateObj = new Date(holiday.date);
                                const dayName = dateObj.toLocaleDateString('ms-MY', { weekday: 'long' });

                                return (
                                    <div key={holiday.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-start gap-4">
                                                <div className="text-center min-w-[60px]">
                                                    <div className="text-2xl font-bold text-red-600">
                                                        {dateObj.getDate()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {MONTHS[dateObj.getMonth()]}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-medium">{holiday.name}</h4>
                                                    <p className="text-sm text-gray-500">{dayName}</p>
                                                    {holiday.isRecurring && (
                                                        <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600">
                                                            <RefreshCw className="w-3 h-3" />
                                                            Berulang setiap tahun
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 sm:gap-3">
                                                {policy && (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCompensationColor(policy.compensationType)}`}>
                                                        {policy.isOperating ? 'Buka' : 'Tutup'} • {getCompensationLabel(policy.compensationType)}
                                                    </span>
                                                )}

                                                <button
                                                    onClick={() => openEditPolicy(holiday)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Tetapkan Policy"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => openEditHoliday(holiday)}
                                                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteHoliday(holiday.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Padam"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Replacement Leaves Summary */}
                {replacementLeaves.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-blue-50">
                            <h3 className="font-semibold flex items-center gap-2 text-blue-800">
                                <RefreshCw className="w-5 h-5" />
                                Replacement Leave Tersedia
                            </h3>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {replacementLeaves.slice(0, 6).map(rl => (
                                    <div key={rl.id} className="p-3 bg-gray-50 rounded-lg">
                                        <p className="font-medium">{rl.staffName}</p>
                                        <p className="text-sm text-gray-600">
                                            {rl.days} hari • dari {rl.holidayName || 'Holiday Work'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Expired: {new Date(rl.expiresAt).toLocaleDateString('ms-MY')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Holiday Modal */}
            <Modal
                isOpen={modalType === 'addHoliday' || modalType === 'editHoliday'}
                onClose={closeModal}
                title={modalType === 'addHoliday' ? 'Tambah Cuti Umum' : 'Edit Cuti Umum'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Cuti
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="cth: Hari Raya Aidilfitri"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tarikh
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isRecurring}
                                onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                                className="w-4 h-4 text-red-600 rounded"
                            />
                            <span className="text-sm">Berulang setiap tahun</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isNational}
                                onChange={e => setFormData({ ...formData, isNational: e.target.checked })}
                                className="w-4 h-4 text-red-600 rounded"
                            />
                            <span className="text-sm">Cuti Kebangsaan</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nota (optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Nota tambahan..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={closeModal}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={modalType === 'addHoliday' ? handleAddHoliday : handleUpdateHoliday}
                            disabled={!formData.name || !formData.date}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {modalType === 'addHoliday' ? 'Tambah' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Policy Modal */}
            <Modal
                isOpen={modalType === 'editPolicy'}
                onClose={closeModal}
                title={`Policy: ${selectedHoliday?.name || ''}`}
            >
                <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                            Tetapkan bagaimana mengendalikan cuti ini untuk tahun {selectedYear}
                        </p>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={policyData.isOperating}
                                onChange={e => setPolicyData({ ...policyData, isOperating: e.target.checked })}
                                className="w-4 h-4 text-red-600 rounded"
                            />
                            <span className="font-medium">Outlet Beroperasi</span>
                        </label>
                        <p className="text-sm text-gray-500 ml-6">
                            Jika tidak, outlet tutup dan semua staff cuti
                        </p>
                    </div>

                    {policyData.isOperating && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Jenis Compensation
                                </label>
                                <div className="space-y-2">
                                    {COMPENSATION_OPTIONS.filter(o => o.value !== 'none').map(option => {
                                        const Icon = option.icon;
                                        return (
                                            <label
                                                key={option.value}
                                                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${policyData.compensationType === option.value
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="compensation"
                                                    value={option.value}
                                                    checked={policyData.compensationType === option.value}
                                                    onChange={e => setPolicyData({ ...policyData, compensationType: e.target.value as HolidayCompensationType })}
                                                    className="w-4 h-4 text-red-600"
                                                />
                                                <Icon className="w-5 h-5 text-gray-600" />
                                                <div>
                                                    <p className="font-medium">{option.label}</p>
                                                    <p className="text-sm text-gray-500">{option.description}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {policyData.compensationType === 'double_pay' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pay Multiplier
                                    </label>
                                    <select
                                        value={policyData.payMultiplier}
                                        onChange={e => setPolicyData({ ...policyData, payMultiplier: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    >
                                        <option value={1.5}>1.5x (Satu setengah ganda)</option>
                                        <option value={2}>2x (Double)</option>
                                        <option value={2.5}>2.5x</option>
                                        <option value={3}>3x (Triple)</option>
                                    </select>
                                </div>
                            )}
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nota (optional)
                        </label>
                        <textarea
                            value={policyData.notes}
                            onChange={e => setPolicyData({ ...policyData, notes: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Nota khas untuk cuti ini..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={closeModal}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSavePolicy}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Simpan Policy
                        </button>
                    </div>
                </div>
            </Modal>
        </MainLayout>
    );
}
