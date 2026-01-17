'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
  dbRole?: string | null;
  user_metadata?: {
    name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  userStatus: string | null;

  // Legacy properties for backwards compatibility
  currentStaff: StaffProfile | null;
  isStaffLoggedIn: boolean;
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('Staff');
  const [dbRole, setDbRole] = useState<string | null>(null);

  // Initialize auth state and listen for changes
  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      console.warn('[AuthContext] Supabase not configured');
      setLoading(false);
      return;
    }

    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setSupabaseUser(initialSession?.user || null);

        if (initialSession?.user) {
          await fetchUserStatus(initialSession.user.id);
        }
      } catch (error) {
        console.error('[AuthContext] Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, newSession: Session | null) => {
        console.log('[AuthContext] Auth state changed:', event);
        setSession(newSession);
        setSupabaseUser(newSession?.user || null);

        if (newSession?.user) {
          await fetchUserStatus(newSession.user.id);
        } else {
          setUserStatus(null);
          setUserRole('Staff');
          setDbRole(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user status from API
  const fetchUserStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/user/status?userId=${userId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUserStatus(data.status || 'approved');
        setUserRole(data.role || 'Staff');
        setDbRole(data.db_role ?? null);
      } else {
        console.error('[AuthContext] Failed to fetch user status');
        setUserStatus('incomplete_profile');
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching user status:', error);
      setUserStatus('incomplete_profile');
    }
  };

  // Create user object from Supabase session
  const user: User | null = supabaseUser ? {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
    email: supabaseUser.email || '',
    role: userRole,
    outletId: supabaseUser.user_metadata?.outletId || null,
    status: userStatus || 'pending_approval',
    dbRole: dbRole,
    user_metadata: {
      name: supabaseUser.user_metadata?.name || '',
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
      console.log('[AuthContext] Starting signOut...');
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      console.log('[AuthContext] Supabase signOut completed');
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        return { success: false, error: error.message };
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

  const logoutStaff = async () => {
    await signOut();
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
        isSupabaseConnected: true,
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
