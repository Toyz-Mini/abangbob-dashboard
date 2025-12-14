'use client';

import { useEffect, useCallback, ReactNode, useRef } from 'react';
import { X } from 'lucide-react';

type SheetPosition = 'bottom' | 'right' | 'left' | 'top';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  position?: SheetPosition;
  showHandle?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
  className?: string;
}

export default function Sheet({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom',
  showHandle = true,
  showCloseButton = true,
  footer,
  className = '',
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  // Touch handling for swipe to dismiss (bottom sheet)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (position !== 'bottom') return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (position !== 'bottom' || !sheetRef.current) return;
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (position !== 'bottom' || !sheetRef.current) return;
    const diff = currentY.current - startY.current;
    
    if (diff > 100) {
      onClose();
    }
    
    sheetRef.current.style.transform = '';
    startY.current = 0;
    currentY.current = 0;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="sheet-overlay" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`sheet sheet-${position} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle for bottom sheet */}
        {showHandle && position === 'bottom' && (
          <div className="sheet-handle" aria-hidden="true" />
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="sheet-header">
            {title && <h2 id="sheet-title" className="sheet-title">{title}</h2>}
            {showCloseButton && (
              <button
                className="sheet-close"
                onClick={onClose}
                aria-label="Close sheet"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="sheet-content">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="sheet-footer">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

// Action Sheet variant
interface ActionSheetAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  actions,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      showCloseButton={false}
      showHandle={true}
    >
      {title && (
        <div style={{ 
          textAlign: 'center', 
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }}>
          {title}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {actions.map((action, index) => (
          <button
            key={index}
            className={`btn ${action.destructive ? 'btn-danger' : 'btn-ghost'}`}
            style={{ 
              width: '100%', 
              justifyContent: 'center',
              fontSize: '1rem',
              padding: '1rem',
            }}
            onClick={() => {
              action.onClick();
              onClose();
            }}
            disabled={action.disabled}
          >
            {action.icon}
            {action.label}
          </button>
        ))}

        <div style={{ 
          height: 8, 
          background: 'var(--gray-100)', 
          marginTop: '0.5rem',
          marginBottom: '0.5rem',
          marginLeft: '-1.25rem',
          marginRight: '-1.25rem',
        }} />

        <button
          className="btn btn-ghost"
          style={{ 
            width: '100%', 
            justifyContent: 'center',
            fontSize: '1rem',
            padding: '1rem',
            fontWeight: 600,
          }}
          onClick={onClose}
        >
          {cancelLabel}
        </button>
      </div>
    </Sheet>
  );
}




