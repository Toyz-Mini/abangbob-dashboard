'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authClient, useSession as useBetterAuthSession } from '@/lib/auth-client';

// Legacy StaffProfile interface for backwards compatibility
interface StaffProfile {
  id: string;
  name: string;
  email: string | null;
  role: 'Manager' | 'Staff' | 'Admin';
  status: string;
  outlet_id: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  outletId?: string;
  status?: string;
  user_metadata?: {
    name?: string;
  };
}

interface AuthContextType {
  // New Better Auth properties
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  userStatus: string | null; // User approval status

  // Legacy properties for backwards compatibility
  currentStaff: StaffProfile | null;
  isStaffLoggedIn: boolean;
  session: any;
  isSupabaseConnected: boolean;

  // Auth methods
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;

  // Legacy methods (no-op for backwards compatibility)
  loginWithPin: (staffId: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logoutStaff: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, error } = useBetterAuthSession();
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('Staff');

  // Handle loading state and status fetching
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // If BetterAuth is still loading, keep loading true
      if (isPending) {
        return;
      }

      // If no session, we are done loading (not authenticated)
      if (!session?.user?.id) {
        if (isMounted) {
          setUserStatus(null);
          setLoading(false);
        }
        return;
      }

      // If we have a session, fetch extended user status from DB
      try {
        const res = await fetch(`/api/user/status?userId=${session.user.id}`);
        if (isMounted && res.ok) {
          const data = await res.json();
          setUserStatus(data.status || 'approved');
          setUserRole(data.role || 'Staff');
        } else if (isMounted) {
          // Fallback if API fails - FAIL SAFE (Do NOT default to approved)
          console.error('Failed to fetch user status - falling back to strict mode');
          setUserStatus('incomplete_profile');
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching user status:', error);
          // Fail Safe
          setUserStatus('incomplete_profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [isPending, session?.user?.id]);

  // Create user object from Better Auth session
  const user: User | null = session?.user ? {
    id: session.user.id,
    name: session.user.name || '',
    email: session.user.email || '',
    role: userRole,
    outletId: (session.user as any).outletId || null,
    status: userStatus || 'pending_approval',
    user_metadata: {
      name: session.user.name || '',
    },
  } : null;

  // Legacy currentStaff for backwards compatibility
  const currentStaff: StaffProfile | null = user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    role: (userRole as 'Manager' | 'Staff' | 'Admin') || 'Staff',
    status: userStatus || 'pending_approval',
    outlet_id: user.outletId || null,
  } : null;

  const signOut = async () => {
    try {
      // Race condition: If signOut takes longer than 500ms, force proceed
      await Promise.race([
        authClient.signOut(),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Always redirect to login page even if server logout fails/hangs
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const result = await authClient.signUp.email({ email, password, name });
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  // Legacy methods - deprecated but kept for backwards compatibility
  const loginWithPin = async () => {
    console.warn('PIN login is deprecated. Please use email login.');
    return { success: false, error: 'PIN login has been removed. Please use email login.' };
  };

  const logoutStaff = () => {
    signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        userStatus,
        currentStaff,
        isStaffLoggedIn: !!currentStaff,
        session,
        isSupabaseConnected: true, // Always true for backwards compatibility
        signOut,
        signInWithEmail,
        signUp,
        loginWithPin,
        logoutStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export context and types
export { AuthContext };
export type { AuthContextType, StaffProfile };

