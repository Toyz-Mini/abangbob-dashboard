'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, User, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';

export default function OrderAuthPage() {
    const router = useRouter();
    const { customers, addCustomer } = useStore();

    const [step, setStep] = useState<'phone' | 'register'>('phone');
    const [countryCode, setCountryCode] = useState('+673');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Country codes list
    const countryCodes = [
        { code: '+673', country: 'Brunei' },
        { code: '+60', country: 'Malaysia' },
        { code: '+62', country: 'Indonesia' },
        { code: '+65', country: 'Singapore' },
    ];

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phoneNumber.length < 4) {
            setError('Sila masukkan nombor telefon yang sah.');
            return;
        }

        // Combine country code and phone number for storage/lookup
        // Remove leading 0 if present to avoid +6730123...
        const cleanedNumber = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
        const fullPhoneNumber = `${countryCode}${cleanedNumber}`;

        setError('');
        setIsLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Check if customer exists in store
        const existingCustomer = customers.find(c => c.phone === fullPhoneNumber);

        if (existingCustomer) {
            // Login success
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('customer', JSON.stringify(existingCustomer));
            }
            router.push('/order-online');
        } else {
            // New customer -> Register
            setIsLoading(false);
            setStep('register');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) {
            setError('Sila butiran maklumat anda.');
            return;
        }
        setIsLoading(true);

        const cleanedNumber = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
        const fullPhoneNumber = `${countryCode}${cleanedNumber}`;

        // Create new customer
        try {
            const newCustomer = await addCustomer({
                name,
                email,
                phone: fullPhoneNumber
            });

            if (typeof window !== 'undefined') {
                sessionStorage.setItem('customer', JSON.stringify(newCustomer));
            }
            router.push('/order-online');
        } catch (err) {
            setError('Gagal mendaftar. Sila cuba lagi.');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen relative p-6 font-sans" style={{ backgroundColor: '#FDF8F3' }}>

            {/* Brand Header */}
            <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-8">
                <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-6 animate-bounce-slow" style={{ backgroundColor: '#CC1512' }}>
                    <span className="text-4xl font-bold text-white">AB</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang ke AbangBob</h1>
                <p className="text-gray-500 text-center max-w-xs">
                    Daftar masuk untuk mula order
                </p>
            </div>

            {/* Form Container */}
            <div className="flex-1 w-full max-w-sm mx-auto">
                <AnimatePresence mode="wait">

                    {step === 'phone' ? (
                        <motion.form key="phone"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handlePhoneSubmit}
                            className="flex flex-col gap-4"
                        >
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700 ml-1">Nombor Telefon</label>
                                <div className="relative flex items-center gap-2">
                                    {/* Country Code Selector */}
                                    <div className="relative">
                                        <select
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            className="appearance-none bg-white border border-gray-200 rounded-2xl py-4 pl-4 pr-8 text-lg font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#CC1512] focus:border-transparent shadow-sm min-w-[100px]"
                                        >
                                            {countryCodes.map((c) => (
                                                <option key={c.code} value={c.code}>{c.code}</option>
                                            ))}
                                        </select>
                                        {/* Dropdown Arrow */}
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Phone Input */}
                                    <div className="relative flex-1">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Phone size={20} />
                                        </div>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="8123456"
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#CC1512] focus:border-transparent shadow-sm"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#CC1512] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#A50F0F] transition-colors flex items-center justify-center gap-2 mt-4"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <>Teruskan <ArrowRight size={20} /></>}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form key="register"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleRegister}
                            className="flex flex-col gap-4"
                        >
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4">
                                <p className="text-sm text-gray-500 mb-1">Nombor Telefon</p>
                                <p className="font-bold text-lg text-gray-800">{phoneNumber}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Nama Penuh</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <User size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nama Anda"
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#CC1512] focus:border-transparent shadow-sm"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Mail size={20} />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@example.com"
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#CC1512] focus:border-transparent shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#CC1512] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#A50F0F] transition-colors flex items-center justify-center gap-2 mt-4"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Daftar & Mula Order'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('phone')}
                                className="text-gray-400 text-sm mt-2 font-medium"
                            >
                                Guna nombor lain?
                            </button>
                        </motion.form>
                    )}

                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="text-center pb-6 mt-8">
                <p className="text-xs text-gray-300">Powered by AbangBob System</p>
            </div>
        </div>
    );
}
