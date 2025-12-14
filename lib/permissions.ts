/**
 * Role-Based Permission System
 * 
 * Defines what each role can access and do in the system
 */

export type UserRole = 'Admin' | 'Manager' | 'Staff';

// Permission categories
export type PermissionCategory = 
  | 'dashboard'
  | 'pos'
  | 'menu'
  | 'kds'
  | 'delivery'
  | 'inventory'
  | 'production'
  | 'recipes'
  | 'suppliers'
  | 'hr'
  | 'staff'
  | 'payroll'
  | 'approvals'
  | 'schedule'
  | 'timeclock'
  | 'leave'
  | 'checklist'
  | 'finance'
  | 'customers'
  | 'promotions'
  | 'analytics'
  | 'audit'
  | 'settings'
  | 'notifications'
  | 'help'
  | 'staff-portal';

// Action types
export type ActionType = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'approve';

// Permission definition
export interface Permission {
  category: PermissionCategory;
  actions: ActionType[];
}

// Role permissions matrix
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Admin: [
    // Full access to everything
    { category: 'dashboard', actions: ['view', 'export'] },
    { category: 'pos', actions: ['view', 'create', 'edit', 'delete'] },
    { category: 'menu', actions: ['view', 'create', 'edit', 'delete'] },
    { category: 'kds', actions: ['view', 'edit'] },
    { category: 'delivery', actions: ['view', 'create', 'edit', 'delete'] },
    { category: 'inventory', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { category: 'production', actions: ['view', 'create', 'edit', 'delete'] },
    { category: 'recipes', actions: ['view', 'create', 'edit', 'delete'] },
    { category: 'suppliers', actions: ['view', 'create', 'edit', 'delete'] },
    { category: 'hr', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { category: 'staff', actions: ['view', 'create', 'edit', 'delete'] },
    { category: 'payroll', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { category: 'approvals', actions: ['view', 'approve'] },
    { category: 'schedule', actions: ['view', 'create', 'edit', 'delete'] },
    { category: 'timeclock', actions: ['view', 'edit'] },
    { category: 'leave', actions: ['view', 'approve'] },
    { category: 'checklist', actions: ['view', 'create', 'edit', 'delete'] },
    { category: 'finance', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { category: 'customers', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { category: 'promotions', actions: ['view', 'create', 'edit', 'delete'] },
    { category: 'analytics', actions: ['view', 'export'] },
    { category: 'audit', actions: ['view', 'export'] },
    { category: 'settings', actions: ['view', 'edit'] },
    { category: 'notifications', actions: ['view', 'edit'] },
    { category: 'help', actions: ['view'] },
    { category: 'staff-portal', actions: ['view', 'create', 'edit'] },
  ],
  
  Manager: [
    // Most access, but no settings or critical admin functions
    { category: 'dashboard', actions: ['view', 'export'] },
    { category: 'pos', actions: ['view', 'create', 'edit'] },
    { category: 'menu', actions: ['view', 'create', 'edit'] },
    { category: 'kds', actions: ['view', 'edit'] },
    { category: 'delivery', actions: ['view', 'create', 'edit'] },
    { category: 'inventory', actions: ['view', 'create', 'edit', 'export'] },
    { category: 'production', actions: ['view', 'create', 'edit'] },
    { category: 'recipes', actions: ['view', 'create', 'edit'] },
    { category: 'suppliers', actions: ['view', 'create', 'edit'] },
    { category: 'hr', actions: ['view', 'edit'] },
    { category: 'staff', actions: ['view', 'edit'] },
    { category: 'payroll', actions: ['view', 'export'] },
    { category: 'approvals', actions: ['view', 'approve'] },
    { category: 'schedule', actions: ['view', 'create', 'edit'] },
    { category: 'timeclock', actions: ['view', 'edit'] },
    { category: 'leave', actions: ['view', 'approve'] },
    { category: 'checklist', actions: ['view', 'create', 'edit'] },
    { category: 'finance', actions: ['view', 'export'] },
    { category: 'customers', actions: ['view', 'edit'] },
    { category: 'promotions', actions: ['view', 'create', 'edit'] },
    { category: 'analytics', actions: ['view', 'export'] },
    { category: 'audit', actions: ['view'] },
    { category: 'notifications', actions: ['view'] },
    { category: 'help', actions: ['view'] },
    { category: 'staff-portal', actions: ['view', 'create', 'edit'] },
  ],
  
  Staff: [
    // Limited access - primarily operational
    { category: 'dashboard', actions: ['view'] },
    { category: 'pos', actions: ['view', 'create'] },
    { category: 'kds', actions: ['view', 'edit'] },
    { category: 'delivery', actions: ['view'] },
    { category: 'inventory', actions: ['view'] },
    { category: 'production', actions: ['view', 'create'] },
    { category: 'recipes', actions: ['view'] },
    { category: 'timeclock', actions: ['view', 'create'] },
    { category: 'schedule', actions: ['view'] },
    { category: 'leave', actions: ['view', 'create'] },
    { category: 'checklist', actions: ['view', 'create'] },
    { category: 'notifications', actions: ['view'] },
    { category: 'help', actions: ['view'] },
    { category: 'staff-portal', actions: ['view', 'create', 'edit'] },
  ],
};

// Navigation items that should be visible to each role
export const NAV_VISIBILITY: Record<string, UserRole[]> = {
  // Main
  '/': ['Admin', 'Manager', 'Staff'],
  
  // Staff Portal - All
  '/staff-portal': ['Admin', 'Manager', 'Staff'],
  '/staff-portal/schedule': ['Admin', 'Manager', 'Staff'],
  '/staff-portal/checklist': ['Admin', 'Manager', 'Staff'],
  '/staff-portal/leave': ['Admin', 'Manager', 'Staff'],
  '/staff-portal/claims': ['Admin', 'Manager', 'Staff'],
  '/staff-portal/profile': ['Admin', 'Manager', 'Staff'],
  '/staff-portal/payslip': ['Admin', 'Manager', 'Staff'],
  '/staff-portal/training': ['Admin', 'Manager', 'Staff'],
  '/staff-portal/requests': ['Admin', 'Manager', 'Staff'],
  '/staff-portal/swap-shift': ['Admin', 'Manager', 'Staff'],
  
  // Operations
  '/pos': ['Admin', 'Manager', 'Staff'],
  '/menu-management': ['Admin', 'Manager'],
  '/kds': ['Admin', 'Manager', 'Staff'],
  '/delivery': ['Admin', 'Manager', 'Staff'],
  '/order-display': ['Admin', 'Manager', 'Staff'],
  
  // Inventory & Production
  '/inventory': ['Admin', 'Manager', 'Staff'],
  '/production': ['Admin', 'Manager', 'Staff'],
  '/recipes': ['Admin', 'Manager', 'Staff'],
  '/suppliers': ['Admin', 'Manager'],
  
  // HR & Finance
  '/hr': ['Admin', 'Manager'],
  '/hr/staff': ['Admin', 'Manager'],
  '/hr/staff/new': ['Admin', 'Manager'],
  '/hr/payroll': ['Admin', 'Manager'],
  '/hr/approvals': ['Admin', 'Manager'],
  '/hr/kpi': ['Admin', 'Manager'],
  '/hr/schedule': ['Admin', 'Manager', 'Staff'],
  '/hr/timeclock': ['Admin', 'Manager', 'Staff'],
  '/hr/leave-calendar': ['Admin', 'Manager', 'Staff'],
  '/hr/checklist-config': ['Admin', 'Manager'],
  '/finance': ['Admin', 'Manager'],
  
  // Marketing
  '/customers': ['Admin', 'Manager'],
  '/promotions': ['Admin', 'Manager'],
  
  // Reports & Settings
  '/analytics': ['Admin', 'Manager'],
  '/audit-log': ['Admin', 'Manager'],
  '/notifications': ['Admin', 'Manager', 'Staff'],
  '/settings': ['Admin', 'Manager'],
  '/help': ['Admin', 'Manager', 'Staff'],
};

/**
 * Check if a role has permission for a specific action on a category
 */
export function hasPermission(
  role: UserRole | null,
  category: PermissionCategory,
  action: ActionType
): boolean {
  if (!role) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[role];
  const categoryPermission = rolePermissions.find(p => p.category === category);
  
  if (!categoryPermission) return false;
  
  return categoryPermission.actions.includes(action);
}

/**
 * Check if a role can view a navigation item
 */
export function canViewNavItem(role: UserRole | null, path: string): boolean {
  if (!role) return false;
  
  // Check exact path
  if (NAV_VISIBILITY[path]) {
    return NAV_VISIBILITY[path].includes(role);
  }
  
  // Check parent path (for nested routes)
  const parentPath = path.split('/').slice(0, 2).join('/');
  if (parentPath && NAV_VISIBILITY[parentPath]) {
    return NAV_VISIBILITY[parentPath].includes(role);
  }
  
  // Default: Admin and Manager can see everything
  return role === 'Admin' || role === 'Manager';
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get actions allowed for a role on a category
 */
export function getAllowedActions(
  role: UserRole | null,
  category: PermissionCategory
): ActionType[] {
  if (!role) return [];
  
  const rolePermissions = ROLE_PERMISSIONS[role];
  const categoryPermission = rolePermissions.find(p => p.category === category);
  
  return categoryPermission?.actions || [];
}

/**
 * Filter navigation items based on user role
 */
export function filterNavItems<T extends { href: string }>(
  items: T[],
  role: UserRole | null
): T[] {
  if (!role) return [];
  
  return items.filter(item => canViewNavItem(role, item.href));
}

/**
 * Check if role can perform CRUD operations
 */
export function canCreate(role: UserRole | null, category: PermissionCategory): boolean {
  return hasPermission(role, category, 'create');
}

export function canEdit(role: UserRole | null, category: PermissionCategory): boolean {
  return hasPermission(role, category, 'edit');
}

export function canDelete(role: UserRole | null, category: PermissionCategory): boolean {
  return hasPermission(role, category, 'delete');
}

export function canExport(role: UserRole | null, category: PermissionCategory): boolean {
  return hasPermission(role, category, 'export');
}

export function canApprove(role: UserRole | null, category: PermissionCategory): boolean {
  return hasPermission(role, category, 'approve');
}
