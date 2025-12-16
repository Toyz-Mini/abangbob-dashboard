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
  Tv,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users
} from 'lucide-react';

import RouteGuard from './RouteGuard';
import { useAuth } from '@/lib/contexts/AuthContext';
import { canViewNavItem, type UserRole } from '@/lib/permissions';

export default function MainLayout({ children }: { children: ReactNode }) {
  // Default to closed to prevent flash on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { user, isStaffLoggedIn, currentStaff } = useAuth();

  // Determine role for mobile menu filtering
  const userRole: UserRole | null = user ? 'Admin' : (isStaffLoggedIn && currentStaff ? currentStaff.role : null);

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

  // Mobile Menu Items - Standardized Brand Colors
  const mobileMenuItems = [
    { href: '/delivery', label: 'Delivery', icon: Truck, color: 'var(--primary)' }, // Red
    { href: '/production', label: 'Produksi', icon: Factory, color: 'var(--secondary)' }, // Gold
    { href: '/kds', label: 'KDS', icon: Tv, color: 'var(--text-primary)' }, // Dark
    { href: '/recipes', label: 'Resipi', icon: ChefHat, color: 'var(--primary)' },
    { href: '/suppliers', label: 'Stok', icon: Boxes, color: 'var(--secondary)' },
    { href: '/finance', label: 'Kewangan', icon: DollarSign, color: 'var(--text-primary)' },
    { href: '/customers', label: 'Pelanggan', icon: UserCheck, color: 'var(--primary)' },
    { href: '/analytics', label: 'Analitik', icon: BarChart3, color: 'var(--secondary)' },
    { href: '/audit-log', label: 'Audit', icon: FileText, color: 'var(--text-secondary)' }, // Grey
    { href: '/notifications', label: 'Notifikasi', icon: Bell, color: 'var(--warning)' }, // Keep warning for alerts
    { href: '/settings', label: 'Tetapan', icon: Settings, color: 'var(--text-secondary)' },
    { href: '/help', label: 'Bantuan', icon: HelpCircle, color: 'var(--info)' }, // Keep info for help
  ].filter(item => canViewNavItem(userRole, item.href));

  // Determine Bottom Nav Items based on Role
  const bottomNavItems = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/pos', label: 'POS', icon: ShoppingCart },
    { href: '/inventory', label: 'Inventori', icon: Package },
    { href: '/hr', label: 'HR', icon: Users },
  ].filter(item => canViewNavItem(userRole, item.href));

  return (
    <RouteGuard>
      <div className="main-container" ref={containerRef}>
        {/* Skip to main content link for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <div className="desktop-only">
          <Sidebar
            ref={sidebarRef}
            isOpen={isSidebarOpen}
            onMouseEnter={handleSidebarMouseEnter}
            onClick={handleSidebarClick}
            onNavClick={handleNavClick}
          />
        </div>
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
          items={bottomNavItems}
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
            {mobileMenuItems.map((item, index) => (
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
    </RouteGuard>
  );
}
