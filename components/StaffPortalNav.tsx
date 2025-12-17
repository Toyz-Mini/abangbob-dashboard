'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  Calendar,
  CheckSquare,
  Plane,
  User,
  Monitor,
  History,
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
      href: '/pos',
      icon: Monitor,
      label: 'POS',
      id: 'pos'
    },
    {
      href: '/order-history',
      icon: History,
      label: 'History',
      id: 'orders'
    },
    {
      href: '/staff-portal/checklist',
      icon: CheckSquare,
      label: 'Checklist',
      id: 'checklist'
    },
    // {
    //   href: '/staff-portal/profile',
    //   icon: User,
    //   label: 'Profil',
    //   id: 'profile'
    // },
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
    {
      href: '/staff-portal/schedule',
      label: 'Jadual',
      icon: Calendar,
      color: 'var(--primary)'
    },
    {
      href: '/staff-portal/leave',
      label: 'Cuti',
      icon: Plane,
      color: 'var(--success)',
      badge: pendingCount
    },
    {
      href: '/staff-portal/profile',
      label: 'Profil',
      icon: User,
      color: 'var(--info)'
    },
    {
      href: '/kds',
      label: 'Kitchen',
      icon: Monitor,
      color: 'var(--warning)'
    },
    {
      href: '/order-display',
      label: 'Queue',
      icon: Clock,
      color: 'var(--primary)'
    },
    {
      href: '/settings',
      label: 'Tetapan',
      icon: MoreHorizontal,
      color: 'var(--text-secondary)'
    },
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
          {moreMenuItems.map((item, idx) => {
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
                {item.badge && item.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '10px',
                    background: 'var(--error)',
                    color: 'white',
                    fontSize: '0.6rem',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}




