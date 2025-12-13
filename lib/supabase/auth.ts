// Supabase Authentication Service
// Handles user authentication, session management, and role-based access

import { getSupabaseClient } from './client';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export interface StaffAuthResult {
  success: boolean;
  message: string;
  staffId?: string;
  role?: 'Manager' | 'Staff' | 'Admin';
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } as AuthError };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } as AuthError };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  return { data, error };
}

// Sign out
export async function signOut() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: { message: 'Supabase not configured' } as AuthError };
  }

  const { error } = await supabase.auth.signOut();
  return { error };
}

// Get current user
export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: { user: null }, error: null };
  }

  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

// Get current session
export async function getCurrentSession() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: { session: null }, error: null };
  }

  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

// Staff PIN authentication (for POS/clock-in)
export async function authenticateStaffPin(staffId: string, pin: string): Promise<StaffAuthResult> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    // Fallback to localStorage-based authentication for offline mode
    return offlineStaffAuth(staffId, pin);
  }

  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, role, pin, status')
      .eq('id', staffId)
      .single();

    if (error || !data) {
      return { success: false, message: 'Staf tidak dijumpai' };
    }

    const staffData = data as { id: string; name: string; role: string; pin: string; status: string };

    if (staffData.status !== 'active') {
      return { success: false, message: 'Staf tidak aktif' };
    }

    if (staffData.pin !== pin) {
      return { success: false, message: 'PIN salah' };
    }

    return { 
      success: true, 
      message: `Selamat datang, ${staffData.name}`,
      staffId: staffData.id,
      role: staffData.role as 'Manager' | 'Staff' | 'Admin',
    };
  } catch {
    return offlineStaffAuth(staffId, pin);
  }
}

// Offline staff authentication fallback
function offlineStaffAuth(staffId: string, pin: string): StaffAuthResult {
  try {
    const staffData = localStorage.getItem('abangbob_staff');
    if (!staffData) {
      return { success: false, message: 'Data staf tidak tersedia' };
    }

    const staff = JSON.parse(staffData);
    const staffMember = staff.find((s: { id: string; pin: string; status: string; name: string; role: string }) => 
      s.id === staffId
    );

    if (!staffMember) {
      return { success: false, message: 'Staf tidak dijumpai' };
    }

    if (staffMember.status !== 'active') {
      return { success: false, message: 'Staf tidak aktif' };
    }

    if (staffMember.pin !== pin) {
      return { success: false, message: 'PIN salah' };
    }

    return {
      success: true,
      message: `Selamat datang, ${staffMember.name}`,
      staffId: staffMember.id,
      role: staffMember.role,
    };
  } catch {
    return { success: false, message: 'Ralat pengesahan' };
  }
}

// Reset password
export async function resetPassword(email: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } as AuthError };
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  return { data, error };
}

// Update password
export async function updatePassword(newPassword: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } as AuthError };
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  return supabase.auth.onAuthStateChange(callback);
}

