'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: 'spinner',
    lg: 'spinner',
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`} style={size === 'lg' ? { width: '32px', height: '32px', borderWidth: '4px' } : {}} />
  );
}

