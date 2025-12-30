'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Camera, CheckCircle, AlertTriangle, X, RefreshCw, ScanFace, MapPinOff } from 'lucide-react';
import PremiumButton from './PremiumButton';
import { getAllowedLocations, calculateDistance, type AllowedLocation } from '@/lib/supabase/attendance-sync';

interface VerificationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (photoBlob: Blob, location: { lat: number; lng: number }) => Promise<void>;
    staffName: string;
}

type Step = 'location' | 'camera' | 'verifying' | 'success';

export default function VerificationWizard({ isOpen, onClose, onSuccess, staffName }: VerificationWizardProps) {
    const [step, setStep] = useState<Step>('location');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string>('');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [isFlashing, setIsFlashing] = useState(false);
    const [nearestOutlet, setNearestOutlet] = useState<AllowedLocation | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    const webcamRef = useRef<Webcam>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep('location');
            setLocation(null);
            setCapturedImage(null);
            setError('');
            setLocationError('');
            setNearestOutlet(null);
            // Auto-start location check
            startLocationCheck();
        }
    }, [isOpen]);

    const startLocationCheck = async () => {
        if (!navigator.geolocation) {
            setLocationError('Browser tidak menyokong geolokasi.');
            return;
        }

        setIsLocating(true);
        setLocationError('');
        setNearestOutlet(null);

        try {
            // 1. Fetch allowed locations early
            const { data: locations, success, error: fetchError } = await getAllowedLocations();
            if (!success || !locations) {
                throw new Error(fetchError || 'Gagal memuat naik senarai lokasi outlet.');
            }

            // 2. Get current position
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const currentLat = position.coords.latitude;
                    const currentLng = position.coords.longitude;

                    setLocation({ lat: currentLat, lng: currentLng });

                    // 3. Find nearest outlet and validate distance
                    let nearest: AllowedLocation | null = null;
                    let minDistance = Infinity;

                    for (const loc of locations) {
                        const dist = calculateDistance(currentLat, currentLng, loc.latitude, loc.longitude);
                        if (dist < minDistance) {
                            minDistance = dist;
                            nearest = loc;
                        }
                    }

                    if (nearest && minDistance <= nearest.radius_meters) {
                        setNearestOutlet(nearest);
                        setIsLocating(false);
                        // Auto-advance to camera after brief success visual
                        setTimeout(() => setStep('camera'), 1500);
                    } else {
                        setIsLocating(false);
                        const distText = nearest ? `${Math.round(minDistance)}m dari ${nearest.name}` : 'Tiada outlet berhampiran';
                        setLocationError(`Anda berada di luar radius yang dibenarkan (${distText}).`);
                    }
                },
                (err) => {
                    console.error(err);
                    setIsLocating(false);
                    if (err.code === 1) {
                        setLocationError('Akses lokasi ditolak. Sila benarkan akses lokasi di browser.');
                    } else {
                        setLocationError('Gagal mendapatkan lokasi. Sila pastikan GPS anda aktif.');
                    }
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } catch (err: any) {
            console.error(err);
            setIsLocating(false);
            setLocationError(err.message || 'Ralat teknikal semasa mengesahkan lokasi.');
        }
    };

    const capturePhoto = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setIsFlashing(true);
            setCapturedImage(imageSrc);
            setTimeout(() => setIsFlashing(false), 300);
        }
    }, [webcamRef]);

    const retakePhoto = () => {
        setCapturedImage(null);
    };

    const handleSubmit = async () => {
        if (!location || !capturedImage) return;

        setStep('verifying');

        try {
            // Convert dataURL to Blob
            const res = await fetch(capturedImage);
            const blob = await res.blob();

            await onSuccess(blob, location);
            setStep('success');

            // Auto close after success
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err: any) {
            console.error('Verification error:', err);
            setError(err.message || 'Gagal mengesahkan kehadiran.');
            setStep('camera'); // Go back to camera so they can see the error and retry
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header / Close Button */}
                    <div className="absolute top-4 right-4 z-10">
                        {step !== 'verifying' && step !== 'success' && (
                            <button onClick={onClose} className="p-2 rounded-full bg-black/10 hover:bg-black/20 text-gray-800 transition-colors">
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="p-8 flex flex-col items-center min-h-[400px] justify-center text-center">

                        {/* STEP 1: LOCATION CHECK (Radar) */}
                        {step === 'location' && (
                            <div className="flex flex-col items-center gap-6 animate-fade-in w-full">
                                <div className="relative">
                                    {/* Radar Pulse Rings */}
                                    {isLocating && (
                                        <>
                                            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                                            <div className="absolute inset-[-10px] rounded-full border border-primary/10 animate-ping delay-75" />
                                        </>
                                    )}

                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${nearestOutlet ? 'bg-green-100 text-green-600 scale-110' :
                                        locationError ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary'
                                        }`}>
                                        {nearestOutlet ? <CheckCircle size={40} className="animate-scale-in" /> :
                                            locationError ? <MapPinOff size={40} /> : <MapPin size={40} className={isLocating ? "animate-bounce" : ""} />}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {nearestOutlet ? 'Lokasi Disahkan!' : locationError ? 'Masalah Lokasi' : 'Mengesan Lokasi...'}
                                    </h3>
                                    <p className="text-sm text-gray-500 max-w-[280px] mx-auto">
                                        {nearestOutlet ? (
                                            <>Outlet dikesan: <span className="font-bold text-gray-900">{nearestOutlet.name}</span></>
                                        ) : locationError ? locationError : 'Sila pastikan anda berada di premis kedai.'}
                                    </p>
                                </div>

                                {locationError && (
                                    <PremiumButton onClick={startLocationCheck} variant="outline" size="sm" icon={RefreshCw}>
                                        Cuba Lagi
                                    </PremiumButton>
                                )}
                            </div>
                        )}

                        {/* STEP 2: CAMERA CAPTURE */}
                        {step === 'camera' && (
                            <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
                                <div className="text-center mb-1">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <ScanFace size={18} className="text-primary" />
                                        <h3 className="text-lg font-bold text-gray-900">Verifikasi Wajah</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Selfie di {nearestOutlet?.name}</p>
                                </div>

                                <div className="relative w-full aspect-[3/4] max-h-[350px] bg-black rounded-2xl overflow-hidden shadow-inner border border-gray-200">
                                    {capturedImage ? (
                                        <Image src={capturedImage} alt="Selfie" fill className="w-full h-full object-cover" unoptimized />
                                    ) : (
                                        <>
                                            <Webcam
                                                audio={false}
                                                ref={webcamRef}
                                                screenshotFormat="image/jpeg"
                                                videoConstraints={{ facingMode: "user" }}
                                                className="w-full h-full object-cover"
                                                onUserMediaError={() => setError('Akses kamera ditolak. Sila benarkan akses kamera untuk proceed.')}
                                            />
                                            {/* Face Scanning Overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-[70%] h-[50%] border-2 border-dashed border-white/50 rounded-full opacity-60" />
                                            </div>
                                        </>
                                    )}

                                    {/* Flash Effect */}
                                    <AnimatePresence>
                                        {isFlashing && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 bg-white z-50"
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-100 flex items-center gap-2">
                                        <AlertTriangle size={14} />
                                        {error}
                                    </div>
                                )}

                                <div className="w-full flex gap-3 mt-2">
                                    {!capturedImage ? (
                                        <PremiumButton onClick={capturePhoto} className="w-full shadow-lg" icon={Camera}>
                                            Tangkap Gambar
                                        </PremiumButton>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 w-full">
                                            <PremiumButton onClick={retakePhoto} variant="outline" icon={RefreshCw}>
                                                Semula
                                            </PremiumButton>
                                            <PremiumButton onClick={handleSubmit} icon={CheckCircle}>
                                                Hantar
                                            </PremiumButton>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 3: VERIFYING (Loading) */}
                        {step === 'verifying' && (
                            <div className="flex flex-col items-center gap-6 animate-fade-in">
                                <div className="relative w-24 h-24">
                                    {/* Scanning Ring */}
                                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                    <div className="absolute inset-2 rounded-full border-4 border-dashed border-secondary/30 animate-spin-reverse" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200">
                                            {capturedImage && <Image src={capturedImage} alt="Selfie preview" fill className="w-full h-full object-cover opacity-50" unoptimized />}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-bold text-gray-900 animate-pulse">Menghantar Data...</h3>
                                    <p className="text-sm text-gray-500">Sistem sedang mengesahkan lokasi & kehadiran anda.</p>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: SUCCESS */}
                        {step === 'success' && (
                            <div className="flex flex-col items-center gap-6 animate-scale-in">
                                <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center text-green-500 shadow-xl shadow-green-500/20">
                                    <CheckCircle size={64} strokeWidth={3} className="animate-bounce-subtle" />
                                </div>

                                <div className="text-center space-y-1">
                                    <h3 className="text-2xl font-bold text-gray-900">Berjaya!</h3>
                                    <p className="text-gray-500">Kehadiran anda telah direkodkan.</p>
                                </div>

                                <div className="px-6 py-2 bg-gray-50 rounded-full border border-gray-100">
                                    <p className="text-lg font-mono font-bold text-gray-800">
                                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer Progress Indicators (Optional) */}
                    <div className="h-1.5 w-full bg-gray-100 flex">
                        <div className={`h-full transition-all duration-500 ${step === 'location' ? 'w-1/3 bg-primary' : step === 'camera' ? 'w-2/3 bg-primary' : 'w-full bg-green-500'}`} />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
