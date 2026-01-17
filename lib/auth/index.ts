// Auth module exports - Supabase Auth only
// Only non-auth-specific utilities remain

export { checkAccountLockout, recordFailedLogin, resetFailedAttempts, unlockAccount } from './lockout';
export { rateLimit, getClientIP } from './rate-limit';
export { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel } from './password';
