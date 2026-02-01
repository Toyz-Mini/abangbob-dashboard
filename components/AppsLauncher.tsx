'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    Grid,
    ShoppingCart,
    Monitor,
    Tv,
    Tablet,
    Truck,
    X
} from 'lucide-react';

const APP_LINKS = [
    {
        name: 'Point of Sale',
        href: '/pos',
        icon: ShoppingCart,
        color: 'bg-blue-100 text-blue-600',
        desc: 'Cashier interface'
    },
    {
        name: 'Kitchen Display',
        href: '/kds',
        icon: Monitor,
        color: 'bg-orange-100 text-orange-600',
        desc: 'Kitchen orders'
    },
    {
        name: 'Order Display',
        href: '/order-display',
        icon: Tv,
        color: 'bg-indigo-100 text-indigo-600',
        desc: 'Customer queue'
    },
    {
        name: 'Delivery Manager',
        href: '/delivery',
        icon: Truck,
        color: 'bg-green-100 text-green-600',
        desc: 'Delivery tracking'
    },
    {
        name: 'Self Kiosk',
        href: '/kiosk-mode',
        icon: Tablet,
        color: 'bg-purple-100 text-purple-600',
        desc: 'Customer ordering'
    }
];

export default function AppsLauncher() {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-gray-100 text-primary' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Operational Apps"
            >
                <Grid size={20} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-fade-in origin-top-right overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Operational Apps</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-2 grid grid-cols-2 gap-2">
                        {APP_LINKS.map((app) => (
                            <Link
                                key={app.name}
                                href={app.href}
                                onClick={() => setIsOpen(false)}
                                className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-gray-50 transition-all hover:scale-105 group"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${app.color} group-hover:shadow-lg transition-all`}>
                                    <app.icon size={20} />
                                </div>
                                <span className="text-xs font-bold text-gray-700">{app.name}</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">{app.desc}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
