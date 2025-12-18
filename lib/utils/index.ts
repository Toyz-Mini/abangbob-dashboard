/**
 * Utility functions
 */

export * from './sanitize';
export * from './sync-logger';

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-BN', {
        style: 'currency',
        currency: 'BND',
        minimumFractionDigits: 2
    }).format(amount);
}



