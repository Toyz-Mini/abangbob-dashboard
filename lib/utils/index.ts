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


export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

