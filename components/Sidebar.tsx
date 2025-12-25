'use client';

import { forwardRef, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { canViewNavItem, UserRole } from '@/lib/permissions';
import { useOrderHistory } from '@/lib/store';
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
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  type LucideIcon
} from 'lucide-react';

interface NavItem {
  href?: string;  // Optional for parent items
  labelKey: string;
  icon: LucideIcon;
  tourId?: string;
  showBadge?: boolean;
  children?: NavItem[];  // Support for nested items
}

interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

// Navigation structure with collapsible items
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
      {
        labelKey: 'nav.approvals',
        icon: ClipboardCheck,
        children: [
          { href: '/hr/approvals?tab=leave', labelKey: 'nav.leaveApprovals', icon: Calendar },
          { href: '/hr/approvals?tab=claims', labelKey: 'nav.claimsApprovals', icon: DollarSign },
          { href: '/hr/approvals?tab=ot', labelKey: 'nav.otApprovals', icon: Clock },
          { href: '/hr/approvals?tab=advance', labelKey: 'nav.advanceApprovals', icon: DollarSign },
          { href: '/hr/refund-approvals', labelKey: 'nav.refundApprovals', icon: RefreshCw, showBadge: true },
        ]
      },
      { href: '/hr/disciplinary', labelKey: 'nav.disciplinary', icon: AlertTriangle },
      { href: '/hr/training', labelKey: 'nav.training', icon: GraduationCap },
      { href: '/hr/documents', labelKey: 'nav.documents', icon: FileText },
      { href: '/hr/performance', labelKey: 'nav.performance', icon: TrendingUp },
      { href: '/hr/leave-calendar', labelKey: 'nav.leaveCalendar', icon: Calendar, tourId: 'leave' },
      { href: '/hr/checklist-config', labelKey: 'nav.checklistConfig', icon: CheckSquare },
    ]
  },
  {
    titleKey: 'nav.group.finance',
    items: [
      { href: '/finance', labelKey: 'nav.finance', icon: DollarSign, tourId: 'finance' },
      {
        labelKey: 'nav.financeReports',
        icon: BarChart3,
        children: [
          { href: '/finance/payroll', labelKey: 'nav.payroll', icon: Users },
          { href: '/finance/reports', labelKey: 'nav.financialReports', icon: BarChart3 },
          { href: '/finance/tax-summary', labelKey: 'nav.taxSummary', icon: FileText },
        ]
      },
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
  onNavClick?: () => void;
}

const Sidebar = forwardRef<HTMLElement, SidebarProps>(({ isOpen, onMouseEnter, onClick, onNavClick }, ref) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, currentStaff, isStaffLoggedIn } = useAuth();
  const { getPendingVoidRefundCount } = useOrderHistory();

  // State for expanded dropdown items
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const pendingRefundCount = getPendingVoidRefundCount();

  const userRole: UserRole | null = useMemo(() => {
    if (user) return 'Admin';
    if (isStaffLoggedIn && currentStaff) return currentStaff.role;
    return null;
  }, [user, currentStaff, isStaffLoggedIn]);

  // Auto-expand items that contain current active path
  useEffect(() => {
    const newExpanded = new Set<string>();
    navGroupsConfig.forEach(group => {
      group.items.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child =>
            pathname === child.href || (child.href && pathname?.startsWith(child.href))
          );
          if (hasActiveChild) {
            newExpanded.add(item.labelKey);
          }
        }
      });
    });
    if (newExpanded.size > 0) {
      setExpandedItems(prev => new Set([...prev, ...newExpanded]));
    }
  }, [pathname]);

  const toggleExpand = (labelKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(labelKey)) {
        newSet.delete(labelKey);
      } else {
        newSet.add(labelKey);
      }
      return newSet;
    });
  };

  const filteredNavGroups = useMemo(() => {
    return navGroupsConfig
      .filter(group => !(userRole === 'Admin' && group.titleKey === 'nav.group.staffPortal'))
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          if (item.href) return canViewNavItem(userRole, item.href);
          if (item.children) {
            return item.children.some(child => child.href && canViewNavItem(userRole, child.href));
          }
          return true;
        }),
      }))
      .filter(group => group.items.length > 0);
  }, [userRole]);

  const renderNavItem = (item: NavItem, depth: number = 0) => {
    const Icon = item.icon;
    const label = t(item.labelKey);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.labelKey);

    // Check if this item or any child is active
    const isActive = item.href
      ? (pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)))
      : item.children?.some(child =>
        pathname === child.href || (child.href && child.href !== '/' && pathname?.startsWith(child.href))
      );

    const badgeCount = item.showBadge ? pendingRefundCount : 0;

    if (hasChildren) {
      // Collapsible parent item
      return (
        <li key={item.labelKey} className="nav-item">
          <button
            className={`nav-link nav-toggle ${isActive ? 'active' : ''}`}
            onClick={(e) => toggleExpand(item.labelKey, e)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              paddingLeft: depth > 0 ? `${1 + depth * 0.75}rem` : undefined,
            }}
          >
            <Icon size={20} />
            {isOpen && (
              <>
                <span>{label}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              </>
            )}
          </button>
          {isOpen && isExpanded && (
            <ul className="nav-submenu" style={{
              paddingLeft: '0',
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
              listStyle: 'none'
            }}>
              {item.children?.map(child => renderNavItem(child, depth + 1))}
            </ul>
          )}
        </li>
      );
    }

    // Regular nav item with link
    return (
      <li key={item.href || item.labelKey} className="nav-item">
        <Link
          href={item.href || '#'}
          scroll={false}
          className={`nav-link ${isActive ? 'active' : ''}`}
          title={!isOpen ? label : undefined}
          data-tour={item.tourId}
          onClick={onNavClick}
          style={{
            paddingLeft: depth > 0 ? `${1.5 + depth * 0.75}rem` : undefined,
          }}
        >
          <Icon size={depth > 0 ? 16 : 20} />
          {isOpen && (
            <>
              <span style={{ fontSize: depth > 0 ? '0.875rem' : undefined }}>{label}</span>
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
  };

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
              {group.items.map((item) => renderNavItem(item))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
