'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface OrderTimerProps {
  startTime: Date | string;
  warningThreshold?: number; // minutes
  urgentThreshold?: number; // minutes
  onWarning?: () => void;
  onUrgent?: () => void;
  showIcon?: boolean;
  className?: string;
}

export default function OrderTimer({
  startTime,
  warningThreshold = 10,
  urgentThreshold = 15,
  onWarning,
  onUrgent,
  showIcon = true,
  className = '',
}: OrderTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [hasTriggeredWarning, setHasTriggeredWarning] = useState(false);
  const [hasTriggeredUrgent, setHasTriggeredUrgent] = useState(false);

  const startDate = useMemo(() => {
    return typeof startTime === 'string' ? new Date(startTime) : startTime;
  }, [startTime]);

  useEffect(() => {
    const updateElapsed = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startDate.getTime()) / 1000);
      setElapsed(diff);
    };

    // Initial update
    updateElapsed();

    // Update every second
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  // Trigger callbacks
  useEffect(() => {
    const elapsedMinutes = elapsed / 60;

    if (elapsedMinutes >= urgentThreshold && !hasTriggeredUrgent) {
      setHasTriggeredUrgent(true);
      onUrgent?.();
    } else if (elapsedMinutes >= warningThreshold && !hasTriggeredWarning) {
      setHasTriggeredWarning(true);
      onWarning?.();
    }
  }, [elapsed, warningThreshold, urgentThreshold, hasTriggeredWarning, hasTriggeredUrgent, onWarning, onUrgent]);

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine status
  const getStatus = (): 'normal' | 'warning' | 'urgent' => {
    const elapsedMinutes = elapsed / 60;
    if (elapsedMinutes >= urgentThreshold) return 'urgent';
    if (elapsedMinutes >= warningThreshold) return 'warning';
    return 'normal';
  };

  const status = getStatus();
  const Icon = status === 'urgent' ? AlertTriangle : Clock;

  return (
    <div className={`order-timer ${status} ${className}`}>
      {showIcon && <Icon size={16} className="order-timer-icon" />}
      <span>{formatTime(elapsed)}</span>
    </div>
  );
}

// Countdown timer (for estimated completion)
interface CountdownTimerProps {
  targetTime: Date | string;
  onComplete?: () => void;
  showIcon?: boolean;
  completedText?: string;
  className?: string;
}

export function CountdownTimer({
  targetTime,
  onComplete,
  showIcon = true,
  completedText = 'Ready!',
  className = '',
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  const targetDate = useMemo(() => {
    return typeof targetTime === 'string' ? new Date(targetTime) : targetTime;
  }, [targetTime]);

  useEffect(() => {
    const updateRemaining = () => {
      const now = new Date();
      const diff = Math.floor((targetDate.getTime() - now.getTime()) / 1000);
      setRemaining(Math.max(0, diff));

      if (diff <= 0 && !hasCompleted) {
        setHasCompleted(true);
        onComplete?.();
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [targetDate, hasCompleted, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (remaining === 0) {
    return (
      <div className={`order-timer normal ${className}`} style={{ color: 'var(--success)' }}>
        {showIcon && <Clock size={16} className="order-timer-icon" />}
        <span>{completedText}</span>
      </div>
    );
  }

  return (
    <div className={`order-timer normal ${className}`}>
      {showIcon && <Clock size={16} className="order-timer-icon" />}
      <span>{formatTime(remaining)}</span>
    </div>
  );
}

// Timer badge (compact version for cards)
interface TimerBadgeProps {
  startTime: Date | string;
  warningThreshold?: number;
  urgentThreshold?: number;
}

export function TimerBadge({
  startTime,
  warningThreshold = 10,
  urgentThreshold = 15,
}: TimerBadgeProps) {
  const [elapsed, setElapsed] = useState(0);

  const startDate = useMemo(() => {
    return typeof startTime === 'string' ? new Date(startTime) : startTime;
  }, [startTime]);

  useEffect(() => {
    const updateElapsed = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startDate.getTime()) / 1000);
      setElapsed(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  const elapsedMinutes = elapsed / 60;
  const status = elapsedMinutes >= urgentThreshold ? 'danger' : 
                 elapsedMinutes >= warningThreshold ? 'warning' : 'info';

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    if (mins < 1) return '<1m';
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins}m`;
  };

  return (
    <span className={`badge badge-${status}`}>
      <Clock size={12} style={{ marginRight: '0.25rem' }} />
      {formatTime(elapsed)}
    </span>
  );
}




