'use client';

import { useState, ReactNode } from 'react';
import { Plus, X } from 'lucide-react';

interface FABAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  onClick?: () => void;
  icon?: ReactNode;
  label?: string;
  actions?: FABAction[];
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  extended?: boolean;
  className?: string;
}

export default function FloatingActionButton({
  onClick,
  icon = <Plus size={24} />,
  label,
  actions,
  position = 'bottom-right',
  extended = false,
  className = '',
}: FloatingActionButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleClick = () => {
    if (actions && actions.length > 0) {
      setIsMenuOpen(prev => !prev);
    } else {
      onClick?.();
    }
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'bottom-left':
        return { left: '1.5rem', right: 'auto' };
      case 'bottom-center':
        return { left: '50%', right: 'auto', transform: 'translateX(-50%)' };
      default:
        return {};
    }
  };

  return (
    <>
      {/* FAB Menu */}
      {actions && actions.length > 0 && (
        <div 
          className={`fab-menu ${isMenuOpen ? 'open' : ''}`}
          style={getPositionStyle()}
        >
          {actions.map((action, index) => (
            <div key={index} className="fab-menu-item">
              <span className="fab-menu-label">{action.label}</span>
              <button
                className="fab-menu-btn"
                onClick={() => {
                  action.onClick();
                  setIsMenuOpen(false);
                }}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        className={`fab ${extended ? 'fab-extended' : ''} ${className}`}
        onClick={handleClick}
        style={getPositionStyle()}
        aria-label={label || 'Floating action button'}
        aria-expanded={actions ? isMenuOpen : undefined}
      >
        {actions && isMenuOpen ? (
          <X size={24} />
        ) : (
          <>
            {icon}
            {extended && label && <span>{label}</span>}
          </>
        )}
      </button>

      {/* Backdrop for menu */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 88,
          }}
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

// Simple FAB for common actions
interface SimpleFABProps {
  href?: string;
  onClick?: () => void;
  label: string;
  icon?: ReactNode;
}

export function SimpleFAB({ href, onClick, label, icon = <Plus size={24} /> }: SimpleFABProps) {
  if (href) {
    return (
      <a href={href} className="fab fab-extended" aria-label={label}>
        {icon}
        <span>{label}</span>
      </a>
    );
  }

  return (
    <button className="fab fab-extended" onClick={onClick} aria-label={label}>
      {icon}
      <span>{label}</span>
    </button>
  );
}


