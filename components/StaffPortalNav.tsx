'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Clock, 
  Calendar, 
  CheckSquare, 
  Plane, 
  User,
  Home
} from 'lucide-react';

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

  return (
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
    </nav>
  );
}




