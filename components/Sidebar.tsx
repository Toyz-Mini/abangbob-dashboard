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
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Store,
  Briefcase,
  LogOut,
  Sparkles
} from 'lucide-react';

// Original Nav for Staff / Operation focused roles
const STAFF_NAV_ITEMS = [
  {
    titleKey: 'nav.group.main',
    items: [
      { href: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, tourId: 'dashboard' },
    ]
  },
  {
    titleKey: 'nav.group.operations',
    items: [
      { href: '/pos', labelKey: 'nav.pos', icon: ShoppingCart, tourId: 'pos' },
      { href: '/outlets', labelKey: 'Outlets', icon: Store, tourId: 'outlets' },
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
      { href: '/staff-portal', labelKey: 'nav.myPortal', icon: UserCircle, tourId: 'staff-portal' },
      { href: '/hr', labelKey: 'nav.hrPortal', icon: Users, tourId: 'hr' },
      { href: '/finance', labelKey: 'nav.finance', icon: DollarSign, tourId: 'finance' },
      { href: '/analytics', labelKey: 'nav.analytics', icon: BarChart3, tourId: 'analytics' },
    ]
  },
  {
    titleKey: 'nav.group.settings',
    items: [
      { href: '/settings', labelKey: 'nav.settings', icon: Settings, tourId: 'settings' },
      { href: '/notifications', labelKey: 'nav.notifications', icon: Bell },
      { href: '/help', labelKey: 'nav.help', icon: HelpCircle, tourId: 'help-center' },
    ]
  },
];

