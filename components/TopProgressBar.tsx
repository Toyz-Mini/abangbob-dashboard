'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface TopProgressBarProps {
  color?: string;
  height?: number;
  showSpinner?: boolean;
}

export default function TopProgressBar({ 
  color = 'var(--primary)',
  height = 3,
  showSpinner = false 
}: TopProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startProgress = useCallback(() => {
    setIsVisible(true);
    setProgress(0);
    
    // Quick initial progress
    setTimeout(() => setProgress(30), 50);
    setTimeout(() => setProgress(50), 150);
    setTimeout(() => setProgress(70), 300);
  }, []);

  const completeProgress = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  // Listen for route changes
  useEffect(() => {
    startProgress();
    const timeout = setTimeout(completeProgress, 500);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams, startProgress, completeProgress]);

  if (!isVisible) return null;

  return (
    <div 
      className="top-progress-bar"
      style={{ height }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div 
        className="top-progress-bar-inner"
        style={{ 
          width: `${progress}%`,
          background: color === 'var(--primary)' ? 'var(--gradient-primary)' : color,
        }}
      />
      {showSpinner && progress < 100 && (
        <div 
          className="top-progress-spinner"
          style={{
            position: 'fixed',
            top: 15,
            right: 15,
            width: 18,
            height: 18,
            border: `2px solid transparent`,
            borderTopColor: color,
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            zIndex: 99999,
          }}
        />
      )}
    </div>
  );
}

// Hook for manual progress control
export function useProgress() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const start = useCallback(() => {
    setIsLoading(true);
    setProgress(0);
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const complete = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 300);
  }, []);

  const set = useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);

  return { progress, isLoading, start, complete, set };
}

