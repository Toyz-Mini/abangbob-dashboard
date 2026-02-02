import React, { memo } from 'react';
import { MenuItem } from '@/lib/types';
import { UtensilsCrossed, Sandwich, Coffee, Plus } from 'lucide-react';
import Image from 'next/image';

interface ProductCardProps {
    item: MenuItem;
    onClick: (item: MenuItem) => void;
}

const ProductCard = memo(({ item, onClick }: ProductCardProps) => {
    return (
        <div
            onClick={() => onClick(item)}
            className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden h-full"
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] w-full bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center overflow-hidden">
                {item.image ? (
                    <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        unoptimized
                    />
                ) : (
                    <div className="text-gray-300 dark:text-gray-600 transition-colors group-hover:text-primary/50">
                        {item.category === 'Nasi Lemak' ? <UtensilsCrossed size={48} strokeWidth={1.5} /> :
                            item.category === 'Burger' ? <Sandwich size={48} strokeWidth={1.5} /> :
                                <Coffee size={48} strokeWidth={1.5} />}
                    </div>
                )}

                {/* Overlay Gradient on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Add Button Overlay */}
                <button
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary text-white shadow-lg translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center"
                    aria-label="Add to cart"
                >
                    <Plus size={24} strokeWidth={2.5} />
                </button>

                {/* Modifier Indicator */}
                {item.modifierGroupIds.length > 0 && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-md text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider shadow-sm border border-gray-100 dark:border-white/10">
                        Custom
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-4">
                <h3 className="font-bold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {item.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                    {item.category}
                </p>

                <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                        <span className="text-xs font-medium text-gray-400 mr-0.5">BND</span>
                        {item.price.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
