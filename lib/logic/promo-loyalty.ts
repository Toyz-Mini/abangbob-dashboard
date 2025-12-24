import { getSupabaseClient } from '@/lib/supabase/client';
import { PromoCode } from '@/lib/supabase/types';

const supabase = getSupabaseClient();

export type PromoValidationResult = {
    isValid: boolean;
    discountAmount: number;
    promoCode?: PromoCode;
    error?: string;
};

// 1. Verify Promo Code
export async function verifyPromoCode(code: string, subtotal: number): Promise<PromoValidationResult> {
    if (!supabase) return { isValid: false, discountAmount: 0, error: 'Database connection failed.' };
    try {
        const { data, error } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return { isValid: false, discountAmount: 0, error: 'Kod promo tidak sah atau telah tamat tempoh.' };
        }

        const promo = data as PromoCode;
        const now = new Date();

        // Check Date Validity
        if (promo.start_date && new Date(promo.start_date) > now) {
            return { isValid: false, discountAmount: 0, error: 'Kod promo belum bermula.' };
        }
        if (promo.end_date && new Date(promo.end_date) < now) {
            return { isValid: false, discountAmount: 0, error: 'Kod promo telah tamat.' };
        }

        // Check Usage Limit (Global)
        if (promo.usage_limit && promo.usage_limit > 0 && promo.usage_count >= promo.usage_limit) {
            return { isValid: false, discountAmount: 0, error: 'Kod promo telah habis ditebus.' };
        }

        // Check Min Spend
        if (subtotal < promo.min_spend) {
            return { isValid: false, discountAmount: 0, error: `Belanja minimum BND ${promo.min_spend.toFixed(2)} diperlukan.` };
        }

        // Calculate Discount
        let discount = 0;
        if (promo.discount_type === 'percentage') {
            discount = (subtotal * promo.discount_value) / 100;
            if (promo.max_discount_amount) {
                discount = Math.min(discount, promo.max_discount_amount);
            }
        } else {
            discount = promo.discount_value;
        }

        // Ensure discount doesn't exceed subtotal
        discount = Math.min(discount, subtotal);

        // 1. Earn 1 point for every BND 1 spent
        // 2. Redeem 100 points for BND 5 discount
        // 3. Minimum points to redeem: 100

        return {
            isValid: true,
            discountAmount: discount,
            promoCode: promo
        };
    } catch (error) {
        console.error('Promo validation error:', error);
        return { isValid: false, discountAmount: 0, error: 'Ralat semasa menyemak kod promo.' };
    }
}

// 2. Get Customer Points
export async function getCustomerPoints(customerId: string): Promise<number> {
    if (!supabase) return 0;

    const { data } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single();

    const customer = data as any;
    return customer?.loyalty_points || 0;
}

/**
 * Calculates earnings: 1 Point per BND 1 (FLOOR)
 */
export function calculatePointsEarned(finalTotal: number): number {
    return Math.floor(finalTotal); // 1 point per BND 1
}


// 4. Calculate Redemption Value (Logic: 100 Points = BND 5)
export const POINTS_CONVERSION_RATE = 100; // 100 Points
export const CASH_VALUE_PER_RATE = 5;      // BND 5

/**
 * Calculates redemption value: 100 Points = BND 5
 */
export function calculateRedemptionValue(points: number): number {
    if (points < POINTS_CONVERSION_RATE) return 0;
    const blocks = Math.floor(points / POINTS_CONVERSION_RATE);
    return blocks * CASH_VALUE_PER_RATE; // BND 5 per 100 points
}
