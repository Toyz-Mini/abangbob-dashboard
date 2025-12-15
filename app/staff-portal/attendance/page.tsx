'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, CheckCircle, XCircle, Loader2, RotateCcw, Save } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
    clockIn,
    clockOut,
    getTodayAttendance,
    verifyLocation,
    type AttendanceRecord,
} from '@/lib/supabase/attendance-sync';
import { useRouter } from 'next/navigation';

type LocationStatus = 'checking' | 'verified' | 'out-of-range' | 'error';

export default function AttendancePage() {
    const router = useRouter();
    const { currentStaff, isStaffLoggedIn } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [locationStatus, setLocationStatus] = useState<LocationStatus>('checking');
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [nearestLocation, setNearestLocation] = useState<{ name: string; distance: number } | null>(null);
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [photoTaken, setPhotoTaken] = useState(false);
    const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
    const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isStaffLoggedIn || !currentStaff) {
            router.push('/login');
            return;
        }

        loadTodayAttendance();
        checkLocation();
    }, [isStaffLoggedIn, currentStaff, router]);

    const loadTodayAttendance = async () => {
        if (!currentStaff) return;

        const result = await getTodayAttendance(currentStaff.id);
        if (result.success && result.data) {
            setTodayAttendance(result.data);
        }
    };

    const checkLocation = () => {
        setLocationStatus('checking');

        if (!navigator.geolocation) {
            setLocationStatus('error');
            setError('Browser anda tidak menyokong geolocation');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentLocation({ lat: latitude, lng: longitude });

                // Verify against allowed locations
                const result = await verifyLocation(latitude, longitude);

                if (result.verified && result.nearest_location) {
                    setLocationStatus('verified');
                    setNearestLocation({
                        name: result.nearest_location!.name,
                        distance: Math.round(result.distance || 0),
                    });
                } else {
                    setLocationStatus('out-of-range');
                    if (result.nearest_location) {
                        setNearestLocation({
                            name: result.nearest_location!.name,
                            distance: Math.round(result.distance || 0),
                        });
                    }
                }
            },
            (error) => {
                setLocationStatus('error');
                if (error.code === error.PERMISSION_DENIED) {
                    setError('Sila benarkan akses lokasi untuk menggunakan ciri ini');
                } else {
                    setError('Gagal mendapatkan lokasi: ' + error.message);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }, // Front camera for selfie
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
                setError(null);
            }
        } catch (err: any) {
            setError('Gagal mengakses kamera: ' + err.message);
            console.error('Camera error:', err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0);

        // Convert to blob
        canvas.toBlob((blob) => {
            if (blob) {
                setPhotoBlob(blob);
                setPhotoDataUrl(canvas.toDataURL('image/jpeg'));
                setPhotoTaken(true);
                stopCamera();
            }
        }, 'image/jpeg', 0.9);
    };

    const retakePhoto = () => {
        setPhotoTaken(false);
        setPhotoBlob(null);
        setPhotoDataUrl(null);
        startCamera();
    };

    const handleClockIn = async () => {
        if (!currentStaff || !currentLocation || !photoBlob) return;

        setIsSubmitting(true);
        setError(null);

        // Convert blob to File
        const file = new File([photoBlob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });

        const result = await clockIn({
            staff_id: currentStaff.id,
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            selfie_file: file,
        });

        if (result.success) {
            alert(`✅ Clock in berjaya! Selamat bekerja di ${result.location_name}!`);
            await loadTodayAttendance();
            setPhotoTaken(false);
            setPhotoBlob(null);
            setPhotoDataUrl(null);
        } else {
            setError(result.error || 'Gagal clock in');
        }

        setIsSubmitting(false);
    };

    const handleClockOut = async () => {
        if (!todayAttendance || todayAttendance.clock_out) return;

        if (confirm('Adakah anda pasti untuk clock out?')) {
            const result = await clockOut(todayAttendance.id);
            if (result.success) {
                alert('✅ Clock out berjaya! Selamat berehat!');
                await loadTodayAttendance();
            } else {
                alert('Gagal clock out: ' + result.error);
            }
        }
    };

    const canClockIn = locationStatus === 'verified' && !todayAttendance && photoTaken;
    const canTakePhoto = locationStatus === 'verified' && !todayAttendance;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Kehadiran</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {new Date().toLocaleDateString('ms-MY', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                    <p className="text-4xl font-bold text-primary mt-2">
                        {new Date().toLocaleTimeString('ms-MY', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>

                {/* Location Status Card */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Status Lokasi</h3>
                        <button onClick={checkLocation} className="text-primary hover:underline text-sm">
                            Refresh
                        </button>
                    </div>

                    {locationStatus === 'checking' && (
                        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Loader2 className="animate-spin text-blue-600" size={24} />
                            <div>
                                <div className="font-semibold">Memeriksa lokasi...</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Sila tunggu</div>
                            </div>
                        </div>
                    )}

                    {locationStatus === 'verified' && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle className="text-green-600" size={24} />
                            <div>
                                <div className="font-semibold text-green-800 dark:text-green-300">
                                    ✅ Dalam kawasan yang dibenarkan
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {nearestLocation?.name} ({nearestLocation?.distance}m)
                                </div>
                            </div>
                        </div>
                    )}

                    {locationStatus === 'out-of-range' && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <XCircle className="text-red-600" size={24} />
                            <div>
                                <div className="font-semibold text-red-800 dark:text-red-300">
                                    ❌ Di luar kawasan yang diben arkan
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {nearestLocation ? (
                                        <>Anda berada {nearestLocation.distance}m dari {nearestLocation.name}</>
                                    ) : (
                                        'Tiada lokasi terdekat dijumpai'
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {locationStatus === 'error' && (
                        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <XCircle className="text-yellow-600" size={24} />
                            <div>
                                <div className="font-semibold text-yellow-800 dark:text-yellow-300">Ralat Lokasi</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{error}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Today's Attendance Status */}
                {todayAttendance && (
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Rekod Hari Ini</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Clock In:</span>
                                <span className="font-semibold">
                                    {new Date(todayAttendance.clock_in).toLocaleTimeString('ms-MY')}
                                </span>
                            </div>
                            {todayAttendance.clock_out && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Clock Out:</span>
                                    <span className="font-semibold">
                                        {new Date(todayAttendance.clock_out).toLocaleTimeString('ms-MY')}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Lokasi:</span>
                                <span className="font-semibold">{(todayAttendance as any).location?.name || '-'}</span>
                            </div>

                            {todayAttendance && !todayAttendance.clock_out && (
                                <button
                                    onClick={handleClockOut}
                                    className="w-full mt-4 btn btn-outline"
                                >
                                    Clock Out
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Camera / Photo Section */}
                {!todayAttendance && (
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Ambil Foto Selfie</h3>

                        {!cameraActive && !photoTaken && (
                            <button
                                onClick={startCamera}
                                disabled={!canTakePhoto}
                                className="w-full btn btn-primary flex items-center justify-center gap-2"
                            >
                                <Camera size={20} />
                                {locationStatus === 'verified' ? 'Buka Kamera' : 'Sila berada di kawasan yang dibenarkan dahulu'}
                            </button>
                        )}

                        {cameraActive && (
                            <div className="space-y-4">
                                <div className="relative rounded-lg overflow-hidden bg-black">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full"
                                        style={{ transform: 'scaleX(-1)' }} // Mirror for selfie
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={capturePhoto}
                                        className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Camera size={20} />
                                        Ambil Foto
                                    </button>
                                    <button onClick={stopCamera} className="btn btn-outline">
                                        Batal
                                    </button>
                                </div>
                            </div>
                        )}

                        {photoTaken && photoDataUrl && (
                            <div className="space-y-4">
                                <div className="relative rounded-lg overflow-hidden">
                                    <img src={photoDataUrl} alt="Selfie" className="w-full" />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={retakePhoto}
                                        className="flex-1 btn btn-outline flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw size={18} />
                                        Ambil Semula
                                    </button>
                                    <button
                                        onClick={handleClockIn}
                                        disabled={!canClockIn || isSubmitting}
                                        className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Clock In
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-800 dark:text-red-300">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
