/**
 * Promotion Validity Helpers
 * Checks if a promotion is valid based on date, day of week, and time constraints.
 */

import { Promotion } from '@/lib/types';

interface PromotionValidityResult {
    isValid: boolean;
    reason?: string;
}

/**
 * Check if a promotion is currently valid
 */
export function isPromotionValid(promotion: Promotion, purchaseAmount: number = 0): PromotionValidityResult {
    const now = new Date();

    // 1. Check if promotion is active
    if (promotion.status !== 'active') {
        return { isValid: false, reason: 'Promosi tidak aktif' };
    }

    // 2. Check date range
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    endDate.setHours(23, 59, 59, 999); // Include entire end day

    if (now < startDate) {
        return { isValid: false, reason: `Promosi bermula pada ${startDate.toLocaleDateString('ms-MY')}` };
    }

    if (now > endDate) {
        return { isValid: false, reason: 'Promosi telah tamat tempoh' };
    }

    // 3. Check day of week (if specified)
    if (promotion.daysOfWeek && promotion.daysOfWeek.length > 0) {
        const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
        if (!promotion.daysOfWeek.includes(currentDay)) {
            const daysLabels = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
            const validDays = promotion.daysOfWeek.map(d => daysLabels[d]).join(', ');
            return { isValid: false, reason: `Promosi hanya sah pada: ${validDays}` };
        }
    }

    // 4. Check time range (Happy Hour support)
    if (promotion.startTime && promotion.endTime) {
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Handle overnight promotions (e.g., 22:00 - 02:00)
        if (promotion.startTime > promotion.endTime) {
            // Overnight: valid if current time >= start OR current time <= end
            if (currentTime < promotion.startTime && currentTime > promotion.endTime) {
                return { isValid: false, reason: `Promosi hanya sah dari ${promotion.startTime} hingga ${promotion.endTime}` };
            }
        } else {
            // Normal: valid if current time is between start and end
            if (currentTime < promotion.startTime || currentTime > promotion.endTime) {
                return { isValid: false, reason: `Promosi hanya sah dari ${promotion.startTime} hingga ${promotion.endTime}` };
            }
        }
    }

    // 5. Check minimum purchase
    if (promotion.minPurchase && promotion.minPurchase > 0 && purchaseAmount < promotion.minPurchase) {
        return { isValid: false, reason: `Minimum pembelian BND ${promotion.minPurchase.toFixed(2)}` };
    }

    // 6. Check usage limit
    if (promotion.usageLimit && promotion.usageLimit > 0 && promotion.usageCount >= promotion.usageLimit) {
        return { isValid: false, reason: 'Kuota promosi telah habis' };
    }

    return { isValid: true };
}

/**
 * Calculate discount amount for a promotion
 */
export function calculatePromotionDiscount(promotion: Promotion, orderTotal: number): number {
    const validity = isPromotionValid(promotion, orderTotal);
    if (!validity.isValid) return 0;

    let discount = 0;

    switch (promotion.type) {
        case 'percentage':
            discount = (orderTotal * promotion.value) / 100;
            if (promotion.maxDiscount && promotion.maxDiscount > 0) {
                discount = Math.min(discount, promotion.maxDiscount);
            }
            break;
        case 'fixed_amount':
            discount = Math.min(promotion.value, orderTotal);
            break;
        case 'bogo':
            // BOGO logic would need item-level calculation
            // For now, return 0 as it needs special handling
            discount = 0;
            break;
        case 'free_item':
            // Free item logic would need item-level calculation
            discount = 0;
            break;
    }

    return Math.round(discount * 100) / 100; // Round to 2 decimal places
}

/**
 * Get all currently valid promotions from a list
 */
export function getValidPromotions(promotions: Promotion[], orderTotal: number = 0): Promotion[] {
    return promotions.filter(promo => isPromotionValid(promo, orderTotal).isValid);
}

/**
 * Find promotion by code
 */
export function findPromotionByCode(promotions: Promotion[], code: string): Promotion | undefined {
    const normalizedCode = code.trim().toUpperCase();
    return promotions.find(p => p.promoCode?.toUpperCase() === normalizedCode);
}
