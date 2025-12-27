'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getTodayAttendance, clockIn, clockOut, type AttendanceRecord } from '@/lib/supabase/attendance-sync';
import VerificationWizard from '@/components/VerificationWizard';
import { CheckCircle, Clock, MapPin, Loader2 } from 'lucide-react';

export default function AttendancePage() {
    const router = useRouter();
    const { currentStaff, isStaffLoggedIn } = useAuth();

    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardMode, setWizardMode] = useState<'IN' | 'OUT'>('IN');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (!isStaffLoggedIn || !currentStaff) {
            router.push('/login');
            return;
        }
        loadTodayAttendance();
    }, [isStaffLoggedIn, currentStaff, router]);

    const loadTodayAttendance = async () => {
        if (!currentStaff) return;
        setIsLoading(true);
        try {
            const result = await getTodayAttendance(currentStaff.id);
            if (result.success && result.data) {
                setTodayAttendance(result.data);
            } else {
                setTodayAttendance(null);
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClockInClick = () => {
        setWizardMode('IN');
        setIsWizardOpen(true);
    };

    const handleClockOutClick = () => {
        setWizardMode('OUT');
        setIsWizardOpen(true);
    };

    const handleVerificationSuccess = async (photoBlob: Blob, location: { lat: number; lng: number }) => {
        if (!currentStaff) return;

        try {
            let result;
            const file = new File([photoBlob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });

            if (wizardMode === 'IN') {
                result = await clockIn({
                    staff_id: currentStaff.id,
                    latitude: location.lat,
                    longitude: location.lng,
                    selfie_file: file
                });
            } else {
                if (!todayAttendance) {
                    throw new Error('Tiada rekod kehadiran untuk clock out.');
                }
                result = await clockOut({
                    attendance_id: todayAttendance.id,
                    staff_id: currentStaff.id,
                    latitude: location.lat,
                    longitude: location.lng,
                    selfie_file: file
                });
            }

            if (result.success) {
                setMessage({ type: 'success', text: `Berjaya ${wizardMode === 'IN' ? 'Clock In' : 'Clock Out'}!` });
                await loadTodayAttendance();
            } else {
                const errorMsg = result.error || 'Ralat berlaku.';
                setMessage({ type: 'error', text: errorMsg });
                throw new Error(errorMsg);
            }
        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: err.message || 'Ralat tidak dijangka.' });
            throw err;
        } finally {
            setTimeout(() => setMessage(null), 5000);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    const isClockedIn = todayAttendance && !todayAttendance.clock_out;
    const isCompleted = todayAttendance && todayAttendance.clock_out;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex flex-col items-center">
            <div className="max-w-md w-full space-y-8 mt-10">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kehadiran</h1>
                    <p className="text-gray-500 mt-2">
                        {new Date().toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {/* Status Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Status Hari Ini</h2>

                    {todayAttendance ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Clock size={20} className="text-green-500" />
                                    <span className="text-sm font-medium">Masuk</span>
                                </div>
                                <span className="font-bold font-mono">
                                    {new Date(todayAttendance.clock_in).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {todayAttendance.clock_out && (
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Clock size={20} className="text-red-500" />
                                        <span className="text-sm font-medium">Keluar</span>
                                    </div>
                                    <span className="font-bold font-mono">
                                        {new Date(todayAttendance.clock_out).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-gray-500 justify-center mt-2">
                                <MapPin size={14} />
                                <span>{(todayAttendance as any).location?.name || 'Lokasi Disahkan'}</span>
                                {todayAttendance.location_verified && <CheckCircle size={14} className="text-green-500" />}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500">
                            Belum ada rekod kehadiran hari ini.
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4">
                    {!todayAttendance && (
                        <button
                            onClick={handleClockInClick}
                            className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all transform hover:scale-[1.02]"
                        >
                            Clock In
                        </button>
                    )}

                    {isClockedIn && (
                        <button
                            onClick={handleClockOutClick}
                            className="w-full py-4 rounded-xl bg-white border-2 border-red-500 text-red-500 font-bold text-lg hover:bg-red-50 transition-all"
                        >
                            Clock Out
                        </button>
                    )}

                    {isCompleted && (
                        <div className="text-center p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
                            <span className="font-bold">Shift Selesai!</span> Terima kasih atas kerja keras anda.
                        </div>
                    )}
                </div>

                {/* Message Toast */}
                {message && (
                    <div className={`p-4 rounded-xl text-center font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} animate-fade-in`}>
                        {message.text}
                    </div>
                )}

            </div>

            {/* Wizard Modal */}
            <VerificationWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={handleVerificationSuccess}
                staffName={currentStaff?.name || 'Staff'}
            />
        </div>
    );
}
