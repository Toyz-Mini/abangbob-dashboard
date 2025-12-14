/**
 * Security Utilities for XSS Prevention and Input Sanitization
 * 
 * This module provides functions to sanitize user inputs and prevent
 * Cross-Site Scripting (XSS) attacks.
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 * This is used for displaying user-generated content safely
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#96;');
}

/**
 * Sanitize input by removing potentially dangerous characters and scripts
 * Use this for form inputs before storing or processing
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  // Remove any script tags and their contents
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onload, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '');
  
  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/data\s*:/gi, '');
  
  // Remove any remaining HTML tags (for plain text fields)
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  return sanitized.trim();
}

/**
 * Sanitize a PIN input - only allow numeric characters
 * This is specifically for PIN fields to prevent injection
 */
export function sanitizePinInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Only allow digits
  return input.replace(/[^0-9]/g, '');
}

/**
 * Sanitize phone number input - allow digits, +, -, (, ), and spaces
 */
export function sanitizePhoneInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/[^0-9+\-() ]/g, '');
}

/**
 * Sanitize email input - basic validation and cleanup
 */
export function sanitizeEmailInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove any characters that shouldn't be in an email
  return input.replace(/[<>"'`;\\/]/g, '').trim().toLowerCase();
}

/**
 * Sanitize numeric input - parse to number safely
 */
export function sanitizeNumericInput(input: string | number): number {
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : input;
  }
  
  const parsed = parseFloat(String(input).replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Sanitize text for display in HTML attributes
 */
export function sanitizeForAttribute(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  return input
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Create a safe text node content - removes all HTML
 */
export function toPlainText(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  // Create a temporary element to decode HTML entities then strip tags
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = input;
    return temp.textContent || temp.innerText || '';
  }
  
  // Server-side fallback
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Validate and sanitize a URL
 */
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  const trimmed = input.trim();
  
  // Block dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '';
  }
  
  // Allow http, https, mailto, tel
  if (/^(https?|mailto|tel):/i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }
  
  // If no protocol, assume relative path
  if (!trimmed.includes(':')) {
    return trimmed;
  }
  
  return '';
}

/**
 * Check if input contains potential XSS patterns
 */
export function containsXssPattern(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<style/i,
    /expression\s*\(/i,
    /url\s*\(/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Log potential XSS attempt for monitoring
 */
export function logSecurityEvent(type: string, input: string, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[SECURITY] ${type}: Suspicious input detected`, {
      input: input.substring(0, 100),
      context,
      timestamp: new Date().toISOString(),
    });
  }
  
  // In production, you might want to send this to a logging service
  // For now, we just log in development
}
