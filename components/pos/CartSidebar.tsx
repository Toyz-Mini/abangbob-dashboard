import React from 'react';
import { ShoppingCart, Trash2, ChevronRight, Calculator, User, CreditCard } from 'lucide-react';
import { CartItem, Customer } from '@/lib/types';
import Image from 'next/image';

interface CartSidebarProps {
    cart: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    customer: Customer | null;
    onUpdateQuantity: (index: number, quantity: number) => void;
    onRemoveItem: (index: number) => void;
    onCheckout: () => void;
    onClearCart: () => void;
    onSelectCustomer: () => void;
}

const CartSidebar = ({
    cart,
    subtotal,
    discount,
    total,
    customer,
    onUpdateQuantity,
    onRemoveItem,
    onCheckout,
    onClearCart,
    onSelectCustomer
}: CartSidebarProps) => {
    if (cart.length === 0) {
        return (
            <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-white/10 shadow-xl">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                    <h2 className="font-bold text-xl flex items-center gap-2">
                        <ShoppingCart className="text-gray-400" />
                        Current Order
                    </h2>
                    <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-500">
                        # ---
                    </span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-4">
                    <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
                        <ShoppingCart size={48} className="opacity-20" />
                    </div>
                    <p className="font-medium text-lg">Your cart is empty</p>
                    <p className="text-sm">Select items from the menu to start a new order.</p>
                </div>

                {/* Customer Selector Placeholder */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5">
                    <button
                        onClick={onSelectCustomer}
                        className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-primary hover:bg-primary/5 transition-all text-gray-400 hover:text-primary group"
                    >
                        <div className="flex items-center gap-3">
                            <User size={20} />
                            <span className="font-medium">Select Customer</span>
                        </div>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-white/10 shadow-xl">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-gray-800 z-10">
                <div>
                    <h2 className="font-bold text-xl flex items-center gap-2">
                        Order Details
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                            {cart.reduce((acc, item) => acc + item.quantity, 0)}
                        </span>
                    </h2>
                    <div className="text-xs text-gray-400 mt-1">Order #PENDING</div>
                </div>
                <button
                    onClick={onClearCart}
                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-400"
                    title="Clear Cart"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group border border-transparent hover:border-gray-100 dark:hover:border-white/5">
                        {/* Qty Control */}
                        <div className="flex flex-col items-center justify-between w-8 bg-gray-100 dark:bg-white/5 rounded-lg py-1 h-20">
                            <button
                                onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-primary transition-colors text-xs font-bold"
                            >
                                +
                            </button>
                            <span className="text-sm font-bold">{item.quantity}</span>
                            <button
                                onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors text-xs font-bold"
                            >
                                -
                            </button>
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-gray-900 dark:text-white truncate pr-2">{item.name}</h4>
                                <span className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    ${(item.itemTotal * item.quantity).toFixed(2)}
                                </span>
                            </div>

                            {/* Modifiers */}
                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <div className="text-xs text-gray-500 space-y-0.5 mb-2">
                                    {item.selectedModifiers.map((mod, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span>+ {mod.optionName}</span>
                                            <span>${mod.extraPrice.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="text-xs text-gray-400">
                                ${item.itemTotal.toFixed(2)} / unit
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Customer Selection (Compact) */}
            <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                <button
                    onClick={onSelectCustomer}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-white/10 hover:border-primary transition-all text-left shadow-sm"
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <User size={16} />
                        </div>
                        {customer ? (
                            <div className="min-w-0">
                                <div className="font-bold text-sm truncate">{customer.name}</div>
                                <div className="text-xs text-gray-500 truncate">{customer.phone}</div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 font-medium">Add Customer (Optional)</div>
                        )}
                    </div>
                    {customer && (
                        <div className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                            MEMBER
                        </div>
                    )}
                </button>
            </div>

            {/* Footer / Checkout */}
            <div className="p-5 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span>-${discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-end pt-2 border-t border-dashed border-gray-200 dark:border-white/10">
                        <span className="font-bold text-lg">Total</span>
                        <span className="font-black text-3xl text-primary">${total.toFixed(2)}</span>
                    </div>
                </div>

                <button
                    onClick={onCheckout}
                    className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <CreditCard size={20} />
                    Charge ${total.toFixed(2)}
                </button>
            </div>
        </div>
    );
};

export default CartSidebar;  
