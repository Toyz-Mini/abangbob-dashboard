'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Users, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const defaultNavItems: NavItem[] = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/pos', label: 'POS', icon: ShoppingCart },
  { href: '/inventory', label: 'Inventori', icon: Package },
  { href: '/hr', label: 'HR', icon: Users },
];

interface BottomNavProps {
  items?: NavItem[];
  showMore?: boolean;
  onMoreClick?: () => void;
}

export default function BottomNav({
  items = defaultNavItems,
  showMore = true,
  onMoreClick
}: BottomNavProps) {
  const pathname = usePathname();

  const handleMoreClick = () => {
    onMoreClick?.();
  };

  return (
    <nav className="bottom-nav mobile-only" role="navigation" aria-label="Bottom navigation">
      {items.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/' && pathname?.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={24} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {showMore && (
        <button
          className={`bottom-nav-item ${pathname?.startsWith('/more') ? 'active' : ''}`}
          onClick={handleMoreClick}
          aria-label="More options"
        >
          <MoreHorizontal size={24} />
          <span>Menu</span>
        </button>
      )}
    </nav>
  );
}

// Hook to check if we should show bottom nav
export function useBottomNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return {
    isMoreOpen,
    openMore: () => setIsMoreOpen(true),
    closeMore: () => setIsMoreOpen(false),
    toggleMore: () => setIsMoreOpen(prev => !prev),
  };
}




