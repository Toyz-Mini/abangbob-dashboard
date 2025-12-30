'use client';

import { createContext, useContext, useEffect, useCallback, ReactNode, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category?: string;
}

interface KeyboardShortcutsContextType {
  registerShortcut: (id: string, shortcut: Shortcut) => void;
  unregisterShortcut: (id: string) => void;
  getShortcuts: () => Map<string, Shortcut>;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const router = useRouter();
  const shortcuts = useRef<Map<string, Shortcut>>(new Map());
  const [isEnabled, setEnabled] = useState(true);
  const lastKey = useRef<string | null>(null);
  const lastKeyTime = useRef<number>(0);

  const [showHelp, setShowHelp] = useState(false);

  // Register default shortcuts
  useEffect(() => {
    const defaultShortcuts: [string, Shortcut][] = [
      ['go-home', { key: 'h', action: () => router.push('/'), description: 'Go to Dashboard', category: 'Navigation' }],
      ['go-pos', { key: 'p', action: () => router.push('/pos'), description: 'Go to POS', category: 'Navigation' }],
      ['go-inventory', { key: 'i', action: () => router.push('/inventory'), description: 'Go to Inventory', category: 'Navigation' }],
      ['go-hr', { key: 'r', action: () => router.push('/hr'), description: 'Go to HR', category: 'Navigation' }],
      ['go-finance', { key: 'f', action: () => router.push('/finance'), description: 'Go to Finance', category: 'Navigation' }],
      ['go-settings', { key: 's', shift: true, action: () => router.push('/settings'), description: 'Go to Settings', category: 'Navigation' }],
      // Ctrl shortcuts
      ['ctrl-pos', { key: 'p', ctrl: true, action: () => router.push('/pos'), description: 'Open POS', category: 'Quick Actions' }],
      ['ctrl-inventory', { key: 'i', ctrl: true, action: () => router.push('/inventory'), description: 'Open Inventory', category: 'Quick Actions' }],
      // Help shortcut
      ['show-help', { key: '?', action: () => setShowHelp(true), description: 'Show keyboard shortcuts', category: 'Help' }],
    ];

    defaultShortcuts.forEach(([id, shortcut]) => {
      shortcuts.current.set(id, shortcut);
    });
  }, [router]);

  const registerShortcut = useCallback((id: string, shortcut: Shortcut) => {
    shortcuts.current.set(id, shortcut);
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    shortcuts.current.delete(id);
  }, []);

  const getShortcuts = useCallback(() => {
    return new Map(shortcuts.current);
  }, []);

  // Handle keyboard events
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();

      // Check for "g" prefix (go) shortcuts
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        lastKey.current = 'g';
        lastKeyTime.current = now;
        return;
      }

      // Check if this is a "g + key" combo
      if (lastKey.current === 'g' && now - lastKeyTime.current < 1000) {
        const goShortcuts: Record<string, string> = {
          'h': '/',           // g + h = go home
          'd': '/',           // g + d = go dashboard
          'p': '/pos',        // g + p = go pos
          'i': '/inventory',  // g + i = go inventory
          'k': '/kds',        // g + k = go kds
          't': '/tables',     // g + t = go tables
          'r': '/hr',         // g + r = go hr
          'f': '/finance',    // g + f = go finance
          'a': '/analytics',  // g + a = go analytics
          's': '/settings',   // g + s = go settings
          'n': '/notifications', // g + n = go notifications
        };

        if (goShortcuts[e.key]) {
          e.preventDefault();
          router.push(goShortcuts[e.key]);
          lastKey.current = null;
          return;
        }
      }

      // Reset last key
      lastKey.current = null;

      // Check for registered shortcuts
      for (const [, shortcut] of shortcuts.current) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (e.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }

      // Handle Escape key for closing modals (global)
      if (e.key === 'Escape') {
        // This will be handled by individual modals
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, router]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        registerShortcut,
        unregisterShortcut,
        getShortcuts,
        isEnabled,
        setEnabled,
        showHelp,
        setShowHelp,
      }}
    >
      {children}
      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div
          className="modal-overlay"
          onClick={() => setShowHelp(false)}
          style={{ zIndex: 10000 }}
        >
          <div
            className="modal keyboard-shortcuts-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Keyboard Shortcuts</h2>
              <button className="modal-close" onClick={() => setShowHelp(false)}>×</button>
            </div>
            <div className="modal-content">
              <KeyboardShortcutsHelp />
            </div>
          </div>
        </div>
      )}
    </KeyboardShortcutsContext.Provider>
  );
}

// Hook for using individual shortcuts
export function useShortcut(
  key: string,
  action: () => void,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean; description?: string } = {}
) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const id = useRef(`shortcut-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const shortcutId = id.current;
    registerShortcut(shortcutId, {
      key,
      ctrl: options.ctrl,
      shift: options.shift,
      alt: options.alt,
      action,
      description: options.description || `Shortcut: ${key}`,
    });

    return () => unregisterShortcut(shortcutId);
  }, [key, action, options.ctrl, options.shift, options.alt, options.description, registerShortcut, unregisterShortcut]);
}

// Keyboard shortcut help modal content
export function KeyboardShortcutsHelp() {
  const shortcuts = [
    {
      category: 'Navigation (g + key)', items: [
        { key: 'g h', description: 'Go to Dashboard' },
        { key: 'g p', description: 'Go to POS' },
        { key: 'g i', description: 'Go to Inventory' },
        { key: 'g k', description: 'Go to KDS' },
        { key: 'g t', description: 'Go to Tables' },
        { key: 'g r', description: 'Go to HR' },
        { key: 'g f', description: 'Go to Finance' },
        { key: 'g a', description: 'Go to Analytics' },
        { key: 'g s', description: 'Go to Settings' },
        { key: 'g n', description: 'Go to Notifications' },
      ]
    },
    {
      category: 'Actions', items: [
        { key: '⌘ K', description: 'Open Command Palette' },
        { key: 'Esc', description: 'Close modal/dialog' },
        { key: '?', description: 'Show keyboard shortcuts' },
      ]
    },
  ];

  return (
    <div style={{ minWidth: 400 }}>
      {shortcuts.map(group => (
        <div key={group.category} style={{ marginBottom: '1.5rem' }}>
          <h4 style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-secondary)',
            marginBottom: '0.75rem'
          }}>
            {group.category}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {group.items.map(item => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.375rem 0'
                }}
              >
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {item.description}
                </span>
                <kbd style={{
                  background: 'var(--gray-100)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid var(--border-color)',
                  fontFamily: 'inherit',
                }}>
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