// Simplified Executive Dashboard for Admin/Manager
const ADMIN_NAV_ITEMS = [
  {
    titleKey: 'nav.group.main',
    items: [
      { href: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    ]
  },
  {
    titleKey: 'Business Unit',
    items: [
      { href: '/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
      { href: '/finance', labelKey: 'nav.finance', icon: DollarSign },
      { href: '/finance/payroll', labelKey: 'nav.payroll', icon: DollarSign },
    ]
  },
  {
    titleKey: 'Operations Manager',
    items: [
      { href: '/outlets', labelKey: 'Outlets', icon: Store },
      { href: '/inventory', labelKey: 'nav.inventory', icon: Package },
      { href: '/production', labelKey: 'nav.production', icon: Factory },
      { href: '/menu-management', labelKey: 'nav.menu', icon: BookOpen },
      { href: '/suppliers', labelKey: 'nav.suppliers', icon: Boxes },
    ]
  },
  {
    titleKey: 'People & HR',
    items: [
      { href: '/hr', labelKey: 'nav.hrPortal', icon: Users },
      { href: '/staff-portal', labelKey: 'nav.myPortal', icon: UserCircle },
      { href: '/customers', labelKey: 'nav.customers', icon: UserCheck },
    ]
  },
  {
    titleKey: 'nav.group.settings',
    items: [
      { href: '/settings', labelKey: 'nav.settings', icon: Settings },
      { href: '/audit-log', labelKey: 'nav.auditLog', icon: FileText },
      { href: '/notifications', labelKey: 'nav.notifications', icon: Bell },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onToggle?: () => void;
  onNavClick?: () => void;
}

const Sidebar = forwardRef<HTMLElement, SidebarProps>(({ isOpen, onToggle, onNavClick }, ref) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, currentStaff, isStaffLoggedIn, signOut } = useAuth();
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

  // Filter navigation based on user role
  const filteredNavItems = useMemo(() => {
    // Determine effective role
    const role = user ? (user.role as any || 'Staff') : (isStaffLoggedIn && currentStaff ? currentStaff.role : null);

    if (!role) return [];

    // Filter groups and items
    const sourceNavItems = (role === 'Admin' || role === 'Manager') ? ADMIN_NAV_ITEMS : STAFF_NAV_ITEMS;

    return sourceNavItems.map(group => {
      // Filter items within group
      const validItems = group.items.filter(item => {
        // Staff Perms logic
        if (role === 'Staff') {
          const ALLOWED_STAFF_PATHS = [
            '/staff-portal', '/staff-portal/schedule', '/staff-portal/checklist',
            '/staff-portal/ot-claim', '/staff-portal/salary-advance',
            '/pos', '/order-history', '/kds', '/order-display', '/delivery',
            '/production', '/equipment',
            '/hr/timeclock', '/hr/leave-calendar', '/help', '/notifications'
          ];
          return ALLOWED_STAFF_PATHS.includes(item.href);
        }
        return true; // Admin/Manager sees all
      });

      if (validItems.length > 0) {
        return { ...group, items: validItems };
      }
      return null;
    }).filter((g): g is typeof STAFF_NAV_ITEMS[0] => !!g);
  }, [user, currentStaff, isStaffLoggedIn]);

  // precise active state
  const activeHref = useMemo(() => {
    if (!pathname) return '';
    const allItems = filteredNavItems.flatMap(g => g.items);
    const sortedItems = [...allItems].sort((a, b) => b.href.length - a.href.length);

    const match = sortedItems.find(item => {
      if (item.href === '/') return pathname === '/';
      return pathname.startsWith(item.href);
    });

    return match ? match.href : '';
  }, [pathname, filteredNavItems]);

  const isActive = (href: string) => href === activeHref;

  return (
    <>
      {/* Floating Sidebar Container */}
      <aside
        ref={ref}
        className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out ${isOpen ? 'w-[280px] p-4' : 'w-[96px] p-4'
          }`}
      >
        {/* Glass Panel Content */}
        <div className="h-full flex flex-col glass-panel rounded-2xl overflow-hidden relative">

          {/* Header */}
          <div className="h-[70px] flex items-center justify-center border-b border-white/10 dark:border-white/5 relative">
            <Link href="/" className="flex items-center gap-3 decoration-none hover:opacity-80 transition-opacity">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="AbangBob"
                  width={32}
                  height={32}
                  className={`transition-all duration-300 ${isOpen ? 'w-8' : 'w-10'}`}
                />
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse" />
              </div>

              <div className={`flex flex-col transition-all duration-300 overflow-hidden whitespace-nowrap ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'
                }`}>
                <span className="font-bold text-lg tracking-tight text-primary">AbangBob</span>
                <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Dashboard</span>
              </div>
            </Link>
          </div>

          {/* Navigation Scroll Area */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 custom-scrollbar">
            {filteredNavItems.map((group, groupIndex) => {
              const groupKey = group.titleKey;
              const isCollapsed = collapsedGroups[groupKey];

              return (
                <div key={groupIndex} className="animate-slide-up-stagger">
                  {/* Group Title */}
                  {isOpen && (
                    <button
                      className="w-full flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-primary transition-colors mb-2"
                      onClick={() => toggleGroup(groupKey)}
                    >
                      <span className="truncate">{t(groupKey)}</span>
                      {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                    </button>
                  )}

                  {/* Group Divider for Collapsed State */}
                  {!isOpen && <div className="h-px bg-gray-200 dark:bg-gray-800 mx-4 my-4" />}

                  {/* Items */}
                  {!isCollapsed && (
                    <ul className="space-y-1">
                      {group.items.map((item, itemIndex) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        const showBadge = item.href === '/order-history?filter=void_refund' && pendingCount > 0;

                        return (
                          <li key={itemIndex}>
                            <Link
                              href={item.href}
                              onClick={onNavClick}
                              className={`
                                relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                ${isOpen ? 'justify-start' : 'justify-center'}
                                ${active
                                  ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-colored scale-[1.01]'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary'
                                }
                              `}
                              title={!isOpen ? t(item.labelKey) : ''}
                            >
                              <Icon
                                size={isOpen ? 18 : 22}
                                className={`flex-shrink-0 transition-transform duration-300 ${active ? 'animate-pulse-slow' : 'group-hover:scale-110'}`}
                                strokeWidth={active ? 2.5 : 2}
                              />

                              <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 hidden'
                                }`}>
                                {t(item.labelKey)}
                              </span>

                              {/* Active Indicator Dot (Collapsed) */}
                              {!isOpen && active && (
                                <div className="absolute right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                              )}

                              {/* Badge */}
                              {showBadge && (
                                <span className={`
                                  ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold shadow-sm
                                  ${active ? 'bg-white text-primary' : 'bg-red-500 text-white'}
                                  ${!isOpen && 'absolute top-0 right-0 -mr-1 -mt-1'}
                                `}>
                                  {pendingCount}
                                </span>
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

          {/* Footer User Profile */}
          <div className="p-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 backdrop-blur-sm">
            <div className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 ${isOpen ? 'bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/5' : 'justify-center'
              }`}>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-primary font-bold shadow-inner ring-2 ring-white dark:ring-white/10">
                  {user ? (user.name?.charAt(0) || 'A') : (currentStaff?.name.charAt(0) || 'G')}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
              </div>

              {isOpen && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                    {user?.name || currentStaff?.name || 'Guest'}
                  </div>
                  <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                    <Sparkles size={10} className="text-orange-400" />
                    {user?.role || currentStaff?.role || 'Viewer'}
                  </div>
                </div>
              )}

              {isOpen && (
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
