'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Breadcrumb from './Breadcrumb';
import CommandPalette, { useCommandPalette } from './CommandPalette';
import BottomNav, { useBottomNav } from './BottomNav';
import StaffPortalNav from './StaffPortalNav';
import ManagerPortalNav from './ManagerPortalNav';
import Sheet from './Sheet';
import SessionMonitor from './SessionMonitor';
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
  Users,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

import { usePathname } from 'next/navigation';
import RouteGuard from './RouteGuard';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { canViewNavItem, type UserRole } from '@/lib/permissions';
import { processSyncQueue } from '@/lib/sync-queue';
import * as operations from '@/lib/supabase/operations';
import * as supabaseSync from '@/lib/supabase-sync';
import BrandHeader from '@/components/BrandHeader';

// Merge all sync operations into a single object for the sync queue processor
const ops = { ...operations, ...supabaseSync };

export default function MainLayout({ children }: { children: ReactNode }) {
  // Default to open for better UX on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { showToast } = useToast();
  const sidebarRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const { user, isStaffLoggedIn, currentStaff } = useAuth();

  // Determine role for mobile menu filtering
  // If user is accessing admin routes, treat as Admin for UI purposes
  const isUserAdmin = !!user || pathname?.startsWith('/admin');
  // improved role detection: check user.role from AuthContext as well
  const userRole: UserRole | null = (user?.role as UserRole) || (isStaffLoggedIn && currentStaff ? currentStaff.role as UserRole : null);

  // Logic to determine if Sidebar should be visible
  // Only show sidebar and topnav for Admin role
  const shouldShowSidebar = userRole === 'Admin';
  const shouldShowTopNav = userRole === 'Admin';

  // Debug role detection
  useEffect(() => {
    console.log('[MainLayout] Role Detection:', {
      hasUser: !!user,
      isStaffLoggedIn,
      path: pathname,
      determinedRole: userRole,
      shouldShowSidebar
    });
  }, [user, isStaffLoggedIn, pathname, userRole, shouldShowSidebar]);

  // Open sidebar on mount if desktop AND allowed
  useEffect(() => {
    if (window.innerWidth >= 768 && shouldShowSidebar) {
      setIsSidebarOpen(true);
    } else if (!shouldShowSidebar) {
      setIsSidebarOpen(false);
    }

    // Offline Sync Recovery
    const handleOnline = async () => {
      console.log('Online detected: Processing sync queue...');
      try {
        const { successCount, failCount, droppedCount } = await processSyncQueue(ops);
        if (successCount > 0) {
          showToast(`Berjaya sync ${successCount} data offline`, 'success');
        }
        if (droppedCount > 0) {
          showToast(`${droppedCount} data gagal disinkronasi dan telah dibatalkan (Max Retries).`, 'warning');
        }
        if (failCount > 0) {
          showToast(`Gagal sync ${failCount} data. Akan cuba lagi nanti.`, 'error');
        }
      } catch (err) {
        console.error('Sync queue error:', err);
      }
    };

    window.addEventListener('online', handleOnline);

    // Initial check
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      // Small delay to allow app to hydrate
      setTimeout(() => {
        handleOnline();
      }, 5000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [shouldShowSidebar, showToast]);

  // Command palette state
  const commandPalette = useCommandPalette();

  // Bottom nav more menu
  const bottomNav = useBottomNav();

  // Auto-close when clicking outside sidebar (MOBILE ONLY)
  useEffect(() => {
    // Only apply click-outside logic on mobile
    if (window.innerWidth >= 768) return;

    if (!isSidebarOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't close if clicking inside sidebar
      if (sidebarRef.current?.contains(target)) {
        return;
      }

      // Close sidebar when clicking outside (mobile overlay)
      setIsSidebarOpen(false);
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
        // We don't auto-open here to respect user preference, but generally desktop starts open
      } else if (isSidebarOpen) {
        document.body.classList.add('mobile-sidebar-open');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);


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
  // Determine items for the "More" menu
  // If Admin: Show items not in the bottom nav (Inventory, HR, Settings, etc.)
  // If Staff: Show items from staff portal logic
  const mobileMenuItems = userRole === 'Admin' ? [
    { href: '/inventory', label: 'Inventori', icon: Package, color: 'var(--primary)' },
    { href: '/hr', label: 'HR', icon: Users, color: 'var(--text-primary)' },
    { href: '/pos', label: 'POS', icon: ShoppingCart, color: 'var(--secondary)' },
    { href: '/customers', label: 'Pelanggan', icon: UserCheck, color: 'var(--primary)' },
    { href: '/recipes', label: 'Resipi', icon: ChefHat, color: 'var(--secondary)' },
    { href: '/suppliers', label: 'Pembekal', icon: Boxes, color: 'var(--text-primary)' },
    { href: '/production', label: 'Produksi', icon: Factory, color: 'var(--warning)' },
    { href: '/equipment', label: 'Equipment', icon: Factory, color: 'var(--info)' },
    { href: '/delivery', label: 'Delivery', icon: Truck, color: 'var(--primary)' },
    { href: '/kds', label: 'KDS', icon: Tv, color: 'var(--text-primary)' },
    { href: '/audit-log', label: 'Audit', icon: FileText, color: 'var(--text-secondary)' },
    { href: '/notifications', label: 'Notifikasi', icon: Bell, color: 'var(--warning)' },
    { href: '/settings', label: 'Tetapan', icon: Settings, color: 'var(--text-secondary)' },
    { href: '/help', label: 'Bantuan', icon: HelpCircle, color: 'var(--info)' },
  ] : [
    { href: '/staff-portal', label: 'Portal', icon: LayoutDashboard, color: 'var(--primary)' },
    { href: '/delivery', label: 'Delivery', icon: Truck, color: 'var(--primary)' },
    { href: '/production', label: 'Produksi', icon: Factory, color: 'var(--secondary)' },
    { href: '/kds', label: 'KDS', icon: Tv, color: 'var(--text-primary)' },
    { href: '/notifications', label: 'Notifikasi', icon: Bell, color: 'var(--warning)' },
    { href: '/settings', label: 'Tetapan', icon: Settings, color: 'var(--text-secondary)' },
  ].filter(item => canViewNavItem(userRole, item.href));

  // Determine Bottom Nav Items based on Role
  const bottomNavItems = userRole === 'Admin' ? [
    { href: '/admin/towkay-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/menu-management', label: 'Menu', icon: BookOpen },
    { href: '/finance', label: 'Kewangan', icon: DollarSign },
    { href: '/analytics', label: 'Analitik', icon: BarChart3 },
  ] : [
    { href: userRole === 'Staff' ? '/staff-portal' : '/', label: 'Home', icon: LayoutDashboard },
    { href: '/pos', label: 'POS', icon: ShoppingCart },
    { href: '/inventory', label: 'Inventori', icon: Package },
    { href: '/hr', label: 'HR', icon: Users },
  ];

  // Filter based on permissions (though Admin usually sees all)
  const filteredBottomNavItems = bottomNavItems.filter(item => canViewNavItem(userRole, item.href));

  // TopNav visibility already handled by shouldShowTopNav

  return (
    <RouteGuard>
      {/* Global Brand Header */}
      <BrandHeader />

      <div className="main-container" ref={containerRef}>
        {/* Skip to main content link for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {shouldShowSidebar && (
          <div className="desktop-only">
            <Sidebar
              ref={sidebarRef}
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen(prev => !prev)}
              onNavClick={handleNavClick}
            />
          </div>
        )}

        {/* Floating Sidebar Toggle (Desktop) */}
        {shouldShowSidebar && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="desktop-only"
            style={{
              position: 'fixed',
              left: isSidebarOpen ? '280px' : '80px',
              top: '50%',
              transform: 'translateY(-50%) translateX(-50%)',
              zIndex: 100, // Above sidebar content
              width: '24px',
              height: '48px', // Pill shape
              borderRadius: '0 12px 12px 0',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
              opacity: 0.8,
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            title={isSidebarOpen ? "Collapse" : "Expand"}
          >
            {isSidebarOpen ? (
              <ChevronLeft size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        )}

        {shouldShowTopNav && <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />}
        <main
          id="main-content"
          className={`main-content page-enter ${shouldShowSidebar && isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
          style={{
            paddingTop: shouldShowTopNav ? undefined : '1rem',
            // If sidebar is hidden, we might need to reset margin-left logic handled by CSS classes?
            // "sidebar-closed" usually implies small margin. "sidebar-open" large.
            // If sidebar is hidden completely (shouldShowSidebar=false), we want full width.
            // Classes handle open/closed. We might need a "sidebar-hidden" class or override.
            marginLeft: shouldShowSidebar ? undefined : 0,
            width: shouldShowSidebar ? undefined : '100%'
          }}
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
        {pathname?.startsWith('/staff-portal') ? (
          // Page handles its own nav (already inside /staff-portal/page.tsx)
          null
        ) : pathname?.startsWith('/manager-portal') ? (
          // Manager Portal handles its own nav (already inside /manager-portal/page.tsx)
          null
        ) : userRole === 'Admin' ? (
          // Admin gets Admin/Manager Nav
          <BottomNav
            items={filteredBottomNavItems}
            showMore={true}
            onMoreClick={bottomNav.openMore}
          />
        ) : userRole === 'Manager' ? (
          // IF Manager is browsing other pages, show Manager Nav
          <ManagerPortalNav />
        ) : isStaffLoggedIn ? (
          // If staff is browsing other pages (like POS/History), show Staff Nav
          <StaffPortalNav />
        ) : (
          // Otherwise show Admin/Manager Nav (fallback)
          <BottomNav
            items={filteredBottomNavItems}
            showMore={true}
            onMoreClick={bottomNav.openMore}
          />
        )}

        {/* More Menu Sheet (Mobile) */}
        <Sheet
          isOpen={bottomNav.isMoreOpen}
          onClose={bottomNav.closeMore}
          title={userRole === 'Admin' ? "Menu" : "Menu Staff"}
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

        {/* Session Timeout Monitor */}
        <SessionMonitor timeoutMinutes={15} warningSeconds={60} />
      </div>
    </RouteGuard>
  );
}
