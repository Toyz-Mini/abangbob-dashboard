// Multi-Factor Authentication (MFA) for admin users
// Uses otpauth library for TOTP (Time-based One-Time Password)

import { createServerSupabaseClient } from '../supabase/server';
import { TOTP as OTPAuth } from 'otpauth';

/**
 * Helper to get supabase client with null check
 */
async function getSupabase() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  return supabase;
}

export interface TOTPSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  uri: string;
}

export interface TOTPVerification {
  success: boolean;
  message?: string;
}

export interface MFAStatus {
  enabled: boolean;
  verified: boolean;
  backupCodesRemaining: number;
}

export interface MFAConfig {
  secret?: string;
  backupCodes?: string[];
  enabled?: boolean;
  verified?: boolean;
  lastUsed?: string;
  backup_codes?: string[]; // Database field for backward compatibility
  disabledAt?: string;
  disabledReason?: string;
  verified_at?: string;
}

interface StaffExtendedData {
  mfa?: MFAConfig;
  sessions?: unknown[];
  [key: string]: unknown;
}

interface StaffRecord {
  id: string;
  email?: string;
  extended_data: StaffExtendedData | null;
}

/**
 * Generate TOTP secret and QR code URI
 */
function generateTOTPSecret(): TOTPSetup {
  try {
    // Generate a random secret (32 bytes = 256 bits)
    const encoder = new TextEncoder();
    const secretArray = new Uint8Array(32);
    crypto.getRandomValues(secretArray);
    const secret = Array.from(secretArray, (b) => b.toString(16).padStart(2, '0')).join('');

    // Generate backup codes (10 codes, 8 characters each)
    const backupCodes = generateBackupCodes(10, 8);

    // Create TOTP instance
    const totp = new OTPAuth({
      secret,
      issuer: 'AbangBob Dashboard',
      label: 'admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    });

    // Generate authenticator URI (for TOTP apps like Google Authenticator)
    const uri = totp.toString();

    // Generate QR code (using a simple text-based QR code service)
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;

    return {
      secret,
      qrCode,
      backupCodes,
      uri
    };
  } catch (error) {
    console.error('[MFA] Error generating TOTP setup:', error);
    throw new Error('Failed to generate MFA setup');
  }
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count: number, length: number): string[] {
  const codes: string[] = [];
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < length; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    codes.push(code);
  }

  return codes;
}

/**
 * Verify TOTP code using otpauth library
 */
function verifyTOTPCode(secret: string, code: string): boolean {
  try {
    // Create TOTP instance with the secret
    const totp = new OTPAuth({
      secret,
      issuer: 'AbangBob Dashboard',
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    });

    // Validate the code (allow 1 window before/after for time sync)
    // window: 1 means check current, previous, and next time step
    const delta = totp.validate({ token: code, window: 1 });

    // delta === 0 means exact match
    // delta !== null means code is valid (could be within time window)
    return delta !== null && delta !== undefined;
  } catch (error) {
    console.error('[MFA] Error verifying TOTP code:', error);
    return false;
  }
}

/**
 * Enable MFA for admin user
 */
export async function enableMFA(userId: string, userEmail: string): Promise<TOTPSetup> {
  try {
    const setup = generateTOTPSecret();
    const supabase = await getSupabase();

    // Store MFA configuration in staff's extended_data
    const mfaConfig: MFAConfig = {
      secret: setup.secret,
      backupCodes: setup.backupCodes,
      enabled: true,
      verified: false,
      lastUsed: new Date().toISOString()
    };

    const { data: staff, error } = await supabase
      .from('staff')
      .select('id, email, extended_data')
      .eq('id', userId)
      .single();

    if (!staff || error) {
      throw new Error('User not found');
    }

    const typedStaff = staff as StaffRecord;
    const currentExtended: StaffExtendedData = typedStaff.extended_data || {};
    currentExtended.mfa = mfaConfig;

    const { error: updateError } = await supabase
      .from('staff')
      .update({ extended_data: currentExtended })
      .eq('id', userId);

    if (updateError) {
      console.error('[MFA] Error storing MFA config:', updateError);
      throw new Error('Failed to enable MFA');
    }

    console.log('[MFA] MFA enabled for user:', userEmail);
    return setup;
  } catch (error) {
    console.error('[MFA] Error enabling MFA:', error);
    throw error;
  }
}

/**
 * Verify and confirm MFA setup
 */
export async function verifyAndConfirmMFA(userId: string, code: string): Promise<TOTPVerification> {
  try {
    const supabase = await getSupabase();

    const { data: staff } = await supabase
      .from('staff')
      .select('id, email, extended_data')
      .eq('id', userId)
      .single();

    const typedStaff = staff as StaffRecord | null;

    if (!typedStaff?.extended_data?.mfa?.secret) {
      return {
        success: false,
        message: 'MFA not enabled'
      };
    }

    const isValid = verifyTOTPCode(typedStaff.extended_data.mfa.secret, code);

    if (!isValid) {
      return {
        success: false,
        message: 'Invalid code'
      };
    }

    // Mark as verified
    const extendedData = typedStaff.extended_data;
    if (extendedData.mfa) {
      extendedData.mfa.verified = true;
      extendedData.mfa.verified_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('staff')
      .update({ extended_data: extendedData })
      .eq('id', userId);

    if (updateError) {
      throw new Error('Failed to verify MFA');
    }

    console.log('[MFA] MFA verified for user:', typedStaff.email);
    return { success: true };
  } catch (error) {
    console.error('[MFA] Error verifying MFA:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

/**
 * Verify TOTP during login
 */
export async function verifyMFAForLogin(userId: string, code: string): Promise<boolean> {
  try {
    const supabase = await getSupabase();

    const { data: staff } = await supabase
      .from('staff')
      .select('id, email, extended_data')
      .eq('id', userId)
      .single();

    const typedStaff = staff as StaffRecord | null;

    if (!typedStaff?.extended_data?.mfa?.enabled) {
      console.log('[MFA] MFA not enabled for user:', typedStaff?.email);
      return true; // No MFA required
    }

    if (!typedStaff.extended_data.mfa.verified) {
      console.log('[MFA] MFA not verified yet for user:', typedStaff.email);
      return false;
    }

    const secret = typedStaff.extended_data.mfa.secret;
    if (!secret) {
      return false;
    }

    const isValid = verifyTOTPCode(secret, code);

    if (!isValid) {
      console.log('[MFA] Invalid TOTP code for user:', typedStaff.email);
      return false;
    }

    // Update last used
    const extendedData = typedStaff.extended_data;
    if (extendedData.mfa) {
      extendedData.mfa.lastUsed = new Date().toISOString();
    }

    await supabase
      .from('staff')
      .update({ extended_data: extendedData })
      .eq('id', userId);

    console.log('[MFA] TOTP verified for login:', typedStaff.email);
    return true;
  } catch (error) {
    console.error('[MFA] Error verifying MFA for login:', error);
    return false;
  }
}

/**
 * Verify TOTP code for re-authentication
 */
export async function verifyTOTP(email: string, code: string): Promise<boolean> {
  try {
    const supabase = await getSupabase();

    const { data: staff } = await supabase
      .from('staff')
      .select('id, email, extended_data')
      .ilike('email', email)
      .single();

    const typedStaff = staff as StaffRecord | null;

    if (!typedStaff?.extended_data?.mfa?.secret) {
      return false;
    }

    return verifyTOTPCode(typedStaff.extended_data.mfa.secret, code);
  } catch (error) {
    console.error('[MFA] Error verifying TOTP:', error);
    return false;
  }
}

/**
 * Get MFA status for user
 */
export async function getMFAStatus(userId: string): Promise<MFAStatus> {
  try {
    const supabase = await getSupabase();

    const { data: staff } = await supabase
      .from('staff')
      .select('extended_data')
      .eq('id', userId)
      .single();

    const typedStaff = staff as StaffRecord | null;

    if (!typedStaff?.extended_data?.mfa) {
      return {
        enabled: false,
        verified: false,
        backupCodesRemaining: 0
      };
    }

    const mfa = typedStaff.extended_data.mfa;

    return {
      enabled: mfa.enabled || false,
      verified: mfa.verified || false,
      backupCodesRemaining: mfa.backupCodes ? mfa.backupCodes.length : 0
    };
  } catch (error) {
    console.error('[MFA] Error getting MFA status:', error);
    return {
      enabled: false,
      verified: false,
      backupCodesRemaining: 0
    };
  }
}

/**
 * Use backup code
 */
export async function useBackupCode(userId: string, code: string): Promise<boolean> {
  try {
    const supabase = await getSupabase();

    const { data: staff } = await supabase
      .from('staff')
      .select('id, extended_data')
      .eq('id', userId)
      .single();

    if (!staff?.extended_data?.mfa?.backupCodes || !staff.extended_data.mfa.backupCodes.includes(code)) {
      console.log('[MFA] Invalid backup code');
      return false;
    }

    // Remove used code
    const remainingCodes = staff.extended_data.mfa.backupCodes.filter((c: string) => c !== code);
    staff.extended_data.mfa.backupCodes = remainingCodes;
    staff.extended_data.mfa.lastUsed = new Date().toISOString();

    const { error } = await supabase
      .from('staff')
      .update({ extended_data: staff.extended_data })
      .eq('id', userId);

    if (error) {
      console.error('[MFA] Error using backup code:', error);
      return false;
    }

    console.log(`[MFA] Backup code used. Remaining codes: ${remainingCodes.length}`);
    return true;
  } catch (error) {
    console.error('[MFA] Error using backup code:', error);
    return false;
  }
}

/**
 * Disable MFA (admin action)
 */
export async function disableMFA(userId: string, reason: string): Promise<void> {
  try {
    const supabase = await getSupabase();

    const { data: staff } = await supabase
      .from('staff')
      .select('id, extended_data')
      .eq('id', userId)
      .single();

    const typedStaff = staff as StaffRecord | null;

    if (typedStaff) {
      const extendedData: StaffExtendedData = typedStaff.extended_data || {};
      extendedData.mfa = {
        enabled: false,
        verified: false,
        secret: undefined,
        backupCodes: undefined,
        disabledAt: new Date().toISOString(),
        disabledReason: reason
      };

      const { error } = await supabase
        .from('staff')
        .update({ extended_data: extendedData })
        .eq('id', userId);

      if (error) {
        throw new Error('Failed to disable MFA');
      }

      console.log('[MFA] MFA disabled for user reason:', reason);
    }
  } catch (error) {
    console.error('[MFA] Error disabling MFA:', error);
    throw error;
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  try {
    const newCodes = generateBackupCodes(10, 8);
    const supabase = await getSupabase();

    const { data: staff } = await supabase
      .from('staff')
      .select('id, extended_data')
      .eq('id', userId)
      .single();

    const typedStaff = staff as StaffRecord | null;

    if (typedStaff?.extended_data?.mfa) {
      const extendedData = typedStaff.extended_data;
      extendedData.mfa.backup_codes = newCodes;
      extendedData.mfa.lastUsed = new Date().toISOString();

      const { error } = await supabase
        .from('staff')
        .update({ extended_data: extendedData })
        .eq('id', userId);

      if (error) {
        throw new Error('Failed to regenerate backup codes');
      }
    }

    console.log('[MFA] Backup codes regenerated');
    return newCodes;
  } catch (error) {
    console.error('[MFA] Error regenerating backup codes:', error);
    throw error;
  }
}
