'use client';

import { useState, useRef, useEffect, ReactNode, useCallback } from 'react';

type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  position?: PopoverPosition;
  align?: 'start' | 'center' | 'end';
  className?: string;
  triggerClassName?: string;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
}

export default function Popover({
  trigger,
  children,
  position = 'bottom',
  align = 'center',
  className = '',
  triggerClassName = '',
  closeOnClickOutside = true,
  closeOnEscape = true,
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Handle click outside
  useEffect(() => {
    if (!closeOnClickOutside || !isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnClickOutside]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape]);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Calculate position class
  const getPositionStyle = () => {
    const alignStyles: Record<string, Record<string, string>> = {
      top: {
        start: 'left: 0; transform: none;',
        center: 'left: 50%; transform: translateX(-50%);',
        end: 'right: 0; transform: none;',
      },
      bottom: {
        start: 'left: 0; transform: none;',
        center: 'left: 50%; transform: translateX(-50%);',
        end: 'right: 0; transform: none;',
      },
      left: {
        start: 'top: 0; transform: none;',
        center: 'top: 50%; transform: translateY(-50%);',
        end: 'bottom: 0; transform: none;',
      },
      right: {
        start: 'top: 0; transform: none;',
        center: 'top: 50%; transform: translateY(-50%);',
        end: 'bottom: 0; transform: none;',
      },
    };

    return alignStyles[position]?.[align] || '';
  };

  return (
    <div className="popover-wrapper">
      <button
        ref={triggerRef}
        className={`popover-trigger ${triggerClassName}`}
        onClick={toggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        type="button"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`popover popover-${position} ${className}`}
          style={{ cssText: getPositionStyle() }}
          role="dialog"
          aria-modal="false"
        >
          {typeof children === 'function' 
            ? (children as (props: { close: () => void }) => ReactNode)({ close })
            : children
          }
        </div>
      )}
    </div>
  );
}

// Popover parts for more control
interface PopoverHeaderProps {
  children: ReactNode;
  className?: string;
}

export function PopoverHeader({ children, className = '' }: PopoverHeaderProps) {
  return <div className={`popover-header ${className}`}>{children}</div>;
}

interface PopoverContentProps {
  children: ReactNode;
  className?: string;
}

export function PopoverContent({ children, className = '' }: PopoverContentProps) {
  return <div className={`popover-content ${className}`}>{children}</div>;
}

interface PopoverFooterProps {
  children: ReactNode;
  className?: string;
}

export function PopoverFooter({ children, className = '' }: PopoverFooterProps) {
  return <div className={`popover-footer ${className}`}>{children}</div>;
}

// Dropdown menu built on popover
interface DropdownMenuProps {
  trigger: ReactNode;
  items: Array<{
    label: ReactNode;
    onClick: () => void;
    icon?: ReactNode;
    danger?: boolean;
    disabled?: boolean;
    divider?: boolean;
  }>;
  position?: PopoverPosition;
  align?: 'start' | 'center' | 'end';
}

export function DropdownMenu({ trigger, items, position = 'bottom', align = 'end' }: DropdownMenuProps) {
  return (
    <Popover trigger={trigger} position={position} align={align}>
      {({ close }) => (
        <div style={{ minWidth: 180 }}>
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="dropdown-divider" />;
            }
            return (
              <button
                key={index}
                className={`dropdown-item ${item.danger ? 'dropdown-item-danger' : ''}`}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick();
                    close();
                  }
                }}
                disabled={item.disabled}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

