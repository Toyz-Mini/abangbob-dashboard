'use client';

import { useState, useEffect } from 'react';
import { Plus, MapPin, Edit2, Trash2, Save, X } from 'lucide-react';
import {
    getAllowedLocations,
    addAllowedLocation,
    updateAllowedLocation,
    deleteAllowedLocation,
    type AllowedLocation,
} from '@/lib/supabase/attendance-sync';

interface LocationFormData {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
}

export default function LocationSettings() {
    const [locations, setLocations] = useState<AllowedLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<LocationFormData>({
        name: '',
        address: '',
        latitude: 0,
        longitude: 0,
        radius_meters: 100,
    });
    const [gettingLocation, setGettingLocation] = useState(false);

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        setLoading(true);
        const result = await getAllowedLocations();
        if (result.success && result.data) {
            setLocations(result.data);
        }
        setLoading(false);
    };

    const handleGetCurrentLocation = () => {
        setGettingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData((prev) => ({
                        ...prev,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    }));
                    setGettingLocation(false);
                },
                (error) => {
                    alert('Gagal mendapatkan lokasi: ' + error.message);
                    setGettingLocation(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        } else {
            alert('Geolocation tidak disokong oleh pelayar anda');
            setGettingLocation(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            // Update existing location
            const result = await updateAllowedLocation(editingId, formData);
            if (result.success) {
                await loadLocations();
                resetForm();
            } else {
                alert('Gagal update lokasi: ' + result.error);
            }
        } else {
            // Add new location
            const result = await addAllowedLocation({
                ...formData,
                is_active: true,
            });
            if (result.success) {
                await loadLocations();
                resetForm();
            } else {
                alert('Gagal tambah lokasi: ' + result.error);
            }
        }
    };

    const handleEdit = (location: AllowedLocation) => {
        setEditingId(location.id);
        setFormData({
            name: location.name,
            address: location.address || '',
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            radius_meters: location.radius_meters,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Adakah anda pasti untuk memadam lokasi ini?')) {
            const result = await deleteAllowedLocation(id);
            if (result.success) {
                await loadLocations();
            } else {
                alert('Gagal padam lokasi: ' + result.error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            latitude: 0,
            longitude: 0,
            radius_meters: 100,
        });
        setEditingId(null);
        setShowModal(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Lokasi Kehadiran</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Urus lokasi yang dibenarkan untuk clock-in
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                    <Plus size={20} />
                    Tambah Lokasi
                </button>
            </div>

            {/* Locations Table */}
            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : locations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <MapPin size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">Tiada lokasi ditambah lagi</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800">
                                <th className="px-4 py-3 text-left text-sm font-semibold">Nama</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Alamat</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Koordinat</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Radius</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locations.map((location) => (
                                <tr key={location.id} className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-primary" />
                                            {location.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                        {location.address || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                            {location.radius_meters}m
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(location)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(location.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">
                                    {editingId ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}
                                </h3>
                                <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nama Lokasi</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                        placeholder="Contoh: Outlet Gadong"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Alamat (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                        placeholder="Contoh: Jalan Gadong, Brunei-Muara"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Latitude</label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            value={formData.latitude}
                                            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Longitude</label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGetCurrentLocation}
                                    disabled={gettingLocation}
                                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                                >
                                    {gettingLocation ? 'Mendapatkan lokasi...' : '📍 Guna Lokasi Semasa'}
                                </button>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Radius (meter)</label>
                                    <select
                                        value={formData.radius_meters}
                                        onChange={(e) => setFormData({ ...formData, radius_meters: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                    >
                                        <option value={50}>50 meter</option>
                                        <option value={100}>100 meter</option>
                                        <option value={200}>200 meter</option>
                                        <option value={500}>500 meter</option>
                                        <option value={1000}>1 kilometer</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center justify-center gap-2"
                                    >
                                        <Save size={16} />
                                        {editingId ? 'Simpan' : 'Tambah'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
