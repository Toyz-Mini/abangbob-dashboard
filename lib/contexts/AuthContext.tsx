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

// Lockout configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const LOGIN_ATTEMPTS_KEY = 'abangbob_login_attempts';
const LOCKOUT_EXPIRY_KEY = 'abangbob_lockout_expiry';

interface LoginAttempts {
  count: number;
  lastAttempt: number;
}

// Error keys that can be translated by consuming components
export const AUTH_ERROR_KEYS = {
  SUPABASE_NOT_CONFIGURED: 'auth.supabaseNotConfigured',
  LOGIN_ERROR: 'auth.loginError',
  SIGNUP_ERROR: 'auth.signupError',
  STAFF_NOT_ACTIVE: 'auth.staffNotActive',
  STAFF_DATA_NOT_AVAILABLE: 'auth.staffDataNotAvailable',
  INVALID_CREDENTIALS: 'auth.invalidCredentials',
  ACCOUNT_LOCKED: 'auth.accountLocked',
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
  
  // Lockout status
  isLocked: boolean;
  lockoutRemainingTime: number;
  loginAttemptsRemaining: number;
  clearLockout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STAFF_SESSION_KEY = 'abangbob_current_staff';

// Helper functions for lockout management
function getLoginAttempts(): LoginAttempts {
  if (typeof window === 'undefined') return { count: 0, lastAttempt: 0 };
  
  try {
    const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!stored) return { count: 0, lastAttempt: 0 };
    return JSON.parse(stored);
  } catch {
    return { count: 0, lastAttempt: 0 };
  }
}

function setLoginAttempts(attempts: LoginAttempts): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
}

