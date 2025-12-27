'use client';

import { ReactNode, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  ChefHat,
  History,
  ClipboardList,
  Boxes,
} from 'lucide-react';
import { useState } from 'react';

interface ManagerLayoutProps {
  children: ReactNode;
}

export default function ManagerLayout({ children }: ManagerLayoutProps) {
  const { currentStaff, user, logoutStaff, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  // Manager-specific navigation - no Finance/sensitive data
  const navItems = useMemo(() => [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/pos', icon: ShoppingCart, label: 'POS' },
    { href: '/order-history', icon: History, label: 'Orders' },
    { href: '/kds', icon: ChefHat, label: 'Kitchen' },
    { href: '/menu-management', icon: ClipboardList, label: 'Menu' },
    { href: '/inventory', icon: Package, label: 'Inventory' },
    { href: '/production', icon: Boxes, label: 'Production' },
    { href: '/hr', icon: Users, label: 'HR' },
    { href: '/analytics', icon: BarChart3, label: 'Reports' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ], []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const userName = currentStaff?.name || user?.email?.split('@')[0] || 'Manager';

  return (
    <div className="manager-layout">
      {/* Mobile Header */}
      <header className="manager-header">
        <button
          type="button"
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="header-title">
          <span className="app-name">AbangBob</span>
          <span className="role-badge">Manager</span>
        </div>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`manager-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="user-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{userName}</div>
            <div className="user-role">Outlet Manager</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="logout-full" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="manager-main">
        {children}
      </main>

      <style jsx>{`
        .manager-layout {
          min-height: 100vh;
          background: #f5f5f5;
        }

        .manager-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          padding-top: 48px;
          background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
          color: white;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        .menu-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .app-name {
          font-weight: 700;
          font-size: 1.1rem;
        }

        .role-badge {
          background: #3b82f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .logout-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
        }

        .manager-sidebar {
          position: fixed;
          top: 0;
          left: -280px;
          width: 280px;
          height: 100vh;
          background: linear-gradient(180deg, #1e3a5f 0%, #0d1b2a 100%);
          color: white;
          padding: 1rem;
          padding-top: 48px;
          z-index: 150;
          transition: left 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .manager-sidebar.open {
          left: 0;
        }

        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 140;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 1rem;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          background: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
        }

        .user-name {
          font-weight: 600;
        }

        .user-role {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-item.active {
          background: #3b82f6;
          color: white;
        }

        .sidebar-footer {
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logout-full {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .manager-main {
          margin-top: 100px;
          padding: 1rem;
          min-height: calc(100vh - 100px);
        }

        @media (min-width: 1024px) {
          .manager-header {
            display: none;
          }

          .manager-sidebar {
            left: 0;
            padding-top: 1rem;
          }

          .sidebar-overlay {
            display: none;
          }

          .manager-main {
            margin-top: 0;
            margin-left: 280px;
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
