'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Breadcrumb from './Breadcrumb';
import CommandPalette, { useCommandPalette } from './CommandPalette';
import BottomNav, { useBottomNav } from './BottomNav';
import Sheet from './Sheet';
// import { useTranslation } from '@/lib/contexts/LanguageContext'; // Removed as t is not strictly needed for basic labels or we can add it properly
import {
  Truck,
  Factory,
  ChefHat,
  Boxes,
  DollarSign,
  UserCheck,
  BarChart3,
  Settings,
  FileText,
  Bell,
  HelpCircle,
  Tv
} from 'lucide-react';

export default function MainLayout({ children }: { children: ReactNode }) {
  // Default to closed to prevent flash on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);


  // Open sidebar on mount if desktop
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Command palette state
  const commandPalette = useCommandPalette();

  // Bottom nav more menu
  const bottomNav = useBottomNav();

  // Auto-close when clicking outside sidebar
  useEffect(() => {
    if (!isSidebarOpen) return; // Don't listen if already closed

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't close if clicking inside sidebar
      if (sidebarRef.current?.contains(target)) {
        return;
      }

      // Close sidebar when clicking outside (only on desktop)
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      } else {
        // Also close on mobile if clicking outside (on overlay)
        setIsSidebarOpen(false);
      }
    };

    // Add small delay to prevent immediate close after render
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isSidebarOpen]);

  // Handle click on sidebar to expand if collapsed
  const handleSidebarClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent closing
    e.stopPropagation();
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
    }
  };

  // Toggle body class for mobile overlay
  useEffect(() => {
    if (window.innerWidth < 768 && isSidebarOpen) {
      document.body.classList.add('mobile-sidebar-open');
    } else {
      document.body.classList.remove('mobile-sidebar-open');
    }

    // Also handle resize
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        document.body.classList.remove('mobile-sidebar-open');
        if (!isSidebarOpen) setIsSidebarOpen(true); // Auto open on desktop
      } else if (isSidebarOpen) {
        document.body.classList.add('mobile-sidebar-open');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Expand sidebar on hover when collapsed
  const handleSidebarMouseEnter = () => {
    if (!isSidebarOpen && window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  };



  // Handle nav link click - close sidebar on mobile
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Ripple effect handler for buttons
  const handleRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    button.style.setProperty('--ripple-x', `${x}%`);
    button.style.setProperty('--ripple-y', `${y}%`);
    button.classList.add('ripple');

    setTimeout(() => {
      button.classList.remove('ripple');
    }, 600);
  }, []);

  // Add ripple effect to all buttons
  useEffect(() => {
    const addRippleToButtons = () => {
      const buttons = document.querySelectorAll('.btn, .icon-btn');
      buttons.forEach(button => {
        const handler = (e: Event) => handleRipple(e as unknown as React.MouseEvent<HTMLElement>);
        button.addEventListener('mousedown', handler);
        // Store handler for cleanup
        (button as any)._rippleHandler = handler;
      });
    };

    // Initial setup
    addRippleToButtons();

    // Use MutationObserver to handle dynamically added buttons
    const observer = new MutationObserver(() => {
      addRippleToButtons();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const buttons = document.querySelectorAll('.btn, .icon-btn');
      buttons.forEach(button => {
        if ((button as any)._rippleHandler) {
          button.removeEventListener('mousedown', (button as any)._rippleHandler);
        }
      });
    };
  }, [handleRipple]);

  return (
    <div className="main-container" ref={containerRef}>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Sidebar
        ref={sidebarRef}
        isOpen={isSidebarOpen}
        onMouseEnter={handleSidebarMouseEnter}
        onClick={handleSidebarClick}
        onNavClick={handleNavClick}
      />
      <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main
        id="main-content"
        className={`main-content page-enter ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
      >
        <Breadcrumb />
        {children}
      </main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
      />

      {/* Bottom Navigation (Mobile) */}
      <BottomNav
        showMore={true}
        onMoreClick={bottomNav.openMore}
      />

      {/* More Menu Sheet (Mobile) */}
      <Sheet
        isOpen={bottomNav.isMoreOpen}
        onClose={bottomNav.closeMore}
        title="Menu Tambahan"
        position="bottom"
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          padding: '0.5rem 0'
        }}>
          {[
            { href: '/delivery', label: 'Delivery', icon: Truck, color: '#3b82f6' },
            { href: '/production', label: 'Produksi', icon: Factory, color: '#f59e0b' },
            { href: '/kds', label: 'KDS', icon: Tv, color: '#10b981' },
            { href: '/recipes', label: 'Resipi', icon: ChefHat, color: '#ec4899' },
            { href: '/suppliers', label: 'Stok', icon: Boxes, color: '#8b5cf6' },
            { href: '/finance', label: 'Kewangan', icon: DollarSign, color: '#059669' },
            { href: '/customers', label: 'Pelanggan', icon: UserCheck, color: '#6366f1' },
            { href: '/analytics', label: 'Analitik', icon: BarChart3, color: '#ef4444' },
            { href: '/audit-log', label: 'Audit', icon: FileText, color: '#64748b' },
            { href: '/notifications', label: 'Notifikasi', icon: Bell, color: '#eab308' },
            { href: '/settings', label: 'Tetapan', icon: Settings, color: '#4b5563' },
            { href: '/help', label: 'Bantuan', icon: HelpCircle, color: '#06b6d4' },
          ]
            .map((item, index) => (
              <a
                key={index}
                href={item.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                }}
                onClick={bottomNav.closeMore}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '16px',
                  background: `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.color,
                  transition: 'transform 0.2s',
                }}
                  className="icon-btn-hover"
                >
                  <item.icon size={24} />
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, textAlign: 'center' }}>
                  {item.label}
                </span>
              </a>
            ))}
        </div>
      </Sheet>
    </div>
  );
}