function getLockoutExpiry(): number {
  if (typeof window === 'undefined') return 0;
  
  try {
    const stored = localStorage.getItem(LOCKOUT_EXPIRY_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function setLockoutExpiry(expiry: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCKOUT_EXPIRY_KEY, expiry.toString());
}

function clearLockoutStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  localStorage.removeItem(LOCKOUT_EXPIRY_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentStaff, setCurrentStaff] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  
  // Lockout state
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutRemainingTime, setLockoutRemainingTime] = useState(0);
  const [loginAttemptsRemaining, setLoginAttemptsRemaining] = useState(MAX_LOGIN_ATTEMPTS);

  // Check lockout status
  const checkLockoutStatus = useCallback(() => {
    const lockoutExpiry = getLockoutExpiry();
    const now = Date.now();
    
    if (lockoutExpiry > now) {
      setIsLocked(true);
      setLockoutRemainingTime(Math.ceil((lockoutExpiry - now) / 1000));
      setLoginAttemptsRemaining(0);
    } else {
      setIsLocked(false);
      setLockoutRemainingTime(0);
      
      // If lockout expired, clear it
      if (lockoutExpiry > 0) {
        clearLockoutStorage();
      }
      
      const attempts = getLoginAttempts();
      setLoginAttemptsRemaining(MAX_LOGIN_ATTEMPTS - attempts.count);
    }
  }, []);

  // Record failed login attempt
  const recordFailedAttempt = useCallback(() => {
    const attempts = getLoginAttempts();
    const newCount = attempts.count + 1;
    
    setLoginAttempts({ count: newCount, lastAttempt: Date.now() });
    
    if (newCount >= MAX_LOGIN_ATTEMPTS) {
      const lockoutExpiry = Date.now() + LOCKOUT_DURATION;
      setLockoutExpiry(lockoutExpiry);
      setIsLocked(true);
      setLockoutRemainingTime(Math.ceil(LOCKOUT_DURATION / 1000));
      setLoginAttemptsRemaining(0);
    } else {
      setLoginAttemptsRemaining(MAX_LOGIN_ATTEMPTS - newCount);
    }
  }, []);

  // Clear lockout on successful login
  const clearLockoutOnSuccess = useCallback(() => {
    clearLockoutStorage();
    setIsLocked(false);
    setLockoutRemainingTime(0);
    setLoginAttemptsRemaining(MAX_LOGIN_ATTEMPTS);
  }, []);

  // Manual clear lockout (for admin use)
  const clearLockout = useCallback(() => {
    clearLockoutStorage();
    setIsLocked(false);
    setLockoutRemainingTime(0);
    setLoginAttemptsRemaining(MAX_LOGIN_ATTEMPTS);
  }, []);

  // Update lockout timer
  useEffect(() => {
    if (!isLocked || lockoutRemainingTime <= 0) return;
    
    const timer = setInterval(() => {
      setLockoutRemainingTime(prev => {
        if (prev <= 1) {
          clearLockout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isLocked, lockoutRemainingTime, clearLockout]);

  // Initialize auth state
  useEffect(() => {
    // Check lockout status on mount
    checkLockoutStatus();
    
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
  }, [checkLockoutStatus]);

  // Sign in with email
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    // Check if locked out
    if (isLocked) {
      const minutes = Math.ceil(lockoutRemainingTime / 60);
      return { 
        success: false, 
        error: `Akaun dikunci. Sila cuba lagi dalam ${minutes} minit.`, 
        errorKey: AUTH_ERROR_KEYS.ACCOUNT_LOCKED 
      };
    }
    
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
        recordFailedAttempt();
        const remaining = loginAttemptsRemaining - 1;
        const errorMsg = remaining > 0 
          ? `${error.message}. ${remaining} percubaan lagi sebelum dikunci.`
          : error.message;
        return { success: false, error: errorMsg };
      }

      clearLockoutOnSuccess();
      setSession(data.session);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      recordFailedAttempt();
      return { success: false, error: 'Login error', errorKey: AUTH_ERROR_KEYS.LOGIN_ERROR };
    }
  }, [isLocked, lockoutRemainingTime, loginAttemptsRemaining, recordFailedAttempt, clearLockoutOnSuccess]);

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

  // Offline PIN login (defined before loginWithPin since it's used there)
  const loginWithPinOffline = useCallback((staffId: string, pin: string) => {
    try {
      const staffData = localStorage.getItem('abangbob_staff');
      if (!staffData) {
        recordFailedAttempt();
        return { success: false, error: 'Staff data not available', errorKey: AUTH_ERROR_KEYS.STAFF_DATA_NOT_AVAILABLE };
      }

      const staffList = JSON.parse(staffData);
      const staff = staffList.find((s: any) => s.id === staffId && s.pin === pin);

      if (!staff) {
        recordFailedAttempt();
        const remaining = loginAttemptsRemaining - 1;
        const errorMsg = remaining > 0 
          ? `ID atau PIN tidak sah. ${remaining} percubaan lagi sebelum dikunci.`
          : 'ID atau PIN tidak sah.';
        return { success: false, error: errorMsg, errorKey: AUTH_ERROR_KEYS.INVALID_CREDENTIALS };
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

      clearLockoutOnSuccess();
      setCurrentStaff(staffProfile);
      localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(staffProfile));
      return { success: true };
    } catch {
      recordFailedAttempt();
      return { success: false, error: 'Login error', errorKey: AUTH_ERROR_KEYS.LOGIN_ERROR };
    }
  }, [loginAttemptsRemaining, recordFailedAttempt, clearLockoutOnSuccess]);

  // Login with PIN (for staff)
  const loginWithPin = useCallback(async (staffId: string, pin: string) => {
    // Check if locked out
    if (isLocked) {
      const minutes = Math.ceil(lockoutRemainingTime / 60);
      return { 
        success: false, 
        error: `Akaun dikunci. Sila cuba lagi dalam ${minutes} minit.`, 
        errorKey: AUTH_ERROR_KEYS.ACCOUNT_LOCKED 
      };
    }
    
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

        const staffData = data as { id: string; name: string; email: string | null; role: string; status: string; outlet_id: string | null };

        if (staffData.status !== 'active') {
          return { success: false, error: 'Staff account not active', errorKey: AUTH_ERROR_KEYS.STAFF_NOT_ACTIVE };
        }

        const staffProfile: StaffProfile = {
          id: staffData.id,
          name: staffData.name,
          email: staffData.email,
          role: staffData.role as 'Manager' | 'Staff' | 'Admin',
          status: staffData.status,
          outlet_id: staffData.outlet_id,
        };

        clearLockoutOnSuccess();
        setCurrentStaff(staffProfile);
        localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(staffProfile));
        return { success: true };
      } catch {
        return loginWithPinOffline(staffId, pin);
      }
    }

    // Offline mode
    return loginWithPinOffline(staffId, pin);
  }, [isLocked, lockoutRemainingTime, clearLockoutOnSuccess, loginWithPinOffline]);

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
        isLocked,
        lockoutRemainingTime,
        loginAttemptsRemaining,
        clearLockout,
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
