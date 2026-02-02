'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = '500px' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-gray-800 z-10 shrink-0">
          <div className="flex flex-col">
            <div className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{title}</div>
            {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-0 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
