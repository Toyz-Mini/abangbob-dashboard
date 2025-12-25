'use client';

import { forwardRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useOrderHistory } from '@/lib/store';
import { canViewNavItem, type UserRole } from '@/lib/permissions';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Factory,
  Truck,
  DollarSign,
  BarChart3,
  UserCheck,
  Boxes,
  ChefHat,
  Tag,
  Bell,
  Settings,
  Monitor,
  Tv,
  FileText,
  BookOpen,
  UserCircle,
  CheckSquare,
  Calendar,
  ClipboardCheck,
  HelpCircle,
  History,
  Wrench,
  RefreshCw,
  Clock,
  type LucideIcon
} from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  tourId?: string; // For interactive tour targeting
  showBadge?: boolean; // For showing notification badges
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
    titleKey: 'nav.group.hr',
    items: [
      { href: '/hr', labelKey: 'nav.hr', icon: Users, tourId: 'hr' },
      { href: '/hr/approvals', labelKey: 'nav.approvals', icon: ClipboardCheck },
      { href: '/hr/refund-approvals', labelKey: 'nav.refundApprovals', icon: RefreshCw, showBadge: true },
      { href: '/hr/leave-calendar', labelKey: 'nav.leaveCalendar', icon: Calendar, tourId: 'leave' },
      { href: '/hr/checklist-config', labelKey: 'nav.checklistConfig', icon: CheckSquare },
    ]
  },
  {
    titleKey: 'nav.group.finance',
    items: [
      { href: '/finance', labelKey: 'nav.finance', icon: DollarSign, tourId: 'finance' },
      { href: '/finance/payroll', labelKey: 'nav.payroll', icon: Users },
      { href: '/finance/reports', labelKey: 'nav.financialReports', icon: BarChart3 },
      { href: '/finance/tax-summary', labelKey: 'nav.taxSummary', icon: FileText },
    ]
  },
  {
    titleKey: 'nav.group.marketing',
    items: [
      { href: '/customers', labelKey: 'nav.customers', icon: UserCheck, tourId: 'customers' },
      { href: '/promotions', labelKey: 'nav.promotions', icon: Tag, tourId: 'promotions' },
    ]
  },
  {
    titleKey: 'nav.group.reportsSettings',
    items: [
      { href: '/analytics', labelKey: 'nav.analytics', icon: BarChart3, tourId: 'analytics' },
      { href: '/audit-log', labelKey: 'nav.auditLog', icon: FileText },
      { href: '/notifications', labelKey: 'nav.notifications', icon: Bell },
      { href: '/settings', labelKey: 'nav.settings', icon: Settings, tourId: 'settings' },
    ]
  },
  {
    titleKey: 'nav.group.help',
    items: [
      { href: '/help', labelKey: 'nav.help', icon: HelpCircle, tourId: 'help-center' },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onMouseEnter?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  onNavClick?: () => void; // Called when a nav link is clicked (for mobile auto-close)
}

const Sidebar = forwardRef<HTMLElement, SidebarProps>(({ isOpen, onMouseEnter, onClick, onNavClick }, ref) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, currentStaff, isStaffLoggedIn } = useAuth();
  const { getPendingVoidRefundCount } = useOrderHistory();

  // Get pending refund count for badge
  const pendingRefundCount = getPendingVoidRefundCount();

  // Determine the current user's role
  // Default to 'Admin' when no auth to ensure menu is always visible
  const userRole: UserRole | null = useMemo(() => {
    if (user) {
      // Supabase authenticated user is Admin
      return 'Admin';
    }
    if (isStaffLoggedIn && currentStaff) {
      return currentStaff.role;
    }
    // Default to null (no access) when not logged in
    return 'Staff'; // Temporary safety: default to lowest role if unsure, or null. 
    // Plan said return null. Let's return null.
    // However, UserRole type is 'Admin' | 'Manager' | 'Staff'. Null is not in UserRole.
    // I need to change the return type or handle null.
    // Looking at the code: `const userRole: UserRole`
    // I should probably change the type definition or cast.
    // Actually, let's look at `UserRole`.
    // If I return null, `filteredNavGroups` logic needs to handle it.
    // `filteredNavGroups` maps `group.items.filter(...)`.
    // `canViewNavItem(role, path)` accepts `UserRole | null`.
    // So `userRole` variable should be `UserRole | null`.

    return null;
  }, [user, currentStaff, isStaffLoggedIn]);

  // Filter navigation groups based on user role
  const filteredNavGroups = useMemo(() => {
    return navGroupsConfig
      // Hide Staff Portal for Admin - they manage staff, not work as staff
      .filter(group => !(userRole === 'Admin' && group.titleKey === 'nav.group.staffPortal'))
      .map(group => ({
        ...group,
        items: group.items.filter(item => canViewNavItem(userRole, item.href)),
      }))
      .filter(group => group.items.length > 0);
  }, [userRole]);

  return (
    <aside
      ref={ref}
      className={`sidebar ${isOpen ? 'open' : 'closed'}`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <div className="nav-logo">
        <img
          src="/logo.png"
          alt="Abang Bob"
          className="sidebar-logo-img"
        />
        {isOpen && <span>{t('app.name')}</span>}
      </div>
      <nav className="nav-container">
        {filteredNavGroups.map((group, groupIndex) => (
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
                const badgeCount = item.showBadge ? pendingRefundCount : 0;

                return (
                  <li key={item.href} className="nav-item">
                    <Link
                      href={item.href}
                      scroll={false}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      title={!isOpen ? label : undefined}
                      data-tour={item.tourId}
                      onClick={onNavClick}
                    >
                      <Icon size={20} />
                      {isOpen && (
                        <>
                          <span>{label}</span>
                          {badgeCount > 0 && (
                            <span
                              className="badge badge-warning"
                              style={{
                                marginLeft: 'auto',
                                fontSize: '0.7rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: 'var(--radius-full)',
                                fontWeight: 600,
                              }}
                            >
                              {badgeCount}
                            </span>
                          )}
                        </>
                      )}
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
