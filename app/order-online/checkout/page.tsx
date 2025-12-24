'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { OrderItem, Order } from '@/lib/types';
import {
    ChevronLeft, MapPin,
    Clock,
    CreditCard,
    DollarSign,
    CheckCircle,
    ShoppingBag,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Loader2,
    Gift,
    Coins,
    X,
    User,
    Plus,
    Tag,
    Check,
    Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyPromoCode, getCustomerPoints, calculateRedemptionValue, calculatePointsEarned, PromoValidationResult } from '@/lib/logic/promo-loyalty';
import { PromoCode } from '@/lib/supabase/types';

export default function CheckoutPage() {
    const router = useRouter();
    const { addOrder, menuItems } = useStore();

    // State
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [customer, setCustomer] = useState<any>(null);
    const [pickupTime, setPickupTime] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('qr');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Advanced Features State
    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoError, setPromoError] = useState('');
    const [isVerifyingPromo, setIsVerifyingPromo] = useState(false);

    const [availablePoints, setAvailablePoints] = useState(0);
    const [usePoints, setUsePoints] = useState(false);
    const [redeemableAmount, setRedeemableAmount] = useState(0);

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

    // Fetch Loyalty Points when customer loads
    useEffect(() => {
        if (customer?.id) {
            getCustomerPoints(customer.id).then(points => {
                setAvailablePoints(points);
                setRedeemableAmount(calculateRedemptionValue(points));
            });
        }
    }, [customer]);

    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Calculate final total
    const pointsDiscount = usePoints ? redeemableAmount : 0;
    // ensure total doesn't go below 0
    let total = Math.max(0, subtotal - promoDiscount - pointsDiscount);

    // Logic: Points earned on final paid amount
    const pointsToEarn = calculatePointsEarned(total);

    const handleApplyPromo = async () => {
        if (!promoCodeInput.trim()) return;
        setIsVerifyingPromo(true);
        setPromoError('');

        const result = await verifyPromoCode(promoCodeInput, subtotal);
        setIsVerifyingPromo(false);

        if (result.isValid && result.promoCode) {
            setAppliedPromo(result.promoCode);
            setPromoDiscount(result.discountAmount);
            setPromoCodeInput(''); // clear input
        } else {
            setAppliedPromo(null);
            setPromoDiscount(0);
            setPromoError(result.error || 'Invalid code');
        }
    };

    const removePromo = () => {
        setAppliedPromo(null);
        setPromoDiscount(0);
        setPromoCodeInput('');
    };

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
                // Advanced Fields
                promoCodeId: appliedPromo?.id || null,
                discountAmount: promoDiscount,
                loyaltyPointsEarned: pointsToEarn,
                loyaltyPointsRedeemed: usePoints ? Math.floor(availablePoints / 100) * 100 : 0, // blocks of 100
                redemptionAmount: pointsDiscount
            };

            const newOrder = await addOrder(orderData as any);

            // Clear cart
            sessionStorage.removeItem('onlineCart');
            sessionStorage.removeItem('pickupTime');
            // Keep customer logged in

            if (newOrder && newOrder.id) {
                router.push(`/order-online/status/${newOrder.id}`);
            } else {
                // Fallback if ID handling fails (e.g. offline queue only)
                router.push('/order-online/success');
            }
        } catch (error) {
            console.error('Order failed', error);
            alert('Gagal membuat pesanan. Sila cuba lagi.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 flex items-center gap-3 shrink-0">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="font-bold text-lg text-gray-800">Review & Bayar</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-48">
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

                {/* Upsell Carousel */}
                {upsellItems.length > 0 && (
                    <div className="animate-fade-in">
                        <h2 className="font-bold text-gray-800 mb-3">Order Sekali?</h2>
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 snap-x"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {upsellItems.map(item => (
                                <motion.div
                                    key={item.id}
                                    whileTap={{ scale: 0.95 }}
                                    className="min-w-[160px] bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col snap-center first:ml-0 last:mr-4 ml-4 first:ml-4"
                                >
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
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                )}

                {/* Promo Code Section */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Tag size={16} className="text-orange-500" />
                        Promo Code
                    </h2>

                    {appliedPromo ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="bg-green-100 p-1.5 rounded-full text-green-700">
                                    <Check size={14} />
                                </div>
                                <div>
                                    <p className="font-bold text-green-800 text-sm">{appliedPromo.code}</p>
                                    <p className="text-xs text-green-600">Diskaun BND {promoDiscount.toFixed(2)} applied</p>
                                </div>
                            </div>
                            <button onClick={removePromo} className="text-gray-400 hover:text-red-500">
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={promoCodeInput}
                                onChange={(e) => setPromoCodeInput(e.target.value)}
                                placeholder="Masukkan kod"
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 uppercase"
                            />
                            <button
                                onClick={handleApplyPromo}
                                disabled={isVerifyingPromo || !promoCodeInput}
                                className="bg-gray-900 text-white px-4 rounded-xl font-bold text-sm disabled:opacity-50"
                            >
                                {isVerifyingPromo ? 'Check...' : 'Apply'}
                            </button>
                        </div>
                    )}
                    {promoError && <p className="text-red-500 text-xs mt-2 ml-1">{promoError}</p>}
                </div>

                {/* Loyalty Points Section */}
                {customer && availablePoints >= 100 && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-3">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <Gift size={16} className="text-orange-500" />
                                Guna Points
                            </h2>
                            <div className="flex justify-between items-center bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <div>
                                    <p className="font-bold text-gray-800 flex items-center gap-2">
                                        <Coins size={18} className="text-orange-500" />
                                        {availablePoints} Points Available
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">100 Pts = BND 5.00</p>
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => setUsePoints(!usePoints)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${usePoints ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}
                        >
                            <div className="flex flex-col">
                                <span className={`font-bold text-sm ${usePoints ? 'text-orange-800' : 'text-gray-700'}`}>
                                    Tebus {Math.floor(availablePoints / 100) * 100} Points
                                </span>
                                <span className="text-xs text-gray-500">Jimat BND {redeemableAmount.toFixed(2)}</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${usePoints ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                                {usePoints && <Check size={14} className="text-white" />}
                            </div>
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
            </div>

            {/* Bottom Bar - Total & Place Order */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20">
                <div className="max-w-md mx-auto">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-gray-600 mb-2">
                            <span>Subtotal</span>
                            <span>BND {(subtotal || 0).toFixed(2)}</span>
                        </div>
                        {promoDiscount > 0 && (
                            <div className="flex justify-between text-green-600 mb-2">
                                <span>Promo Discount</span>
                                <span>- BND {promoDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        {usePoints && redeemableAmount > 0 && (
                            <div className="flex justify-between text-orange-600 mb-2">
                                <span>Loyalty Redemption</span>
                                <span>- BND {redeemableAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-900 text-lg border-t pt-4">
                            <span>Total</span>
                            <span>BND {(total || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    {customer && (
                        <div className="bg-yellow-50 p-2 rounded-lg mb-4 flex items-center justify-center gap-2 text-xs text-yellow-800 font-medium">
                            <Gift size={12} />
                            Anda akan dapat +{pointsToEarn} Points!
                        </div>
                    )}

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
