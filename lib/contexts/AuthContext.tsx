'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface StaffProfile {
  id: string;
  name: string;
  email: string | null;
  role: 'Manager' | 'Staff' | 'Admin';
  status: string;
  outlet_id: string | null;
}

// Error keys that can be translated by consuming components
export const AUTH_ERROR_KEYS = {
  SUPABASE_NOT_CONFIGURED: 'auth.supabaseNotConfigured',
  LOGIN_ERROR: 'auth.loginError',
  SIGNUP_ERROR: 'auth.signupError',
  STAFF_NOT_ACTIVE: 'auth.staffNotActive',
  STAFF_DATA_NOT_AVAILABLE: 'auth.staffDataNotAvailable',
  INVALID_CREDENTIALS: 'auth.invalidCredentials',
} as const;

interface AuthContextType {
  // Supabase Auth (for admin/owner login)
  user: User | null;
  session: Session | null;
  
  // Staff PIN Auth (for POS/clock-in)
  currentStaff: StaffProfile | null;
  isStaffLoggedIn: boolean;
  
  // Loading states
  loading: boolean;
  
  // Auth methods - errorKey can be used for translation
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; errorKey?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; errorKey?: string }>;
  signOut: () => Promise<void>;
  
  // Staff PIN methods
  loginWithPin: (staffId: string, pin: string) => Promise<{ success: boolean; error?: string; errorKey?: string }>;
  logoutStaff: () => void;
  
  // Supabase status
  isSupabaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STAFF_SESSION_KEY = 'abangbob_current_staff';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentStaff, setCurrentStaff] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      setLoading(false);
      return;
    }

    setIsSupabaseConnected(true);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Restore staff session from localStorage
    const savedStaff = localStorage.getItem(STAFF_SESSION_KEY);
    if (savedStaff) {
      try {
        setCurrentStaff(JSON.parse(savedStaff));
      } catch {
        localStorage.removeItem(STAFF_SESSION_KEY);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase not configured', errorKey: AUTH_ERROR_KEYS.SUPABASE_NOT_CONFIGURED };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setSession(data.session);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Login error', errorKey: AUTH_ERROR_KEYS.LOGIN_ERROR };
    }
  }, []);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase not configured', errorKey: AUTH_ERROR_KEYS.SUPABASE_NOT_CONFIGURED };
    }

    try {
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
    } catch (err) {
      return { success: false, error: 'Signup error', errorKey: AUTH_ERROR_KEYS.SIGNUP_ERROR };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setCurrentStaff(null);
    localStorage.removeItem(STAFF_SESSION_KEY);
  }, []);

  // Login with PIN (for staff)
  const loginWithPin = useCallback(async (staffId: string, pin: string) => {
    const supabase = getSupabaseClient();

    // Try Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('id, name, email, role, status, outlet_id')
          .eq('id', staffId)
          .eq('pin', pin)
          .single();

        if (error || !data) {
          // Fall back to localStorage
          return loginWithPinOffline(staffId, pin);
        }

        if (data.status !== 'active') {
          return { success: false, error: 'Staff account not active', errorKey: AUTH_ERROR_KEYS.STAFF_NOT_ACTIVE };
        }

        const staffProfile: StaffProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as 'Manager' | 'Staff' | 'Admin',
          status: data.status,
          outlet_id: data.outlet_id,
        };

        setCurrentStaff(staffProfile);
        localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(staffProfile));
        return { success: true };
      } catch {
        return loginWithPinOffline(staffId, pin);
      }
    }

    // Offline mode
    return loginWithPinOffline(staffId, pin);
  }, []);

  // Offline PIN login
  const loginWithPinOffline = (staffId: string, pin: string) => {
    try {
      const staffData = localStorage.getItem('abangbob_staff');
      if (!staffData) {
        return { success: false, error: 'Staff data not available', errorKey: AUTH_ERROR_KEYS.STAFF_DATA_NOT_AVAILABLE };
      }

      const staffList = JSON.parse(staffData);
      const staff = staffList.find((s: any) => s.id === staffId && s.pin === pin);

      if (!staff) {
        return { success: false, error: 'Invalid ID or PIN', errorKey: AUTH_ERROR_KEYS.INVALID_CREDENTIALS };
      }

      if (staff.status !== 'active') {
        return { success: false, error: 'Staff account not active', errorKey: AUTH_ERROR_KEYS.STAFF_NOT_ACTIVE };
      }

      const staffProfile: StaffProfile = {
        id: staff.id,
        name: staff.name,
        email: staff.email || null,
        role: staff.role,
        status: staff.status,
        outlet_id: null,
      };

      setCurrentStaff(staffProfile);
      localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(staffProfile));
      return { success: true };
    } catch {
      return { success: false, error: 'Login error', errorKey: AUTH_ERROR_KEYS.LOGIN_ERROR };
    }
  };

  // Logout staff
  const logoutStaff = useCallback(() => {
    setCurrentStaff(null);
    localStorage.removeItem(STAFF_SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        currentStaff,
        isStaffLoggedIn: currentStaff !== null,
        loading,
        signInWithEmail,
        signUp,
        signOut,
        loginWithPin,
        logoutStaff,
        isSupabaseConnected,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
