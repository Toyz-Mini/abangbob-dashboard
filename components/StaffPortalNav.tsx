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
      id: 'leave'
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

  // Additional menu items for the sheet (staff-only)
  const moreMenuItems = [
    {
      href: '/staff-portal/claims',
      label: 'Tuntutan',
      icon: History,
      color: 'var(--success)'
    },
    {
      href: '/staff-portal/payslip',
      label: 'Payslip',
      icon: User,
      color: 'var(--info)'
    },
    {
      href: '/staff-portal/profile',
      label: 'Profil',
      icon: User,
      color: 'var(--primary)'
    },
    {
      href: '/staff-portal/swap-shift',
      label: 'Tukar Shift',
      icon: Calendar,
      color: 'var(--warning)'
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
              </Link>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}




