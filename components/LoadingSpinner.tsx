'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export default function LoadingSpinner({ size = 'md', color, className = '' }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 32,
  };

  return (
    <Loader2
      size={sizeMap[size]}
      className={`animate-spin ${className}`}
      color={color}
    />
  );
}

