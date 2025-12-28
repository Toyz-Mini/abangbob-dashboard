'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export default function LoadingSpinner({ size = 'md', color, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: 'spinner',
    lg: 'spinner',
  };

  const style: React.CSSProperties = {
    ...(size === 'lg' ? { width: '32px', height: '32px', borderWidth: '4px' } : {}),
    ...(color ? { borderTopColor: color, borderRightColor: color && size !== 'lg' ? 'transparent' : undefined } : {}) // Simple spin implementation usually uses border color
  };

  // Note: The 'spinner' class likely defines border color. 
  // If we want to override it, we can use border-top-color.
  // Assuming a standard spinner CSS implementation.

  return (
    <div
      className={`${sizeClasses[size]} ${className}`}
      style={{
        ...style,
        ...(color ? { borderTopColor: color } : {})
      }}
    />
  );
}

