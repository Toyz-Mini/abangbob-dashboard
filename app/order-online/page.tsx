'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ChevronRight, ArrowRight, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrderLandingPage() {
    const router = useRouter();
    const [showTimeModal, setShowTimeModal] = useState(false);

    const handleStartClick = () => {
        setShowTimeModal(true);
    };

    const handleSelectTime = (time: string) => {
        // Store mode and time
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('orderMode', 'takeaway');
            sessionStorage.setItem('pickupTime', time);
        }

        // Navigate
        router.push('/order-online/menu');
    };

    // Generate next few hours slots
    const generateTimeSlots = () => {
        const slots = [];
        const now = new Date();
        // Round up to next 30 mins
        let start = new Date(now);
        start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30);
        start.setSeconds(0);
        start.setMilliseconds(0);

        // Add 1 hour buffer if it's too close? No, let's say minimum 30 min from now for scheduled.
        // Actually let's just show next 5 slots.
        for (let i = 1; i <= 6; i++) {
            const slot = new Date(start.getTime() + i * 30 * 60000);
            // Format slots: "2:30 PM"
            const timeString = slot.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            slots.push(timeString);
        }
        return slots;
    };

    const timeSlots = generateTimeSlots();

    return (
        <div className="flex flex-col h-screen relative bg-gradient-to-b from-orange-50 to-white p-6">

            {/* Brand Header */}
            <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-8">
                <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-lg mb-6 animate-bounce-slow">
                    <span className="text-4xl font-bold text-white">AB</span>
                </div>
                <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">AbangBob</h1>
                <p className="text-gray-500 text-center max-w-xs">
                    Nikmati hidangan padu kami. <br /> Order sekarang & pick-up terus!
                </p>
            </div>

            {/* Main Action - Takeaway Only */}
            <div className="mb-12">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartClick}
                    className="w-full relative overflow-hidden bg-orange-600 text-white p-6 rounded-3xl shadow-xl hover:bg-orange-700 transition-all flex items-center justify-between group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                            <ShoppingBag size={24} />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-xl font-bold">Bungkus / Takeaway</span>
                            <span className="text-sm text-orange-100">Tekan untuk mula order</span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-orange-600 transition-all">
                        <ArrowRight size={24} />
                    </div>
                </motion.button>
            </div>

            {/* Footer */}
            <div className="text-center pb-6">
                <p className="text-xs text-gray-300">Powered by AbangBob System</p>
            </div>

            {/* Time Selection Modal */}
            <AnimatePresence>
                {showTimeModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTimeModal(false)}
                            className="fixed inset-0 bg-black z-40"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-10"
                        >
                            {/* Container constraint */}
                            <div className="max-w-md mx-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-800">Bila nak ambil?</h3>
                                    <button onClick={() => setShowTimeModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {/* ASAP Option */}
                                    <button
                                        onClick={() => handleSelectTime('ASAP')}
                                        className="w-full bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center justify-between hover:bg-orange-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-500 text-white rounded-lg">
                                                <Clock size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900">Secepat Mungkin (ASAP)</p>
                                                <p className="text-xs text-gray-500">Siap dalam ~15-20 minit</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-orange-400" />
                                    </button>

                                    <div className="relative my-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-white px-2 text-sm text-gray-400">Atau pilih masa</span>
                                        </div>
                                    </div>

                                    {/* Scheduled Slots */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {timeSlots.map(slot => (
                                            <button
                                                key={slot}
                                                onClick={() => handleSelectTime(slot)}
                                                className="p-3 border border-gray-200 rounded-xl text-center hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 font-medium text-gray-600 transition-all"
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}
