import React, { memo } from 'react';
import { MenuItem } from '@/lib/types';
import { UtensilsCrossed, Sandwich, Coffee } from 'lucide-react';

interface POSMenuItemProps {
    item: MenuItem;
    onClick: (item: MenuItem) => void;
}

const POSMenuItem = memo(({ item, onClick }: POSMenuItemProps) => {
    return (
        <div
            className="card"
            style={{ cursor: 'pointer', transition: 'transform 0.2s', touchAction: 'manipulation' }}
            onClick={() => onClick(item)}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
        >
            <div style={{
                width: '100%',
                height: '100px',
                background: 'var(--gray-100)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    item.category === 'Nasi Lemak' ? <UtensilsCrossed size={40} /> :
                        item.category === 'Burger' ? <Sandwich size={40} /> : <Coffee size={40} />
                )}

                {item.modifierGroupIds.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'var(--warning)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        +
                    </div>
                )}
            </div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem', lineHeight: '1.2' }}>
                {item.name}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                BND {item.price.toFixed(2)}
            </div>
        </div>
    );
}, (prev, next) => {
    return (
        prev.item.id === next.item.id &&
        prev.item.name === next.item.name &&
        prev.item.price === next.item.price &&
        prev.item.isAvailable === next.item.isAvailable &&
        prev.item.image === next.item.image
    );
});

POSMenuItem.displayName = 'POSMenuItem';

export default POSMenuItem;
