'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { forwardRef, useState, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { useOrderHistory } from '@/lib/store';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  BookOpen,
  ChefHat,
  Factory,
  Clock,
  Truck,
  Tag,
  UserCheck,
  Bell,
  Boxes,
  Monitor,
  Tv,
  FileText,
  UserCircle,
  CheckSquare,
  History,
  Wrench,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// Simplified navigation structure - 5 groups only
const NAV_ITEMS = [
  {
    titleKey: 'nav.group.main',
    items: [
      { href: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, tourId: 'dashboard' },
    ]
  },
  {
    titleKey: 'nav.group.staffPortal',
    items: [
      { href: '/staff-portal', labelKey: 'nav.portal', icon: UserCircle, tourId: 'staff-portal' },
      { href: '/staff-portal/schedule', labelKey: 'nav.mySchedule', icon: Calendar, tourId: 'schedule' },
      { href: '/staff-portal/checklist', labelKey: 'nav.checklist', icon: CheckSquare, tourId: 'checklist' },
      { href: '/staff-portal/ot-claim', labelKey: 'nav.otClaim', icon: Clock, tourId: 'ot-claim' },
      { href: '/staff-portal/salary-advance', labelKey: 'nav.salaryAdvance', icon: DollarSign, tourId: 'salary-advance' },
    ]
  },
  {
    titleKey: 'nav.group.operations',
    items: [
      { href: '/pos', labelKey: 'nav.pos', icon: ShoppingCart, tourId: 'pos' },
      { href: '/order-history', labelKey: 'nav.orderHistory', icon: History, tourId: 'order-history' },
      { href: '/menu-management', labelKey: 'nav.menu', icon: BookOpen, tourId: 'menu' },
      { href: '/kds', labelKey: 'nav.kds', icon: Monitor, tourId: 'kds' },
      { href: '/order-display', labelKey: 'nav.orderDisplay', icon: Tv, tourId: 'order-display' },
      { href: '/delivery', labelKey: 'nav.delivery', icon: Truck, tourId: 'delivery' },
      { href: '/customers', labelKey: 'nav.customers', icon: UserCheck, tourId: 'customers' },
      { href: '/promotions', labelKey: 'nav.promotions', icon: Tag, tourId: 'promotions' },
    ]
  },
  {
    titleKey: 'nav.group.inventoryProduction',
    items: [
      { href: '/inventory', labelKey: 'nav.inventory', icon: Package, tourId: 'inventory' },
      { href: '/production', labelKey: 'nav.production', icon: Factory, tourId: 'production' },
      { href: '/equipment', labelKey: 'nav.equipment', icon: Wrench, tourId: 'equipment' },
      { href: '/recipes', labelKey: 'nav.recipes', icon: ChefHat, tourId: 'recipes' },
      { href: '/suppliers', labelKey: 'nav.suppliers', icon: Boxes, tourId: 'suppliers' },
    ]
  },
  {
    titleKey: 'nav.group.hrFinance',
    items: [
      { href: '/hr', labelKey: 'nav.hrPortal', icon: Users, tourId: 'hr' },
      { href: '/finance', labelKey: 'nav.finance', icon: DollarSign, tourId: 'finance' },
      { href: '/finance/payroll', labelKey: 'nav.payroll', icon: DollarSign },
      { href: '/analytics', labelKey: 'nav.analytics', icon: BarChart3, tourId: 'analytics' },
    ]
  },
  {
    titleKey: 'nav.group.settings',
    items: [
      { href: '/settings', labelKey: 'nav.settings', icon: Settings, tourId: 'settings' },
      { href: '/audit-log', labelKey: 'nav.auditLog', icon: FileText },
      { href: '/notifications', labelKey: 'nav.notifications', icon: Bell },
      { href: '/help', labelKey: 'nav.help', icon: HelpCircle, tourId: 'help-center' },
    ]
  },
];

interface SidebarProps {
  isOpen: boolean;
  onMouseEnter?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  onNavClick?: () => void;
}

const Sidebar = forwardRef<HTMLElement, SidebarProps>(({ isOpen, onMouseEnter, onClick, onNavClick }, ref) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, currentStaff, isStaffLoggedIn } = useAuth();
  const { getPendingVoidRefundCount } = useOrderHistory();

  const pendingCount = useMemo(() => getPendingVoidRefundCount(), [getPendingVoidRefundCount]);

  // Collapsed state for groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupTitle: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  // Check if current path is within HR section
  const isHRSection = pathname?.startsWith('/hr');

  // Filter navigation based on user role
  const filteredNavItems = useMemo(() => {
    // If staff is logged in (not admin), only show staff portal
    if (isStaffLoggedIn && currentStaff && !user) {
      return NAV_ITEMS.filter(group => group.titleKey === 'nav.group.staffPortal');
    }
    // Admin sees everything except staff portal personal items
    if (user) {
      return NAV_ITEMS;
    }
    return NAV_ITEMS;
  }, [user, currentStaff, isStaffLoggedIn]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <aside
      ref={ref}
      className={`sidebar ${isOpen ? 'open' : 'closed'}`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      {/* Logo */}
      <Link href="/" className="nav-logo">
        <Image
          src="/logo.png"
          alt="AbangBob"
          width={40}
          height={40}
          className="sidebar-logo-img"
        />
        <span className="sidebar-logo-text">AbangBob</span>
      </Link>

      {/* Navigation */}
      <nav className="nav-container">
        {filteredNavItems.map((group, groupIndex) => {
          const groupKey = group.titleKey;
          const isCollapsed = collapsedGroups[groupKey];

          return (
            <div key={groupIndex} className="nav-group">
              <button
                className="nav-group-title"
                onClick={() => toggleGroup(groupKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  paddingRight: '0'
                }}
              >
                <span>{t(groupKey)}</span>
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              </button>

              {!isCollapsed && (
                <ul className="nav-menu">
                  {group.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const showBadge = item.href === '/hr/refund-approvals' && pendingCount > 0;

                    return (
                      <li key={itemIndex} className="nav-item">
                        <Link
                          href={item.href}
                          className={`nav-link ${active ? 'active' : ''}`}
                          onClick={onNavClick}
                          data-tour={item.tourId}
                        >
                          <Icon size={20} />
                          <span>{t(item.labelKey)}</span>
                          {showBadge && (
                            <span className="badge badge-warning" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>{pendingCount}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2">
          {user ? (
            <>
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                {user.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{user.name || 'Admin'}</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
            </>
          ) : currentStaff ? (
            <>
              <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold">
                {currentStaff.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{currentStaff.name}</div>
                <div className="text-xs text-gray-500">{currentStaff.role}</div>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">G</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">Guest</div>
                <div className="text-xs text-gray-500">Viewer</div>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
