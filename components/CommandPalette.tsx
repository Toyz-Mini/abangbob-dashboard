'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Factory,
  Truck,
  DollarSign,
  BarChart3,
  UserCheck,
  ChefHat,
  Tag,
  Bell,
  Settings,
  Monitor,
  LayoutGrid,
  FileText,
  Clock,
  Plus,
  ArrowRight,
  Command,
  type LucideIcon,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  action: () => void;
  keywords?: string[];
  category: 'navigation' | 'action' | 'recent';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Define all commands
  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'nav-dashboard', label: 'Dashboard', description: 'Go to main dashboard', icon: LayoutDashboard, action: () => router.push('/'), keywords: ['home', 'main', 'utama'], category: 'navigation' },
    { id: 'nav-pos', label: 'POS System', description: 'Open point of sale', icon: ShoppingCart, action: () => router.push('/pos'), keywords: ['sell', 'order', 'jual', 'pesanan'], category: 'navigation' },
    { id: 'nav-kds', label: 'Kitchen Display', description: 'View kitchen orders', icon: Monitor, action: () => router.push('/kds'), keywords: ['kitchen', 'dapur', 'cook'], category: 'navigation' },
    { id: 'nav-tables', label: 'Table Management', description: 'Manage restaurant tables', icon: LayoutGrid, action: () => router.push('/tables'), keywords: ['meja', 'seat'], category: 'navigation' },
    { id: 'nav-delivery', label: 'Delivery Hub', description: 'Manage deliveries', icon: Truck, action: () => router.push('/delivery'), keywords: ['penghantaran', 'order'], category: 'navigation' },
    { id: 'nav-inventory', label: 'Inventory', description: 'View and manage stock', icon: Package, action: () => router.push('/inventory'), keywords: ['stok', 'stock', 'inventori'], category: 'navigation' },
    { id: 'nav-production', label: 'Production', description: 'Production management', icon: Factory, action: () => router.push('/production'), keywords: ['produksi', 'manufacturing'], category: 'navigation' },
    { id: 'nav-recipes', label: 'Recipes', description: 'Recipe management', icon: ChefHat, action: () => router.push('/recipes'), keywords: ['resepi', 'masak'], category: 'navigation' },
    { id: 'nav-hr', label: 'HR & Staff', description: 'Human resources', icon: Users, action: () => router.push('/hr'), keywords: ['staf', 'pekerja', 'employee'], category: 'navigation' },
    { id: 'nav-timeclock', label: 'Time Clock', description: 'Staff clock in/out', icon: Clock, action: () => router.push('/hr/timeclock'), keywords: ['clock', 'attendance', 'kehadiran'], category: 'navigation' },
    { id: 'nav-finance', label: 'Finance', description: 'Financial management', icon: DollarSign, action: () => router.push('/finance'), keywords: ['kewangan', 'money', 'duit'], category: 'navigation' },
    { id: 'nav-customers', label: 'Customers', description: 'Customer management', icon: UserCheck, action: () => router.push('/customers'), keywords: ['pelanggan', 'client'], category: 'navigation' },
    { id: 'nav-promotions', label: 'Promotions', description: 'Manage promotions', icon: Tag, action: () => router.push('/promotions'), keywords: ['promosi', 'discount', 'diskaun'], category: 'navigation' },
    { id: 'nav-analytics', label: 'Analytics', description: 'View analytics', icon: BarChart3, action: () => router.push('/analytics'), keywords: ['report', 'laporan', 'data'], category: 'navigation' },
    { id: 'nav-audit', label: 'Audit Log', description: 'View audit history', icon: FileText, action: () => router.push('/audit-log'), keywords: ['log', 'history', 'sejarah'], category: 'navigation' },
    { id: 'nav-notifications', label: 'Notifications', description: 'View notifications', icon: Bell, action: () => router.push('/notifications'), keywords: ['notifikasi', 'alert'], category: 'navigation' },
    { id: 'nav-settings', label: 'Settings', description: 'App settings', icon: Settings, action: () => router.push('/settings'), keywords: ['tetapan', 'config'], category: 'navigation' },
    // Actions
    { id: 'action-new-order', label: 'New Order', description: 'Create a new order', icon: Plus, action: () => router.push('/pos'), keywords: ['pesanan baru', 'add order'], category: 'action' },
    { id: 'action-add-staff', label: 'Add Staff', description: 'Add new staff member', icon: Plus, action: () => router.push('/hr/staff/new'), keywords: ['tambah staf', 'new employee'], category: 'action' },
  ], [router]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return commands;
    }

    const searchTerms = query.toLowerCase().split(' ');
    
    return commands.filter(command => {
      const searchText = [
        command.label,
        command.description || '',
        ...(command.keywords || [])
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchText.includes(term));
    }).sort((a, b) => {
      // Prioritize label matches
      const aLabelMatch = a.label.toLowerCase().includes(query.toLowerCase());
      const bLabelMatch = b.label.toLowerCase().includes(query.toLowerCase());
      if (aLabelMatch && !bLabelMatch) return -1;
      if (!aLabelMatch && bLabelMatch) return 1;
      return 0;
    });
  }, [query, commands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      action: [],
      recent: [],
    };

    filteredCommands.forEach(cmd => {
      groups[cmd.category]?.push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleItemClick = (command: CommandItem) => {
    command.action();
    onClose();
  };

  let itemIndex = 0;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div 
        className="command-palette"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="command-palette-header">
          <Search size={20} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <kbd className="command-palette-shortcut">ESC</kbd>
        </div>

        {/* Results */}
        <div className="command-palette-content" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">
              <p>No results found for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <>
              {/* Navigation Group */}
              {groupedCommands.navigation.length > 0 && (
                <div className="command-palette-group">
                  <div className="command-palette-group-title">Navigation</div>
                  {groupedCommands.navigation.map(command => {
                    const currentIndex = itemIndex++;
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.id}
                        className={`command-palette-item ${currentIndex === selectedIndex ? 'selected' : ''}`}
                        data-index={currentIndex}
                        onClick={() => handleItemClick(command)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <Icon size={18} className="command-palette-item-icon" />
                        <div className="command-palette-item-content">
                          <span className="command-palette-item-label">{command.label}</span>
                          {command.description && (
                            <span className="command-palette-item-description">{command.description}</span>
                          )}
                        </div>
                        <ArrowRight size={14} className="command-palette-item-arrow" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Actions Group */}
              {groupedCommands.action.length > 0 && (
                <div className="command-palette-group">
                  <div className="command-palette-group-title">Actions</div>
                  {groupedCommands.action.map(command => {
                    const currentIndex = itemIndex++;
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.id}
                        className={`command-palette-item ${currentIndex === selectedIndex ? 'selected' : ''}`}
                        data-index={currentIndex}
                        onClick={() => handleItemClick(command)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <Icon size={18} className="command-palette-item-icon" />
                        <div className="command-palette-item-content">
                          <span className="command-palette-item-label">{command.label}</span>
                          {command.description && (
                            <span className="command-palette-item-description">{command.description}</span>
                          )}
                        </div>
                        <ArrowRight size={14} className="command-palette-item-arrow" />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="command-palette-footer">
          <div className="command-palette-hint">
            <kbd>↑↓</kbd> to navigate
          </div>
          <div className="command-palette-hint">
            <kbd>↵</kbd> to select
          </div>
          <div className="command-palette-hint">
            <kbd>esc</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}

// Helper component for showing command palette trigger hint
export function CommandPaletteTrigger({ className = '' }: { className?: string }) {
  return (
    <button
      className={`command-palette-trigger ${className}`}
      onClick={() => {
        // Dispatch a custom event that the command palette will listen to
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
      }}
    >
      <Command size={14} />
      <span>Command</span>
      <kbd>⌘K</kbd>
    </button>
  );
}

