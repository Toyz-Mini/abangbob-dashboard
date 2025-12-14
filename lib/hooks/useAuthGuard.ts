'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface AuthGuardOptions {
  /** Where to redirect if not authenticated */
  redirectTo?: string;
  /** Required role(s) to access the route */
  requiredRole?: ('Admin' | 'Manager' | 'Staff')[];
  /** Allow staff PIN login (vs requiring full Supabase auth) */
  allowStaffLogin?: boolean;
  /** Custom function to check access */
  customCheck?: () => boolean;
}

interface AuthGuardResult {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether access is allowed (considering roles) */
  isAuthorized: boolean;
  /** Whether auth check is still loading */
  isLoading: boolean;
  /** Current user role */
  userRole: 'Admin' | 'Manager' | 'Staff' | null;
  /** The current user/staff */
  user: { id: string; name: string; email: string | null; role: string } | null;
}

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/setup'];

// Routes that require specific roles
const ROLE_ROUTES: Record<string, ('Admin' | 'Manager' | 'Staff')[]> = {
  // Admin only
  '/settings': ['Admin', 'Manager'],
  '/audit-log': ['Admin', 'Manager'],
  
  // Admin and Manager
  '/hr': ['Admin', 'Manager'],
  '/hr/staff': ['Admin', 'Manager'],
  '/hr/staff/new': ['Admin', 'Manager'],
  '/hr/payroll': ['Admin', 'Manager'],
  '/hr/approvals': ['Admin', 'Manager'],
  '/hr/kpi': ['Admin', 'Manager'],
  '/hr/checklist-config': ['Admin', 'Manager'],
  '/finance': ['Admin', 'Manager'],
  '/analytics': ['Admin', 'Manager'],
  '/customers': ['Admin', 'Manager'],
  '/promotions': ['Admin', 'Manager'],
  
  // Admin, Manager, and Staff
  '/': ['Admin', 'Manager', 'Staff'],
  '/pos': ['Admin', 'Manager', 'Staff'],
  '/kds': ['Admin', 'Manager', 'Staff'],
  '/inventory': ['Admin', 'Manager', 'Staff'],
  '/menu-management': ['Admin', 'Manager', 'Staff'],
  '/production': ['Admin', 'Manager', 'Staff'],
  '/recipes': ['Admin', 'Manager', 'Staff'],
  '/suppliers': ['Admin', 'Manager', 'Staff'],
  '/delivery': ['Admin', 'Manager', 'Staff'],
  '/order-display': ['Admin', 'Manager', 'Staff'],
  '/notifications': ['Admin', 'Manager', 'Staff'],
  '/help': ['Admin', 'Manager', 'Staff'],
  
  // Staff portal - accessible by all authenticated users
  '/staff-portal': ['Admin', 'Manager', 'Staff'],
  '/hr/timeclock': ['Admin', 'Manager', 'Staff'],
  '/hr/leave-calendar': ['Admin', 'Manager', 'Staff'],
  '/hr/schedule': ['Admin', 'Manager', 'Staff'],
};

/**
 * Hook to guard routes based on authentication and authorization
 * 
 * @param options - Configuration options for the guard
 * @returns AuthGuardResult with auth state information
 */
export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardResult {
  const {
    redirectTo = '/login',
    requiredRole,
    allowStaffLogin = true,
    customCheck,
  } = options;
  
  const router = useRouter();
  const pathname = usePathname();
  const { 
    user, 
    currentStaff, 
    isStaffLoggedIn, 
    loading,
  } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Determine current user and role
  const getCurrentUser = () => {
    if (user) {
      // Supabase authenticated user (admin/owner)
      return {
        id: user.id,
        name: user.user_metadata?.name || user.email || 'Admin',
        email: user.email || null,
        role: 'Admin' as const,
      };
    }
    
    if (allowStaffLogin && currentStaff) {
      return {
        id: currentStaff.id,
        name: currentStaff.name,
        email: currentStaff.email,
        role: currentStaff.role,
      };
    }
    
    return null;
  };
  
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role || null;
  
  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname?.startsWith(`${route}/`)
  );
  
  // Check authentication
  const isAuthenticated = !!(user || (allowStaffLogin && isStaffLoggedIn));
  
  // Check authorization (role-based)
  const isAuthorized = (() => {
    if (!isAuthenticated) return false;
    
    // Custom check takes precedence
    if (customCheck) return customCheck();
    
    // Check required role from options
    if (requiredRole && requiredRole.length > 0) {
      return userRole ? requiredRole.includes(userRole) : false;
    }
    
    // Check route-specific roles
    if (pathname && ROLE_ROUTES[pathname]) {
      return userRole ? ROLE_ROUTES[pathname].includes(userRole) : false;
    }
    
    // Check parent route
    const parentRoute = pathname?.split('/').slice(0, 2).join('/');
    if (parentRoute && ROLE_ROUTES[parentRoute]) {
      return userRole ? ROLE_ROUTES[parentRoute].includes(userRole) : false;
    }
    
    // Default: authenticated is enough
    return true;
  })();
  
  // Handle redirects
  useEffect(() => {
    if (loading) return;
    
    setIsLoading(false);
    
    // Skip for public routes
    if (isPublicRoute) return;
    
    // Redirect if not authenticated
    if (!isAuthenticated) {
      const returnUrl = pathname !== '/' ? `?returnUrl=${encodeURIComponent(pathname || '')}` : '';
      router.push(`${redirectTo}${returnUrl}`);
      return;
    }
    
    // Redirect if not authorized
    if (!isAuthorized) {
      // Redirect to appropriate page based on role
      if (userRole === 'Staff') {
        router.push('/staff-portal');
      } else {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, isAuthorized, isPublicRoute, pathname, redirectTo, router, userRole]);
  
  return {
    isAuthenticated,
    isAuthorized: isAuthenticated && isAuthorized,
    isLoading: loading || isLoading,
    userRole,
    user: currentUser,
  };
}

/**
 * Check if a user has permission to access a specific route
 */
export function canAccessRoute(
  route: string, 
  userRole: 'Admin' | 'Manager' | 'Staff' | null
): boolean {
  if (!userRole) return false;
  
  // Check exact match
  if (ROLE_ROUTES[route]) {
    return ROLE_ROUTES[route].includes(userRole);
  }
  
  // Check parent route
  const parentRoute = route.split('/').slice(0, 2).join('/');
  if (ROLE_ROUTES[parentRoute]) {
    return ROLE_ROUTES[parentRoute].includes(userRole);
  }
  
  // Default: Admin and Manager can access everything
  return userRole === 'Admin' || userRole === 'Manager';
}

/**
 * Get allowed routes for a user role
 */
export function getAllowedRoutes(userRole: 'Admin' | 'Manager' | 'Staff' | null): string[] {
  if (!userRole) return [];
  
  return Object.entries(ROLE_ROUTES)
    .filter(([_, roles]) => roles.includes(userRole))
    .map(([route]) => route);
}

export default useAuthGuard;
