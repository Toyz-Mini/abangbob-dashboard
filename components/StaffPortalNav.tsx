'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  Calendar,
  CheckSquare,
  Plane,
  User,
  Home,
  MoreHorizontal
} from 'lucide-react';
import { useState } from 'react';
import Sheet from './Sheet';

interface StaffPortalNavProps {
  currentPage?: string;
  pendingCount?: number;
}

export default function StaffPortalNav({ currentPage, pendingCount = 0 }: StaffPortalNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/staff-portal',
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
      href: '/staff-portal/checklist',
      icon: CheckSquare,
      label: 'Checklist',
      id: 'checklist'
    },
    {
      href: '/staff-portal/leave',
      icon: Plane,
      label: 'Cuti',
      id: 'leave',
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    {
      href: '/staff-portal/profile',
      icon: User,
      label: 'Profil',
      id: 'profile'
    },
  ];

  const isActive = (href: string, id: string) => {
    if (currentPage) {
      return id === currentPage;
    }
    if (href === '/staff-portal') {
      return pathname === '/staff-portal';
    }
    return pathname?.startsWith(href);
  };

  // State for mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Additional menu items for the sheet
  const moreMenuItems = [
    // { href: '/staff-portal/history', label: 'History', icon: Clock, color: 'var(--text-secondary)' },
    { href: '/settings', label: 'Tetapan', icon: User, color: 'var(--text-secondary)' },
    // Add other relevant links here
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
              {item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </Link>
          );
        })}

        {/* 'More' Menu Button */}
        <button
          className={`staff-nav-item ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(true)}
        >
          <MoreHorizontal size={22} />
          <span>Menu</span>
        </button>
      </nav>

      {/* Mobile Menu Sheet */}
      <Sheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title="Menu Staff"
        position="bottom"
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          padding: '0.5rem 0'
        }}>
          <Link
            href="/settings"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              color: 'var(--text-primary)',
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
              color: 'var(--text-primary)',
            }}>
              <User size={24} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, textAlign: 'center' }}>
              Tetapan
            </span>
          </Link>
        </div>
      </Sheet>
    </>
  );
}




