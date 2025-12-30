'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Calendar,
    CheckSquare,
    Plane,
    Home,
    Monitor,
    History,
    Users,
    DollarSign,
    Package,
    MoreHorizontal,
    LayoutDashboard,
    ShoppingCart,
    Tv,
    LogOut,
    User
} from 'lucide-react';
import { useState } from 'react';
import Sheet from './Sheet';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ManagerPortalNavProps {
    currentPage?: string;
    pendingCount?: number;
}

export default function ManagerPortalNav({ currentPage, pendingCount = 0 }: ManagerPortalNavProps) {
    const pathname = usePathname();
    const { logoutStaff, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error('[ManagerPortalNav] Logout error:', error);
        }
    };

    const navItems = [
        {
            href: '/manager-portal',
            icon: Home,
            label: 'Home',
            id: 'home'
        },
        {
            href: '/staff-portal/schedule',
            icon: Calendar,
            label: 'Jadual',
            id: 'schedule'
        },
        {
            href: '/pos',
            icon: ShoppingCart,
            label: 'POS',
            id: 'pos'
        },
        {
            href: '/staff-portal/leave',
            icon: Plane,
            label: 'Cuti',
            id: 'leave'
        },
    ];

    const isActive = (href: string, id: string) => {
        if (currentPage) {
            return id === currentPage;
        }
        if (href === '/manager-portal') {
            return pathname === '/manager-portal';
        }
        return pathname?.startsWith(href);
    };

    const managementItems = [
        {
            href: '/staff-portal/profile',
            label: 'Profil',
            icon: User,
            color: 'var(--primary)'
        },
        {
            href: '/hr',
            label: 'HR Portal',
            icon: Users,
            color: 'var(--success)'
        },
        {
            href: '/hr/approvals',
            label: 'Kelulusan',
            icon: CheckSquare,
            color: 'var(--warning)'
        },
        {
            href: '/finance',
            label: 'Kewangan',
            icon: DollarSign,
            color: 'var(--info)'
        },
        {
            href: '/inventory',
            label: 'Stok',
            icon: Package,
            color: 'var(--primary)'
        },
        {
            href: '/kds',
            label: 'Dapur KDS',
            icon: Monitor,
            color: 'var(--error)'
        },
        {
            href: '/order-display',
            label: 'Display',
            icon: Tv,
            color: 'var(--text-secondary)'
        },
        {
            href: '/order-history',
            label: 'Sejarah',
            icon: History,
            color: 'var(--text-secondary)'
        },
        {
            href: '/',
            label: 'Admin Dash',
            icon: LayoutDashboard,
            color: '#000'
        }
    ];

    return (
        <>
            <nav className="staff-bottom-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href, item.id);

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`staff-nav-item ${active ? 'active' : ''}`}
                        >
                            <Icon size={22} />
                            <span>{item.label}</span>
                            {item.id === 'leave' && pendingCount > 0 && (
                                <span className="nav-badge">{pendingCount}</span>
                            )}
                        </Link>
                    );
                })}

                <button
                    className={`staff-nav-item ${isMenuOpen ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(true)}
                >
                    <MoreHorizontal size={22} />
                    <span>Menu</span>
                </button>
            </nav>

            <Sheet
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                title="Menu Pengurusan"
                position="bottom"
            >
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1rem',
                    padding: '0.5rem 0'
                }}>
                    {managementItems.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={idx}
                                href={item.href}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    textDecoration: 'none',
                                    color: 'var(--text-primary)',
                                    position: 'relative'
                                }}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '16px',
                                    background: 'var(--bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: item.color || 'var(--text-primary)',
                                }}>
                                    <Icon size={24} />
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, textAlign: 'center' }}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: 'var(--primary)',
                            gridColumn: 'span 1'
                        }}
                    >
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '16px',
                            background: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                        }}>
                            <LogOut size={24} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, textAlign: 'center' }}>
                            Logout
                        </span>
                    </button>
                </div>
            </Sheet>
        </>
    );
}
