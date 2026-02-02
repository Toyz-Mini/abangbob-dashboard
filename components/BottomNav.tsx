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
    <nav className="fixed bottom-0 left-0 right-0 h-[65px] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-white/5 z-50 flex items-center justify-around px-2 pb-safe md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" role="navigation" aria-label="Bottom navigation">
      {items.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/' && pathname?.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'animate-in zoom-in-50 duration-200' : ''} />
            <span className="text-[10px] font-medium tracking-tight leading-none">{item.label}</span>
          </Link>
        );
      })}

      {showMore && (
        <button
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${pathname?.startsWith('/more') ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          onClick={handleMoreClick}
          aria-label="More options"
        >
          <MoreHorizontal size={24} />
          <span className="text-[10px] font-medium tracking-tight leading-none">Lagi</span>
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





