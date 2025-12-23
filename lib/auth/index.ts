// Auth module exports
export { auth } from './server';
export { signIn, signUp, signOut, useSession } from './client';
export { checkAccountLockout, recordFailedLogin, resetFailedAttempts, unlockAccount } from './lockout';
export { rateLimit, getClientIP } from './rate-limit';
export { createSession, deleteSession, deleteAllUserSessions, getUserSessions, validateSession, updateSessionActivity, cleanupExpiredSessions } from './session';
export { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel } from './password';
