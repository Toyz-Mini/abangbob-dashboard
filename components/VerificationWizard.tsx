'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Camera, CheckCircle, AlertTriangle, X, RefreshCw, ScanFace } from 'lucide-react';
import PremiumButton from './PremiumButton';

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

    const webcamRef = useRef<Webcam>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep('location');
            setLocation(null);
            setCapturedImage(null);
            setError('');
            setLocationError('');
            // Auto-start location check
            startLocationCheck();
        }
    }, [isOpen]);

    const startLocationCheck = () => {
        if (!navigator.geolocation) {
            setLocationError('Browser tidak menyokong geolokasi.');
            return;
        }

        setLocationError('');

        // Simulate radar "scanning" delay for effect
        setTimeout(() => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    // Auto-advance to camera after brief success visual
                    setTimeout(() => setStep('camera'), 1500);
                },
                (err) => {
                    console.error(err);
                    setLocationError('Gagal mendapatkan lokasi. Sila benarkan akses lokasi.');
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }, 2000);
    };

    const capturePhoto = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);
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
            console.error(err);
            setError(err.message || 'Gagal mengesahkan kehadiran.');
            setStep('camera'); // Go back to camera on failure?? or stay in verifying? 
            // Actually better to go back to camera so they can retry submission or retake if image was bad
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
                                    {!location && !locationError && (
                                        <>
                                            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                                            <div className="absolute inset-[-10px] rounded-full border border-primary/10 animate-ping delay-75" />
                                        </>
                                    )}

                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${location ? 'bg-green-100 text-green-600 scale-110' :
                                            locationError ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary'
                                        }`}>
                                        {location ? <CheckCircle size={40} className="animate-scale-in" /> :
                                            locationError ? <AlertTriangle size={40} /> : <MapPin size={40} className="animate-bounce" />}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {location ? 'Lokasi Disahkan!' : locationError ? 'Masalah Lokasi' : 'Mengesan Lokasi...'}
                                    </h3>
                                    <p className="text-sm text-gray-500 max-w-[250px] mx-auto">
                                        {location ? 'Hebat! Lokasi kedai ditemui.' :
                                            locationError ? locationError : 'Sila pastikan anda berada di premis kedai.'}
                                    </p>
                                </div>

                                {locationError && (
                                    <PremiumButton onClick={startLocationCheck} variant="outline" size="sm">
                                        Cuba Lagi
                                    </PremiumButton>
                                )}
                            </div>
                        )}

                        {/* STEP 2: CAMERA CAPTURE */}
                        {step === 'camera' && (
                            <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
                                <div className="text-center mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">Verifikasi Wajah</h3>
                                    <p className="text-xs text-gray-500">Ambil selfie untuk pengesahan</p>
                                </div>

                                <div className="relative w-full aspect-[3/4] max-h-[350px] bg-black rounded-2xl overflow-hidden shadow-inner border border-gray-200">
                                    {capturedImage ? (
                                        <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Webcam
                                                audio={false}
                                                ref={webcamRef}
                                                screenshotFormat="image/jpeg"
                                                videoConstraints={{ facingMode: "user" }}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Face Scanning Overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-[70%] h-[50%] border-2 border-dashed border-white/50 rounded-full opacity-60" />
                                                <ScanFace className="absolute w-12 h-12 text-white/40 animate-pulse" />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {error && <p className="text-xs text-red-500">{error}</p>}

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
                                            {capturedImage && <img src={capturedImage} className="w-full h-full object-cover opacity-50" />}
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
