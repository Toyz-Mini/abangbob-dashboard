import React from 'react';
import { Loader2 } from 'lucide-react';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ElementType;
    loading?: boolean;
    isActive?: boolean;
}

export default function PremiumButton({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    loading = false,
    className = '',
    style,
    disabled,
    isActive,
    ...props
}: PremiumButtonProps) {


    const getVariantStyles = () => {
        // Base styles for active state override
        const activeStyles = isActive ? {
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            borderColor: 'var(--primary)'
        } : {};

        switch (variant) {
            case 'primary':
                return {
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(204, 21, 18, 0.3)',
                };
            case 'secondary':
                return {
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    ...(isActive ? { background: 'var(--gray-200)', borderColor: 'var(--gray-400)' } : {})
                };
            case 'outline':
                return {
                    background: 'transparent',
                    color: 'var(--primary)',
                    border: '2px solid var(--primary)',
                    ...(isActive ? { background: 'var(--primary-light)' } : {})
                };
            case 'glass':
                return {
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                    border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.2)',
                };
            default:
                return {};
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return { padding: '0.4rem 0.8rem', fontSize: '0.875rem' };
            case 'lg':
                return { padding: '1rem 2rem', fontSize: '1.1rem' };
            default:
                return { padding: '0.75rem 1.5rem', fontSize: '1rem' };
        }
    };

    return (
        <button
            className={`hover-lift ${className}`}
            disabled={disabled || loading}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                borderRadius: 'var(--radius-lg)',
                fontWeight: 600,
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: 'all 0.2s',
                ...getVariantStyles(),
                ...getSizeStyles(),
                ...style,
            }}
            {...props}
        >
            {loading ? (
                <Loader2 size={18} className="animate-spin" />
            ) : Icon ? (
                <Icon size={18} />
            ) : null}
            {children}
        </button>
    );
}
