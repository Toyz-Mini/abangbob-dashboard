interface PasswordValidation {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
    score: number;
}

/**
 * Validate password against security policy
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter  
 * - At least 1 number
 * - At least 1 special character
 */
export function validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
        errors.push('Minimum 8 aksara');
    } else {
        score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
        errors.push('Sekurang-kurangnya 1 huruf besar (A-Z)');
    } else {
        score += 1;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
        errors.push('Sekurang-kurangnya 1 huruf kecil (a-z)');
    } else {
        score += 1;
    }

    // Number check
    if (!/[0-9]/.test(password)) {
        errors.push('Sekurang-kurangnya 1 nombor (0-9)');
    } else {
        score += 1;
    }

    // Special character check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Sekurang-kurangnya 1 aksara khas (!@#$%^&*)');
    } else {
        score += 1;
    }

    // Common password check
    const commonPasswords = [
        'password', 'password123', '12345678', 'qwerty123',
        'admin123', 'letmein', 'welcome', 'monkey', 'master',
    ];
    if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
        errors.push('Password terlalu biasa');
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 5) strength = 'medium';
    if (score >= 7 && errors.length === 0) strength = 'strong';

    return {
        isValid: errors.length === 0,
        errors,
        strength,
        score: Math.min(score, 10),
    };
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
    switch (strength) {
        case 'weak': return '#ef4444';
        case 'medium': return '#f59e0b';
        case 'strong': return '#22c55e';
        default: return '#9ca3af';
    }
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: 'weak' | 'medium' | 'strong'): string {
    switch (strength) {
        case 'weak': return 'Lemah';
        case 'medium': return 'Sederhana';
        case 'strong': return 'Kuat';
        default: return '';
    }
}
