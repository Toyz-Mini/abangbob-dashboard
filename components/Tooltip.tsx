'use client';

import { useState, useRef, useEffect, ReactNode, useCallback } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className = '',
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Adjust position if tooltip goes off screen
  const adjustPosition = useCallback(() => {
    if (!tooltipRef.current || !wrapperRef.current) return;

    const tooltip = tooltipRef.current.getBoundingClientRect();
    const wrapper = wrapperRef.current.getBoundingClientRect();
    const padding = 8;

    let newPosition = position;

    // Check if tooltip goes off screen and adjust
    if (position === 'top' && tooltip.top < padding) {
      newPosition = 'bottom';
    } else if (position === 'bottom' && tooltip.bottom > window.innerHeight - padding) {
      newPosition = 'top';
    } else if (position === 'left' && tooltip.left < padding) {
      newPosition = 'right';
    } else if (position === 'right' && tooltip.right > window.innerWidth - padding) {
      newPosition = 'left';
    }

    if (newPosition !== actualPosition) {
      setActualPosition(newPosition);
    }
  }, [position, actualPosition]);

  useEffect(() => {
    if (isVisible) {
      adjustPosition();
    }
  }, [isVisible, adjustPosition]);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setActualPosition(position);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={wrapperRef}
      className={`tooltip-wrapper ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && content && (
        <div
          ref={tooltipRef}
          className={`tooltip tooltip-${actualPosition}`}
          role="tooltip"
          aria-hidden={!isVisible}
        >
          {content}
        </div>
      )}
    </div>
  );
}

// Shortcut tooltip for keyboard shortcuts
interface ShortcutTooltipProps {
  shortcut: string;
  children: ReactNode;
  position?: TooltipPosition;
}

export function ShortcutTooltip({ shortcut, children, position = 'bottom' }: ShortcutTooltipProps) {
  const formatShortcut = (key: string) => {
    return key
      .replace('Ctrl', '⌃')
      .replace('Cmd', '⌘')
      .replace('Alt', '⌥')
      .replace('Shift', '⇧')
      .replace('Enter', '↵')
      .replace('Esc', '⎋');
  };

  return (
    <Tooltip
      content={
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <kbd style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '0.125rem 0.375rem',
            borderRadius: '0.25rem',
            fontSize: '0.7rem',
            fontFamily: 'inherit',
          }}>
            {formatShortcut(shortcut)}
          </kbd>
        </span>
      }
      position={position}
    >
      {children}
    </Tooltip>
  );
}

// Info tooltip with icon
interface InfoTooltipProps {
  content: ReactNode;
  position?: TooltipPosition;
}

export function InfoTooltip({ content, position = 'top' }: InfoTooltipProps) {
  return (
    <Tooltip content={content} position={position}>
      <span 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'var(--gray-200)',
          color: 'var(--text-secondary)',
          fontSize: '0.65rem',
          fontWeight: 700,
          cursor: 'help',
        }}
        tabIndex={0}
        aria-label="More information"
      >
        ?
      </span>
    </Tooltip>
  );
}


