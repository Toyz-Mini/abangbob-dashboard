'use client';

import { forwardRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Factory, 
  Truck, 
  UtensilsCrossed,
  DollarSign,
  BarChart3,
  UserCheck,
  Boxes,
  ChefHat,
  Tag,
  Bell,
  Settings,
  Monitor,
  FileText,
  BookOpen,
  UserCircle,
  CheckSquare,
  Calendar,
  ClipboardCheck,
  type LucideIcon
} from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

// Navigation structure with translation keys
const navGroupsConfig: NavGroup[] = [
  {
    titleKey: 'nav.group.main',
    items: [
      { href: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    ]
  },
  {
    titleKey: 'nav.group.staffPortal',
    items: [
      { href: '/staff-portal', labelKey: 'nav.portal', icon: UserCircle },
      { href: '/staff-portal/schedule', labelKey: 'nav.mySchedule', icon: Calendar },
      { href: '/staff-portal/checklist', labelKey: 'nav.checklist', icon: CheckSquare },
    ]
  },
  {
    titleKey: 'nav.group.operations',
    items: [
      { href: '/pos', labelKey: 'nav.pos', icon: ShoppingCart },
      { href: '/menu-management', labelKey: 'nav.menu', icon: BookOpen },
      { href: '/kds', labelKey: 'nav.kds', icon: Monitor },
      { href: '/delivery', labelKey: 'nav.delivery', icon: Truck },
    ]
  },
  {
    titleKey: 'nav.group.inventoryProduction',
    items: [
      { href: '/inventory', labelKey: 'nav.inventory', icon: Package },
      { href: '/production', labelKey: 'nav.production', icon: Factory },
      { href: '/recipes', labelKey: 'nav.recipes', icon: ChefHat },
      { href: '/suppliers', labelKey: 'nav.suppliers', icon: Boxes },
    ]
  },
  {
    titleKey: 'nav.group.hrFinance',
    items: [
      { href: '/hr', labelKey: 'nav.hr', icon: Users },
      { href: '/hr/approvals', labelKey: 'nav.approvals', icon: ClipboardCheck },
      { href: '/hr/leave-calendar', labelKey: 'nav.leaveCalendar', icon: Calendar },
      { href: '/hr/checklist-config', labelKey: 'nav.checklistConfig', icon: CheckSquare },
      { href: '/finance', labelKey: 'nav.finance', icon: DollarSign },
    ]
  },
  {
    titleKey: 'nav.group.marketing',
    items: [
      { href: '/customers', labelKey: 'nav.customers', icon: UserCheck },
      { href: '/promotions', labelKey: 'nav.promotions', icon: Tag },
    ]
  },
  {
    titleKey: 'nav.group.reportsSettings',
    items: [
      { href: '/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
      { href: '/audit-log', labelKey: 'nav.auditLog', icon: FileText },
      { href: '/notifications', labelKey: 'nav.notifications', icon: Bell },
      { href: '/settings', labelKey: 'nav.settings', icon: Settings },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onMouseEnter?: () => void;
  onClick?: (e: React.MouseEvent) => void;
}

const Sidebar = forwardRef<HTMLElement, SidebarProps>(({ isOpen, onMouseEnter, onClick }, ref) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  
  return (
    <aside 
      ref={ref}
      className={`sidebar ${isOpen ? 'open' : 'closed'}`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <div className="nav-logo">
        <UtensilsCrossed size={24} />
        {isOpen && <span>{t('app.name')}</span>}
      </div>
      <nav className="nav-container">
        {navGroupsConfig.map((group, groupIndex) => (
          <div key={group.titleKey} className="nav-group">
            {isOpen && (
              <div className="nav-group-title">
                {t(group.titleKey)}
              </div>
            )}
            {!isOpen && groupIndex > 0 && (
              <div className="nav-group-divider" />
            )}
            <ul className="nav-menu">
              {group.items.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname?.startsWith(item.href));
                
                const Icon = item.icon;
                const label = t(item.labelKey);
                return (
                  <li key={item.href} className="nav-item">
                    <Link
                      href={item.href}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      title={!isOpen ? label : undefined}
                    >
                      <Icon size={20} />
                      {isOpen && <span>{label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
