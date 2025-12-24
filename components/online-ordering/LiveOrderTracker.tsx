'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Utensils, ShoppingBag } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

interface LiveOrderTrackerProps {
    orderId: string;
    initialStatus: OrderStatus;
}

const steps = [
    { key: 'pending', label: 'Order Received', icon: Clock },
    { key: 'preparing', label: 'Preparing', icon: Utensils },
    { key: 'ready', label: 'Ready for Pickup', icon: ShoppingBag },
    { key: 'completed', label: 'Completed', icon: Check }
];

export default function LiveOrderTracker({ orderId, initialStatus }: LiveOrderTrackerProps) {
    const [status, setStatus] = useState<OrderStatus>(initialStatus);
    const supabase = getSupabaseClient();

    useEffect(() => {
        if (!supabase) return;

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`order_status:${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`
                },
                (payload: any) => {
                    if (payload.new && payload.new.status) {
                        setStatus(payload.new.status);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId, supabase]);

    const getCurrentStepIndex = () => {
        if (status === 'cancelled') return -1;
        return steps.findIndex(s => s.key === status);
    };

    const currentStepIndex = getCurrentStepIndex();

    if (status === 'cancelled') {
        return (
            <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-center">
                <p className="text-red-600 font-bold text-lg">Order Cancelled</p>
                <p className="text-red-400 text-sm">Please contact support if this is a mistake.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6 text-center text-lg">Order Status</h3>

            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-[19px] top-6 bottom-6 w-1 bg-gray-100 rounded-full">
                    <motion.div
                        className="w-full bg-orange-500 rounded-full origin-top"
                        initial={{ height: '0%' }}
                        animate={{ height: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <div className="space-y-8 relative">
                    {steps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <div key={step.key} className="flex items-center gap-4">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        backgroundColor: isCompleted ? '#F97316' : '#F3F4F6',
                                        scale: isCurrent ? 1.1 : 1
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-sm ${isCompleted ? 'text-white' : 'text-gray-400'}`}
                                >
                                    <step.icon size={18} strokeWidth={2.5} />
                                </motion.div>

                                <div className={`${isCompleted ? 'opacity-100' : 'opacity-40'} transition-opacity`}>
                                    <p className="font-bold text-gray-800 text-sm">{step.label}</p>
                                    {isCurrent && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-xs text-orange-600 font-medium animate-pulse"
                                        >
                                            In progress...
                                        </motion.p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
