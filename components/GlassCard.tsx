import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    gradient?: 'none' | 'primary' | 'accent' | 'subtle';
    hoverEffect?: boolean;
}

export default function GlassCard({
    children,
    className = '',
    gradient = 'none',
    hoverEffect = false,
    style,
    ...props
}: GlassCardProps) {

    const getGradientOverlay = () => {
        switch (gradient) {
            case 'primary': return 'linear-gradient(135deg, rgba(204, 21, 18, 0.05) 0%, rgba(255, 75, 31, 0.02) 100%)';
            case 'accent': return 'linear-gradient(135deg, rgba(249, 115, 34, 0.05) 0%, rgba(251, 191, 36, 0.02) 100%)';
            case 'subtle': return 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)';
            default: return 'none';
        }
    };

    return (
        <div
            className={`glass-panel ${hoverEffect ? 'hover-lift' : ''} ${className}`}
            style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-xl)',
                position: 'relative',
                overflow: 'hidden',
                background: gradient !== 'none' ? `var(--glass-bg), ${getGradientOverlay()}` : 'var(--glass-bg)',
                ...style
            }}
            {...props}
        >
            {/* Subtle shine effect */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                pointerEvents: 'none'
            }} />

            {children}
        </div>
    );
}
