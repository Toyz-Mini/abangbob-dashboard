'use client';

import { useState, useEffect } from 'react';
import { Plus, MapPin, Edit2, Trash2, Save, X, Navigation, Target, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
    getAllowedLocations,
    addAllowedLocation,
    updateAllowedLocation,
    deleteAllowedLocation,
    type AllowedLocation,
} from '@/lib/supabase/attendance-sync';

// Dynamic import to prevent SSR issues with Leaflet (requires window)
const LocationMapPicker = dynamic(() => import('./LocationMapPicker'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-red-500" size={36} />
                <p className="text-gray-400 text-sm">Loading map...</p>
            </div>
        </div>
    ),
});

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
        latitude: 4.9031,
        longitude: 114.9398,
        radius_meters: 100,
    });
    const [gettingLocation, setGettingLocation] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
        setSubmitting(true);

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
        setSubmitting(false);
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
            latitude: 4.9031,
            longitude: 114.9398,
            radius_meters: 100,
        });
        setEditingId(null);
        setShowModal(false);
    };

    const getRadiusColor = (radius: number) => {
        if (radius <= 100) return 'from-green-500 to-emerald-600';
        if (radius <= 300) return 'from-blue-500 to-cyan-600';
        if (radius <= 500) return 'from-yellow-500 to-orange-600';
        return 'from-red-500 to-pink-600';
    };

    return (
        <div className="space-y-6">
            {/* Premium Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-pink-600 rounded-2xl p-8 shadow-2xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

                <div className="relative flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-xl">
                                <MapPin className="text-white" size={28} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Lokasi Kehadiran</h2>
                        </div>
                        <p className="text-red-50 text-lg ml-16">
                            Urus lokasi yang dibenarkan untuk clock-in pekerja
                        </p>
                        <div className="flex items-center gap-4 mt-4 ml-16">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-lg">
                                <Target size={16} className="text-white" />
                                <span className="text-white text-sm font-medium">{locations.length} Lokasi Aktif</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="group relative px-6 py-3 bg-white hover:bg-gray-50 text-red-600 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        Tambah Lokasi
                    </button>
                </div>
            </div>

            {/* Locations Grid - Premium Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-red-500" size={48} />
                        <p className="text-gray-500 dark:text-gray-400">Memuatkan lokasi...</p>
                    </div>
                </div>
            ) : locations.length === 0 ? (
                <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-16 text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1),transparent_50%)]"></div>
                    <div className="relative">
                        <div className="inline-flex p-6 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full mb-6">
                            <MapPin size={64} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Tiada Lokasi Ditambah</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            Mulakan dengan menambah lokasi pertama untuk sistem kehadiran anda
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <Plus size={20} />
                            Tambah Lokasi Pertama
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locations.map((location) => (
                        <div
                            key={location.id}
                            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
                        >
                            {/* Card Header with Gradient */}
                            <div className={`h-2 bg-gradient-to-r ${getRadiusColor(location.radius_meters)}`}></div>

                            <div className="p-6">
                                {/* Location Icon & Name */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`p-3 bg-gradient-to-br ${getRadiusColor(location.radius_meters)} rounded-xl shadow-lg`}>
                                        <MapPin className="text-white" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                            {location.name}
                                        </h3>
                                        {location.address && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                {location.address}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Coordinates */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Navigation size={14} className="text-red-500" />
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            Koordinat
                                        </span>
                                    </div>
                                    <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                    </div>
                                </div>

                                {/* Radius Badge */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Target size={16} className="text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Radius</span>
                                    </div>
                                    <div className={`px-4 py-1.5 bg-gradient-to-r ${getRadiusColor(location.radius_meters)} rounded-full`}>
                                        <span className="text-sm font-bold text-white">{location.radius_meters}m</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(location)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-200"
                                    >
                                        <Edit2 size={16} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(location.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200"
                                    >
                                        <Trash2 size={16} />
                                        Padam
                                    </button>
                                </div>
                            </div>

                            {/* Hover Effect Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-pink-500/0 group-hover:from-red-500/5 group-hover:to-pink-500/5 transition-all duration-300 pointer-events-none"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Premium Modal - Full Screen Split View */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-pink-600 px-8 py-6">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 backdrop-blur-xl rounded-xl">
                                        <MapPin className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">
                                            {editingId ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}
                                        </h2>
                                        <p className="text-red-50 text-sm">
                                            Tetapkan lokasi kehadiran dengan tepat menggunakan map
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={resetForm}
                                    className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-xl transition-all duration-200"
                                >
                                    <X size={24} className="text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content - Split View */}
                        <form onSubmit={handleSubmit} className="flex-1 flex overflow-hidden">
                            {/* Left Side - Map */}
                            <div className="flex-1 bg-gray-900 relative">
                                <LocationMapPicker
                                    latitude={formData.latitude || 4.9031}
                                    longitude={formData.longitude || 114.9398}
                                    radius={formData.radius_meters}
                                    onLocationChange={(lat, lng) => {
                                        setFormData({ ...formData, latitude: lat, longitude: lng });
                                    }}
                                />
                            </div>

                            {/* Right Side - Form */}
                            <div className="w-[450px] bg-white dark:bg-gray-800 overflow-y-auto">
                                <div className="p-8 space-y-6">
                                    {/* Quick Location Button */}
                                    <button
                                        type="button"
                                        onClick={handleGetCurrentLocation}
                                        disabled={gettingLocation}
                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                                    >
                                        {gettingLocation ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Mendapatkan lokasi...
                                            </>
                                        ) : (
                                            <>
                                                <Navigation size={20} />
                                                Guna Lokasi Semasa
                                            </>
                                        )}
                                    </button>

                                    {/* Name Field */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                            Nama Lokasi <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-200 outline-none"
                                            placeholder="Contoh: Outlet Gadong"
                                            required
                                        />
                                    </div>

                                    {/* Address Field */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                            Alamat <span className="text-gray-400 text-xs font-normal">(Pilihan)</span>
                                        </label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-200 outline-none resize-none"
                                            placeholder="Contoh: Jalan Gadong, Brunei-Muara"
                                            rows={3}
                                        />
                                    </div>

                                    {/* Radius Slider */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                                Radius Kehadiran
                                            </label>
                                            <div className={`px-4 py-1.5 bg-gradient-to-r ${getRadiusColor(formData.radius_meters)} rounded-full shadow-lg`}>
                                                <span className="text-sm font-bold text-white">{formData.radius_meters}m</span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="50"
                                            max="1000"
                                            step="50"
                                            value={formData.radius_meters}
                                            onChange={(e) => setFormData({ ...formData, radius_meters: parseInt(e.target.value) })}
                                            className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to right, #ef4444 0%, #ec4899 ${((formData.radius_meters - 50) / 950) * 100}%, rgb(229, 231, 235) ${((formData.radius_meters - 50) / 950) * 100}%, rgb(229, 231, 235) 100%)`
                                            }}
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                                            <span className="font-medium">50m</span>
                                            <span className="font-medium">250m</span>
                                            <span className="font-medium">500m</span>
                                            <span className="font-medium">750m</span>
                                            <span className="font-medium">1km</span>
                                        </div>
                                    </div>

                                    {/* Coordinates Display */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Navigation size={16} className="text-red-500" />
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                Koordinat Terpilih
                                            </span>
                                        </div>
                                        <div className="font-mono text-base font-bold text-gray-900 dark:text-white">
                                            {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={18} />
                                                    Menyimpan...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={18} />
                                                    {editingId ? 'Simpan' : 'Tambah Lokasi'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
