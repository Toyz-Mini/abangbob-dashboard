'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { canViewNavItem } from '@/lib/permissions';
import LoadingSpinner from './LoadingSpinner';

const PUBLIC_PATHS = ['/login', '/unauthorized'];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isStaffLoggedIn, currentStaff, loading, userStatus } = useAuth();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Skip check while auth is loading
        if (loading) return;

        // Public paths don't need auth
        if (PUBLIC_PATHS.includes(pathname)) {
            setAuthorized(true);
            return;
        }

        // Check for pending approval status
        // If user is pending, they can ONLY access /pending-approval
        if (user && userStatus === 'pending_approval') {
            if (pathname !== '/pending-approval') {
                setAuthorized(false);
                router.push('/pending-approval');
            } else {
                setAuthorized(true);
            }
            return;
        }

        // Redirect away from pending page if approved/active
        if (user && userStatus !== 'pending_approval' && pathname === '/pending-approval') {
            setAuthorized(false);
            router.push('/');
            return;
        }

        // Determine effective role
        const role = user ? 'Admin' : (isStaffLoggedIn && currentStaff ? currentStaff.role : null);

        // If no role (not logged in), redirect to login
        // Exception: If we are at root /, allow it? Usually root redirects to dashboard which requires auth.
        // If strict app, maybe redirect strictly. 
        // Let's assume root / is dashboard and requires 'view' 'dashboard'.
        // Actually our previous logic in Sidebar said:
        // "Default to Admin to show all menu items when not logged in" -> This was the BUG.

        // Fix: If no role, strictly false unless public path.
        // But maybe we want public landing page? 
        // Assuming this is an internal dashboard, we want to force login.
        // However, if we redirect all to /login, make sure /login exists.
        // Wait, Sidebar logic previously was: "Supabase authenticated user is Admin".

        if (!role) {
            // Not logged in and not on a public path -> Redirect to login
            setAuthorized(false);
            router.push('/login');
            return;
        }

        // Role exists - check permission
        if (canViewNavItem(role, pathname)) {
            setAuthorized(true);
        } else {
            setAuthorized(false);
            // Determine invalid access
            if (role === 'Staff') {
                router.push('/staff-portal');
            } else {
                router.push('/');
            }
        }

    }, [pathname, user, isStaffLoggedIn, currentStaff, loading, router, userStatus]);

    // While checking, show nothing or loader
    // If loading auth, show checker
    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center"><LoadingSpinner /></div>;
    }

    // If not authorized and we have a role (so we failed check), hide content
    // If no role, we currently allow (to show login?). 
    // Wait, if no role, canViewNavItem('null') returns false usually.

    return <>{children}</>;
}
