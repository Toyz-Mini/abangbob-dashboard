'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, ShoppingCart, History, ChefHat, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PosLayoutProps {
    children: ReactNode;
    showHeader?: boolean;
}

export default function PosLayout({ children, showHeader = true }: PosLayoutProps) {
    const { currentStaff, logoutStaff } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        try {
            logoutStaff();
            window.location.href = '/pos-login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const navItems = [
        { href: '/pos', icon: ShoppingCart, label: 'POS' },
        { href: '/order-history', icon: History, label: 'Orders' },
        { href: '/kds', icon: ChefHat, label: 'Kitchen' },
    ];

    const isActive = (href: string) => {
        if (href === '/pos') return pathname === '/pos';
        return pathname?.startsWith(href);
    };

    return (
        <div className="pos-layout">
            {/* Compact Header */}
            {showHeader && (
                <header className="pos-header">
                    <div className="pos-header-left">
                        <div className="pos-header-avatar">
                            {currentStaff?.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div className="pos-header-info">
                            <div className="pos-header-name">{currentStaff?.name || 'Cashier'}</div>
                            <div className="pos-header-role">POS Mode</div>
                        </div>
                    </div>
                    <button type="button" className="pos-logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                    </button>
                </header>
            )}

            {/* Main Content */}
            <main className="pos-main">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="pos-bottom-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`pos-nav-item ${active ? 'active' : ''}`}
                        >
                            <Icon size={24} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <style jsx>{`
        .pos-layout {
          min-height: 100vh;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
        }

        .pos-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          padding-top: 48px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
        }

        .pos-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .pos-header-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
        }

        .pos-header-info {
          display: flex;
          flex-direction: column;
        }

        .pos-header-name {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .pos-header-role {
          font-size: 0.75rem;
          opacity: 0.8;
          color: #4CAF50;
        }

        .pos-logout-btn {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pos-logout-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .pos-main {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 80px;
        }

        .pos-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-around;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 0.75rem 0;
          padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
          z-index: 100;
        }

        .pos-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 1.5rem;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 0.7rem;
          font-weight: 500;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .pos-nav-item.active {
          color: #4CAF50;
          background: rgba(76, 175, 80, 0.15);
        }

        .pos-nav-item:hover:not(.active) {
          color: rgba(255, 255, 255, 0.9);
        }
      `}</style>
        </div>
    );
}
