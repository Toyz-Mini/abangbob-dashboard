'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderSuccessPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col h-screen bg-white items-center justify-center p-6 text-center">

            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6"
            >
                <CheckCircle size={48} />
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pesanan Diterima!</h1>
            <p className="text-gray-500 mb-10 max-w-xs mx-auto">
                Terima kasih. Kami sedang menyediakan pesanan anda. Sila tunjukkan resit ini di kaunter jika diminta.
            </p>

            <div className="w-full max-w-xs space-y-3">
                <button
                    onClick={() => router.push('/order-online')} // Go back to start
                    className="w-full bg-[#CC1512] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-red-700 transition-colors"
                >
                    Menu Utama
                </button>
            </div>

        </div>
    );
}
