'use client';

import '../globals.css';
import ChatWidget from '@/components/online-ordering/ChatWidget';
import { Inter, Outfit } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export default function OrderOnlineLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-gray-50 text-gray-900`}>
            {/* Mobile Container Assumption: constrained width on Desktop to simulate phone */}
            <div className="mx-auto max-w-md min-h-screen bg-white shadow-2xl relative overflow-hidden">
                {children}
                <ChatWidget />
            </div>
        </div>
    );
}
