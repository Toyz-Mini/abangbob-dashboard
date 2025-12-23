'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { OrderItem, Order } from '@/lib/types';
import { ChevronLeft, MapPin, Clock, CreditCard, Banknote, User, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
    const router = useRouter();
    const { addOrder, menuItems } = useStore();

    // State
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [customer, setCustomer] = useState<any>(null);
    const [pickupTime, setPickupTime] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('qr');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Load Cart
            const savedCart = sessionStorage.getItem('onlineCart');
            if (!savedCart || JSON.parse(savedCart).length === 0) {
                router.push('/order-online/menu');
                return;
            }
            setCart(JSON.parse(savedCart));

            // Load Customer
            const savedCustomer = sessionStorage.getItem('customer');
            if (savedCustomer) {
                setCustomer(JSON.parse(savedCustomer));
            } else {
                router.push('/order-online/auth');
            }

            // Load Pickup Time
            setPickupTime(sessionStorage.getItem('pickupTime') || 'ASAP');
        }
    }, [router]);

    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    // Assuming 0 tax/fees for now as not specified logic
    const total = subtotal;

    // Derived: Upsell items (simple logic: items not in cart)
    const upsellItems = menuItems
        .filter(item => !cart.some(c => c.menuItemId === item.id) && item.category !== 'Unspecified')
        .slice(0, 5); // Take top 5 recommendations

    const addToCartSimple = (item: any) => {
        const newItem: OrderItem = {
            id: crypto.randomUUID(),
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            modifiers: [],
            notes: ''
        };
        const newCart = [...cart, newItem];
        setCart(newCart);
        sessionStorage.setItem('onlineCart', JSON.stringify(newCart));
    };

    const handlePlaceOrder = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // Transform OrderItems to CartItems (compatible with Order interface)
            const orderItems = cart.map(item => ({
                ...item,
                id: item.menuItemId, // CORRECT: Use Product ID for inventory lookup
                category: 'Unspecified', // Missing in OrderItem, needed for CartItem/MenuItem
                isAvailable: true,
                modifierGroupIds: [],
                image: '', // Optional
                selectedModifiers: item.modifiers || [],
                itemTotal: item.price * item.quantity
            }));

            // Construct Order Object
            const orderData = {
                items: orderItems,
                total: total,
                subtotal: subtotal,
                tax: 0,
                orderType: 'takeaway',
                status: 'pending',
                paymentMethod: paymentMethod,
                createdAt: new Date().toISOString(),
                customerId: customer?.id,
                customerName: `${customer?.name || 'Guest'} (Pick-up: ${pickupTime})`,
                customerPhone: customer?.phone,
                redeemedPoints: 0,
                redemptionAmount: 0
            };

            await addOrder(orderData as any);

            // Clear cart
            sessionStorage.removeItem('onlineCart');
            sessionStorage.removeItem('pickupTime');
            // Keep customer logged in

            router.push('/order-online/success');
        } catch (error) {
            console.error('Order failed', error);
            alert('Gagal membuat pesanan. Sila cuba lagi.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="font-bold text-lg text-gray-800">Review & Bayar</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Pickup Details */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Clock size={16} className="text-orange-500" />
                        Masa Pengambilan
                    </h2>
                    <div className="flex justify-between items-center bg-orange-50 p-3 rounded-xl border border-orange-100">
                        <span className="font-medium text-orange-900">{pickupTime}</span>
                        <button onClick={() => router.push('/order-online')} className="text-xs font-bold text-orange-600 underline">Tukar</button>
                    </div>
                </div>

                {/* Customer Details */}
                {customer && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <User size={16} className="text-orange-500" />
                            Maklumat Anda
                        </h2>
                        <div className="text-sm text-gray-600">
                            <p className="font-bold text-gray-900">{customer.name}</p>
                            <p>{customer.phone}</p>
                            <p>{customer.email}</p>
                        </div>
                    </div>
                )}

                {/* Order Items */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-3">Pesanan Anda</h2>
                    <div className="space-y-4">
                        {cart.map((item) => (
                            <div key={item.id} className="flex justify-between items-start border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                <div className="flex items-start gap-3">
                                    <div className="bg-gray-100 w-8 h-8 rounded-lg flex items-center justify-center font-medium text-xs text-gray-600">
                                        {item.quantity}x
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.notes}</p>
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900">BND {(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Upsell Carousel */}
            {upsellItems.length > 0 && (
                <div>
                    <h2 className="font-bold text-gray-800 mb-3 px-1">Order Sekali?</h2>
                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
                        {upsellItems.map(item => (
                            <div key={item.id} className="min-w-[160px] bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col">
                                <div className="h-24 bg-gray-100 rounded-lg mb-2 relative overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300"
                                        className="w-full h-full object-cover"
                                        alt={item.name}
                                    />
                                </div>
                                <h3 className="font-bold text-sm text-gray-800 line-clamp-1 mb-1">{item.name}</h3>
                                <div className="mt-auto flex justify-between items-center">
                                    <span className="text-orange-600 font-bold text-sm">BND {item.price.toFixed(2)}</span>
                                    <button
                                        onClick={() => addToCartSimple(item)}
                                        className="p-1.5 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payment Method */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-800 mb-3">Cara Pembayaran</h2>
                <div className="space-y-2">
                    <button
                        onClick={() => setPaymentMethod('qr')}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${paymentMethod === 'qr' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 bg-white'}`}
                    >
                        <div className="flex items-center gap-3">
                            <CreditCard size={20} className={paymentMethod === 'qr' ? 'text-orange-600' : 'text-gray-400'} />
                            <span className={paymentMethod === 'qr' ? 'font-bold text-orange-900' : 'font-medium text-gray-700'}>DuitNow QR / Transfer</span>
                        </div>
                        {paymentMethod === 'qr' && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
                    </button>

                    <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 bg-white'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Banknote size={20} className={paymentMethod === 'cash' ? 'text-orange-600' : 'text-gray-400'} />
                            <span className={paymentMethod === 'cash' ? 'font-bold text-orange-900' : 'font-medium text-gray-700'}>Tunai (Kaunter)</span>
                        </div>
                        {paymentMethod === 'cash' && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
                    </button>
                </div>
            </div>


            {/* Bottom Bar - Total & Place Order */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20">
                <div className="max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-4 text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-bold text-gray-900">BND {subtotal.toFixed(2)}</span>
                    </div>
                    {/* Tax could go here */}
                    <div className="flex justify-between items-center mb-6 text-xl">
                        <span className="font-bold text-gray-800">Total</span>
                        <span className="font-bold text-orange-600">BND {total.toFixed(2)}</span>
                    </div>

                    <button
                        disabled={isSubmitting}
                        onClick={handlePlaceOrder}
                        className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400' : 'bg-[#CC1512] hover:bg-red-700'}`}
                    >
                        {isSubmitting ? 'Memproses...' : 'Sahkan Pesanan'}
                    </button>
                </div>
            </div>
        </div >
    );
}
