'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import LiveOrderTracker from '@/components/online-ordering/LiveOrderTracker';
import { ChevronLeft, Home, Share2, Gift, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderStatusPage({ params }: { params: { orderId: string } }) {
    const router = useRouter();
    // In Next.js 14, params is a plain object, not a promise.
    const { orderId } = params;
    const resolvedParams = { orderId }; // Keep compatibility with existing code structure if needed, or just use orderId directly.
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState<string>('');
    const [customerPoints, setCustomerPoints] = useState<number>(0);
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

                if (error) {
                    console.error('Error fetching order:', error);
                    setDebugInfo(`RPC Error: ${error.message} (Code: ${error.code})`);
                    attemptLocalFallback(orderId);
                } else if (data && data.length > 0) {
                    console.log('[OrderStatus] Order found:', data[0]);
                    setOrder(data[0]);
                    if (data[0].customer_id) {
                        fetchCustomerPoints(data[0].customer_id);
                    }
                } else {
                    attemptLocalFallback(orderId);
                }
            } catch (err: any) {
                console.error('[OrderStatus] Unexpected error:', err);
                attemptLocalFallback(orderId);
            }
            setLoading(false);
        };

        const fetchCustomerPoints = async (customerId: string) => {
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('loyalty_points')
                    .eq('id', customerId)
                    .single();
                if (data) {
                    setCustomerPoints(data.loyalty_points);
                }
            } catch (e) {
                console.error('Failed to fetch points', e);
            }
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
                        const mappedOrder = {
                            id: localOrder.id,
                            order_number: localOrder.orderNumber,
                            status: localOrder.status,
                            items: localOrder.items,
                            subtotal: localOrder.subtotal,
                            discount_amount: localOrder.discountAmount || 0,
                            tax: localOrder.tax || 0,
                            total: localOrder.total,
                            loyalty_points_earned: localOrder.loyaltyPointsEarned || 0,
                            redemption_amount: localOrder.redemptionAmount || 0,
                            created_at: localOrder.createdAt,
                            customer_id: localOrder.customerId,
                            is_local_fallback: true
                        };
                        setOrder(mappedOrder);
                        setDebugInfo('Showing local order (Sync Pending)');

                        // Try to get points from session if not in DB sync yet
                        const customerStr = sessionStorage.getItem('customer');
                        if (customerStr) {
                            const c = JSON.parse(customerStr);
                            if (mappedOrder.customer_id === c.id) {
                                setCustomerPoints(c.loyaltyPoints || 0);
                            }
                        }
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

    const handleShare = async () => {
        if (!order) return;
        const shareData = {
            title: 'AbangBob Order',
            text: `Just ordered delicious food from AbangBob! Order #${order.order_number}. Status: ${order.status}`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
                alert('Copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing', err);
        }
    };

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
                <div className="flex gap-2">
                    <button onClick={handleShare} className="p-2 text-gray-600 hover:text-orange-500 transition-colors">
                        <Share2 size={24} />
                    </button>
                    <button onClick={() => router.push('/order-online')} className="p-2 -mr-2 text-gray-600">
                        <Home size={24} />
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-20">
                <div className="text-center mb-4">
                    <p className="text-gray-500 text-sm">Order ID</p>
                    <p className="text-xl font-bold text-gray-900 font-mono tracking-wider">{order.order_number}</p>
                </div>

                <LiveOrderTracker orderId={order.id} initialStatus={order.status} />

                {/* Gamified Loyalty Card */}
                {order.customer_id && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Trophy size={100} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-indigo-200 text-sm font-medium">AbangBob Rewards</p>
                                    <h3 className="text-2xl font-bold">{customerPoints} Points</h3>
                                </div>
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                    <Gift size={24} className="text-yellow-400" />
                                </div>
                            </div>

                            {order.loyalty_points_earned > 0 && (
                                <div className="mb-4 bg-white/10 rounded-lg p-2 flex items-center gap-2 text-sm">
                                    <span className="bg-yellow-400 text-indigo-900 text-xs font-bold px-1.5 py-0.5 rounded-md">NEW</span>
                                    <span>You earned +{order.loyalty_points_earned} pts!</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-indigo-200">
                                    <span>Progress to next BND 5.00</span>
                                    <span>{100 - (customerPoints % 100)} pts to go</span>
                                </div>
                                <div className="h-3 bg-indigo-950/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(customerPoints % 100)}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

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
