'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import LiveOrderTracker from '@/components/online-ordering/LiveOrderTracker';
import { ChevronLeft, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderStatusPage({ params }: { params: { orderId: string } }) {
    const router = useRouter();
    // In Next.js 14, params is a plain object, not a promise.
    const { orderId } = params;
    const resolvedParams = { orderId }; // Keep compatibility with existing code structure if needed, or just use orderId directly.
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState<string>('');
    const supabase = getSupabaseClient();

    useEffect(() => {
        if (!supabase) {
            setDebugInfo('Supabase client not available');
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            const orderId = resolvedParams.orderId;
            console.log('[OrderStatus] Fetching order with ID:', orderId);
            setDebugInfo(`Attempting to fetch orderID: ${orderId}`);

            try {
                const { data, error } = await supabase
                    .rpc('get_public_order', { order_id: orderId });

                console.log('[OrderStatus] RPC response:', { data, error });

                if (error) {
                    console.error('Error fetching order:', error);
                    setDebugInfo(`RPC Error: ${error.message} (Code: ${error.code})`);
                    attemptLocalFallback(orderId);
                } else if (data && data.length > 0) {
                    console.log('[OrderStatus] Order found:', data[0]);
                    setOrder(data[0]);
                } else {
                    console.log('[OrderStatus] No order returned from RPC. Data:', data);
                    setDebugInfo(`Order ID ${orderId} not found in database. RPC returned empty. Checking local storage...`);
                    attemptLocalFallback(orderId);
                }
            } catch (err: any) {
                console.error('[OrderStatus] Unexpected error:', err);
                setDebugInfo(`Unexpected error: ${err?.message}`);
                attemptLocalFallback(orderId);
            }
            setLoading(false);
        };

        const attemptLocalFallback = (id: string) => {
            if (typeof window === 'undefined') return;
            try {
                const localOrdersStr = localStorage.getItem('abangbob_orders');
                if (localOrdersStr) {
                    const localOrders = JSON.parse(localOrdersStr);
                    const localOrder = localOrders.find((o: any) => o.id === id);
                    if (localOrder) {
                        console.log('[OrderStatus] Found in local storage:', localOrder);
                        // Standardize fields if needed (local is camelCase, RPC return is usually snake_case but Supabase client converts?)
                        // get_public_order is SQL function -> returns snake_case columns.
                        // But supabase client usually converts if configured? 
                        // Wait, rpc return type is 'any' usually.
                        // We need to map camelCase (local) to snake_case (expected by component) OR update component to handle both.
                        // The component uses: order.order_number, order.subtotal ... (snake_case accessors implies component expects snake_case/RPC result).
                        // Local storage is camelCase (from store.tsx).
                        // We need to convert localOrder to snake_case structure.

                        const mappedOrder = {
                            id: localOrder.id,
                            order_number: localOrder.orderNumber,
                            status: localOrder.status,
                            items: localOrder.items, // items is array in both?
                            subtotal: localOrder.subtotal,
                            discount_amount: localOrder.discountAmount || 0,
                            tax: localOrder.tax || 0,
                            total: localOrder.total,
                            loyalty_points_earned: localOrder.loyaltyPointsEarned || 0,
                            redemption_amount: localOrder.redemptionAmount || 0,
                            // Add other necessary fields
                            created_at: localOrder.createdAt,
                            is_local_fallback: true
                        };
                        setOrder(mappedOrder);
                        setDebugInfo('Showing local order (Sync Pending)');
                    } else {
                        setDebugInfo((prev) => prev + ' | Not found locally.');
                    }
                }
            } catch (e) {
                console.error('Local fallback failed', e);
            }
        };

        fetchOrder();
    }, [resolvedParams.orderId, supabase]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-gray-50 p-6">
                <p className="text-gray-500 mb-4">Order not found.</p>
                {debugInfo && (
                    <p className="text-xs text-gray-400 mb-4 text-center max-w-xs break-all">{debugInfo}</p>
                )}
                <button onClick={() => router.push('/order-online')} className="text-orange-600 font-bold">Back to Home</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 flex items-center justify-between">
                <button onClick={() => router.push('/order-online')} className="p-2 -ml-2 text-gray-600">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="font-bold text-lg text-gray-800">Order Status</h1>
                <button onClick={() => router.push('/order-online')} className="p-2 -mr-2 text-gray-600">
                    <Home size={24} />
                </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-20">
                <div className="text-center mb-4">
                    <p className="text-gray-500 text-sm">Order ID</p>
                    <p className="text-xl font-bold text-gray-900 font-mono tracking-wider">{order.order_number}</p>
                </div>

                <LiveOrderTracker orderId={order.id} initialStatus={order.status} />

                {/* Order Summary Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 text-lg">Order Details</h3>
                    <div className="space-y-3 mb-6">
                        {/* 
                           Note: order.items stored in Supabase is JSONB. 
                           Depending on how it's stored (snake_case vs camelCase keys inside JSON), 
                           we might need to adapt. Assuming standard structure.
                        */}
                        {order.items && Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-start text-sm">
                                <span className="text-gray-600 w-8 font-medium">{item.quantity}x</span>
                                <span className="text-gray-800 flex-1">{item.name}</span>
                                <span className="text-gray-900 font-bold">
                                    {(item.price * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-gray-900 font-medium">BND {order.subtotal?.toFixed(2)}</span>
                        </div>
                        {order.discount_amount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount</span>
                                <span>- BND {order.discount_amount.toFixed(2)}</span>
                            </div>
                        )}
                        {order.redemption_amount > 0 && (
                            <div className="flex justify-between text-sm text-orange-600">
                                <span>Points Redeemed</span>
                                <span>- BND {order.redemption_amount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg pt-2">
                            <span className="font-bold text-gray-800">Total</span>
                            <span className="font-bold text-orange-600">BND {order.total?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {order.loyalty_points_earned > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-2xl text-white shadow-lg text-center"
                    >
                        <p className="font-bold text-lg">Congratulations!</p>
                        <p className="text-white/90 text-sm">You earned {order.loyalty_points_earned} points from this order.</p>
                    </motion.div>
                )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <button
                    onClick={() => router.push('/order-online')}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg"
                >
                    Order Again
                </button>
            </div>
        </div>
    );
}
