'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMenu } from '@/lib/store';
import { MenuItem, OrderItem, SelectedModifier } from '@/lib/types';
import { Search, ShoppingBag, X, Plus, Minus, ChevronLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Mock Product Images for Demo if missing
const getProductImage = (category: string) => {
    if (category === 'Nasi Lemak') return 'https://images.unsplash.com/photo-1591814468909-1f8836bfe93a?auto=format&fit=crop&q=80&w=800';
    if (category === 'Minuman') return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
};

export default function OnlineMenuPage() {
    const router = useRouter();
    const { menuItems, getMenuCategories, modifierGroups, modifierOptions } = useMenu();
    const categories = ['All', ...getMenuCategories()]; // Ensure 'All' is first

    const [activeCategory, setActiveCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
    const [orderMode, setOrderMode] = useState<string | null>(null);

    useEffect(() => {
        // Load mode and cart
        if (typeof window !== 'undefined') {
            setOrderMode(sessionStorage.getItem('orderMode') || 'dine-in');
            const savedCart = sessionStorage.getItem('onlineCart');
            if (savedCart) {
                try {
                    setCart(JSON.parse(savedCart));
                } catch (e) {
                    console.error('Failed to parse cart', e);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('onlineCart', JSON.stringify(cart));
        }
    }, [cart]);

    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch && item.isAvailable;
        });
    }, [menuItems, activeCategory, searchTerm]);

    // Derived state for current item's modifiers
    const activeModifierGroups = useMemo(() => {
        if (!selectedItem) return [];
        return modifierGroups.filter(g => selectedItem.modifierGroupIds?.includes(g.id));
    }, [selectedItem, modifierGroups]);

    const handleModifierToggle = (group: any, option: any) => {
        const isSelected = selectedModifiers.some(m => m.optionId === option.id);

        if (group.allowMultiple) {
            if (isSelected) {
                setSelectedModifiers(prev => prev.filter(m => m.optionId !== option.id));
            } else {
                // Check max selection
                const currentCount = selectedModifiers.filter(m => m.groupId === group.id).length;
                if (group.maxSelection > 0 && currentCount >= group.maxSelection) {
                    return; // Max reached
                }

                setSelectedModifiers(prev => [...prev, {
                    groupId: group.id,
                    groupName: group.name,
                    optionId: option.id,
                    optionName: option.name,
                    extraPrice: option.extraPrice
                }]);
            }
        } else {
            // Single selection - replace existing for this group
            const newMod = {
                groupId: group.id,
                groupName: group.name,
                optionId: option.id,
                optionName: option.name,
                extraPrice: option.extraPrice
            };

            setSelectedModifiers(prev => [
                ...prev.filter(m => m.groupId !== group.id),
                newMod
            ]);
        }
    };

    const calculateItemTotal = () => {
        if (!selectedItem) return 0;
        const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.extraPrice, 0);
        return (selectedItem.price + modifiersTotal) * quantity;
    };

    const addToCart = () => {
        if (!selectedItem) return;

        const newItem: OrderItem = {
            id: crypto.randomUUID(),
            menuItemId: selectedItem.id,
            name: selectedItem.name,
            price: selectedItem.price + selectedModifiers.reduce((sum, m) => sum + m.extraPrice, 0), // Base + Modifiers
            quantity: quantity,
            modifiers: selectedModifiers,
            notes: ''
        };

        setCart([...cart, newItem]);
        setSelectedItem(null);
        setQuantity(1);
    };

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <div className="flex flex-col h-screen bg-gray-50 pb-20">

            {/* Top Header */}
            <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h1 className="font-bold text-lg text-gray-800">Menu</h1>
                        <p className="text-xs text-gray-500 capitalize">{orderMode?.replace('-', ' ')}</p>
                    </div>
                    <button className="p-2 bg-gray-100 rounded-full text-gray-600">
                        <Search size={20} />
                    </button>
                </div>

                {/* Categories Scroller */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-4">
                    {filteredItems.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => {
                                setSelectedItem(item);
                                setQuantity(1);
                                setSelectedModifiers([]);
                            }}
                            className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 active:scale-95 transition-transform"
                        >
                            <div className="aspect-square rounded-xl bg-gray-100 mb-3 overflow-hidden relative">
                                {/* Placeholder Image */}
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                    {/* Real implementation would use item.image */}
                                    <Image
                                        src={getProductImage(item.category)}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">{item.name}</h3>
                            <p className="text-orange-600 font-bold text-sm">BND {item.price.toFixed(2)}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Padding for bottom cart bar */}
                <div className="h-24"></div>
            </div>

            {/* Floating Cart Bar */}
            <AnimatePresence>
                {cart.length > 0 && !selectedItem && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 z-20"
                    >
                        {/* Mobile Container constraint hack */}
                        <div className="max-w-md mx-auto">
                            <button
                                onClick={() => router.push('/order-online/checkout')}
                                className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">
                                        {cartCount}
                                    </div>
                                    <span className="font-medium">Jom Bayar / Checkout</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">BND {cartTotal.toFixed(2)}</span>
                                    <ChevronLeft className="rotate-180" size={20} />
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="fixed inset-0 bg-black z-30"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-40 p-6 pb-8 max-h-[85vh] overflow-y-auto"
                        >
                            {/* Mobile Container constraint hack */}
                            <div className="max-w-md mx-auto">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                                        <p className="text-orange-600 text-xl font-bold mt-1">BND {selectedItem.price.toFixed(2)}</p>
                                    </div>
                                    <button onClick={() => setSelectedItem(null)} className="p-2 bg-gray-100 rounded-full">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 mb-6 min-h-[150px] flex items-center justify-center">
                                    <Image
                                        src={getProductImage(selectedItem.category)}
                                        alt={selectedItem.name}
                                        width={400}
                                        height={300}
                                        className="rounded-lg max-h-[140px] w-auto object-cover"
                                        unoptimized
                                    />
                                </div>

                                <div className="mb-8">
                                    <label className="text-sm font-bold text-gray-700 mb-3 block">Special Instructions</label>
                                    <textarea
                                        className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500"
                                        placeholder="e.g. Kurang manis, tak nak sayur..."
                                        rows={2}
                                    />
                                </div>

                                {/* Modifiers Section */}
                                <div className="space-y-6 mb-8">
                                    {activeModifierGroups.map(group => (
                                        <div key={group.id}>
                                            <div className="flex justify-between items-center mb-3">
                                                <h3 className="font-bold text-gray-800">{group.name}</h3>
                                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                    {group.isRequired ? 'Wajib' : 'Optional'}
                                                    {group.allowMultiple ? ` (Max ${group.maxSelection})` : ' (Pilih 1)'}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {modifierOptions
                                                    .filter(opt => opt.groupId === group.id && opt.isAvailable)
                                                    .map(option => {
                                                        const isSelected = selectedModifiers.some(m => m.optionId === option.id);
                                                        return (
                                                            <div
                                                                key={option.id}
                                                                onClick={() => handleModifierToggle(group, option)}
                                                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected
                                                                    ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                                                                    : 'border-gray-100'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected
                                                                        ? 'border-orange-500 bg-orange-500 text-white'
                                                                        : 'border-gray-300'
                                                                        }`}>
                                                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                                                    </div>
                                                                    <span className="font-medium text-gray-700">{option.name}</span>
                                                                </div>
                                                                {option.extraPrice > 0 && (
                                                                    <span className="text-sm font-bold text-orange-600">
                                                                        + BND {option.extraPrice.toFixed(2)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-4 bg-gray-100 rounded-xl p-2 px-4">
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1">
                                            <Minus size={20} className={quantity === 1 ? 'text-gray-400' : 'text-gray-900'} />
                                        </button>
                                        <span className="font-bold text-lg w-6 text-center">{quantity}</span>
                                        <button onClick={() => setQuantity(quantity + 1)} className="p-1">
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={addToCart}
                                        className="flex-1 bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>Add - BND {calculateItemTotal().toFixed(2)}</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}
