'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X, Undo2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  undoAction?: () => void;
  undoLabel?: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (options: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
}

interface ToastOptions {
  duration?: number;
  undoAction?: () => void;
  undoLabel?: string;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useEnhancedToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useEnhancedToast must be used within EnhancedToastProvider');
  }
  return context;
}

interface EnhancedToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
}

export function EnhancedToastProvider({ 
  children, 
  maxToasts = 5,
  defaultDuration = 5000 
}: EnhancedToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((options: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = options.duration || defaultDuration;

    setToasts(prev => {
      const newToasts = [...prev, { ...options, id, duration }];
      // Keep only the last maxToasts
      return newToasts.slice(-maxToasts);
    });

    // Set auto-dismiss timeout
    if (duration > 0) {
      const timeout = setTimeout(() => {
        removeToast(id);
      }, duration);
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, [defaultDuration, maxToasts, removeToast]);

  const success = useCallback((message: string, options?: ToastOptions) => {
    return addToast({ type: 'success', message, duration: options?.duration || defaultDuration, ...options });
  }, [addToast, defaultDuration]);

  const error = useCallback((message: string, options?: ToastOptions) => {
    return addToast({ type: 'error', message, duration: options?.duration || defaultDuration + 2000, ...options });
  }, [addToast, defaultDuration]);

  const warning = useCallback((message: string, options?: ToastOptions) => {
    return addToast({ type: 'warning', message, duration: options?.duration || defaultDuration, ...options });
  }, [addToast, defaultDuration]);

  const info = useCallback((message: string, options?: ToastOptions) => {
    return addToast({ type: 'info', message, duration: options?.duration || defaultDuration, ...options });
  }, [addToast, defaultDuration]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast icons
const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

// Toast container component
interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Individual toast item
interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = toastIcons[toast.type];

  const handleUndo = () => {
    toast.undoAction?.();
    onDismiss();
  };

  return (
    <div 
      className={`toast-item toast-${toast.type}`}
      role="alert"
      aria-live="polite"
    >
      <Icon size={20} className="toast-icon" />
      <span className="toast-message">{toast.message}</span>
      
      {toast.undoAction && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleUndo}
          style={{ 
            padding: '0.25rem 0.5rem', 
            fontSize: '0.75rem',
            color: 'var(--primary)',
            fontWeight: 600,
          }}
        >
          <Undo2 size={14} />
          {toast.undoLabel || 'Undo'}
        </button>
      )}
      
      <button 
        className="toast-close" 
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
      
      {/* Progress bar */}
      <div 
        className="toast-progress" 
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
}

// Convenience hook for undo-able actions
export function useUndoableAction() {
  const { success } = useEnhancedToast();
  const lastActionRef = useRef<{ undo: () => void } | null>(null);

  const executeWithUndo = useCallback((
    action: () => void,
    undoAction: () => void,
    message: string,
    undoLabel?: string
  ) => {
    // Execute the action
    action();
    
    // Store undo action
    lastActionRef.current = { undo: undoAction };

    // Show toast with undo option
    success(message, {
      undoAction: () => {
        undoAction();
        lastActionRef.current = null;
      },
      undoLabel,
      duration: 8000, // Longer duration for undo actions
    });
  }, [success]);

  return { executeWithUndo };
}




