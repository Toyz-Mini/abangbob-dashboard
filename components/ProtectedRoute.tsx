'use client';

import { ReactNode } from 'react';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { hasPermission, type UserRole, type PermissionCategory, type ActionType } from '@/lib/permissions';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Required role(s) to access this route */
  requiredRole?: UserRole[];
  /** Required permission category */
  requiredPermission?: PermissionCategory;
  /** Required action within the permission category */
  requiredAction?: ActionType;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Custom unauthorized component */
  unauthorizedComponent?: ReactNode;
  /** Allow staff PIN login (default: true) */
  allowStaffLogin?: boolean;
  /** Redirect path if not authenticated */
  redirectTo?: string;
}

/**
 * ProtectedRoute component for page-level access control
 * 
 * Usage:
 * ```tsx
 * // Require authentication only
 * <ProtectedRoute>
 *   <MyPage />
 * </ProtectedRoute>
 * 
 * // Require specific role(s)
 * <ProtectedRoute requiredRole={['Admin', 'Manager']}>
 *   <AdminPage />
 * </ProtectedRoute>
 * 
 * // Require specific permission
 * <ProtectedRoute requiredPermission="payroll" requiredAction="view">
 *   <PayrollPage />
 * </ProtectedRoute>
 * ```
 */
export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  requiredAction = 'view',
  loadingComponent,
  unauthorizedComponent,
  allowStaffLogin = true,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isAuthorized, isLoading, userRole } = useAuthGuard({
    requiredRole,
    allowStaffLogin,
    redirectTo,
  });
  
  // Check additional permission requirements
  const hasRequiredPermission = () => {
    if (!requiredPermission) return true;
    return hasPermission(userRole, requiredPermission, requiredAction);
  };
  
  // Show loading state
  if (isLoading) {
    return loadingComponent || (
      <div className="protected-route-loading">
        <LoadingSpinner />
        <p>Loading...</p>
        <style jsx>{`
          .protected-route-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
            gap: 1rem;
          }
          .protected-route-loading p {
            color: var(--text-secondary);
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    );
  }
  
  // Not authenticated - redirect is handled by useAuthGuard
  if (!isAuthenticated) {
    return null;
  }
  
  // Not authorized (role check failed)
  if (!isAuthorized || !hasRequiredPermission()) {
    return unauthorizedComponent || (
      <div className="protected-route-unauthorized">
        <div className="unauthorized-content">
          <div className="unauthorized-icon">🚫</div>
          <h1>Akses Ditolak</h1>
          <p>Anda tidak mempunyai kebenaran untuk mengakses halaman ini.</p>
          <div className="unauthorized-details">
            <p>Peranan anda: <strong>{userRole || 'Tidak diketahui'}</strong></p>
            {requiredRole && (
              <p>Peranan diperlukan: <strong>{requiredRole.join(', ')}</strong></p>
            )}
          </div>
          <a href="/" className="btn btn-primary">
            Kembali ke Dashboard
          </a>
        </div>
        <style jsx>{`
          .protected-route-unauthorized {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            padding: 2rem;
          }
          .unauthorized-content {
            text-align: center;
            max-width: 400px;
          }
          .unauthorized-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          .unauthorized-content h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--danger);
          }
          .unauthorized-content > p {
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
          }
          .unauthorized-details {
            background: var(--gray-100);
            padding: 1rem;
            border-radius: var(--radius-md);
            margin-bottom: 1.5rem;
            font-size: 0.875rem;
          }
          .unauthorized-details p {
            margin: 0.25rem 0;
            color: var(--text-secondary);
          }
          .unauthorized-details strong {
            color: var(--text-primary);
          }
        `}</style>
      </div>
    );
  }
  
  // Authorized - render children
  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes
 */
export function withProtectedRoute<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Component to conditionally render content based on permissions
 */
export function RequirePermission({
  children,
  category,
  action = 'view',
  fallback = null,
}: {
  children: ReactNode;
  category: PermissionCategory;
  action?: ActionType;
  fallback?: ReactNode;
}) {
  const { userRole } = useAuthGuard();
  
  if (!hasPermission(userRole, category, action)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Component to conditionally render content based on role
 */
export function RequireRole({
  children,
  roles,
  fallback = null,
}: {
  children: ReactNode;
  roles: UserRole[];
  fallback?: ReactNode;
}) {
  const { userRole } = useAuthGuard();
  
  if (!userRole || !roles.includes(userRole)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
