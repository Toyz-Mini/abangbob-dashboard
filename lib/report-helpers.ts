import { Order } from './types';
import { format, isSameDay, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export interface DailySalesData {
    date: string; // ISO date YYYY-MM-DD
    orderCount: number;
    grossTotal: number;
    netTotal: number;
    discountTotal: number;
    redemptionTotal: number;
    refundTotal: number;
}

export interface SalesReportSummary {
    rangeStart: Date;
    rangeEnd: Date;
    totalOrders: number;
    totalGross: number;
    totalNet: number;
    totalDiscounts: number;
    totalRedemptions: number;
    totalRefunds: number;
    averageOrderValue: number;
}

/**
 * Filter orders by date range
 */
export function filterOrdersByDate(orders: Order[], startDate: Date, endDate: Date): Order[] {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    return orders.filter(order => {
        // Only include completed orders for sales reports
        if (order.status !== 'completed' && order.status !== 'ready') return false;

        const orderDate = new Date(order.createdAt);
        return isWithinInterval(orderDate, { start, end });
    });
}

/**
 * Generate daily breakdown from orders
 */
export function generateDailyReport(orders: Order[], startDate: Date, endDate: Date): DailySalesData[] {
    const dailyMap = new Map<string, DailySalesData>();

    // Initialize map with all days in range (fill gaps with 0)
    const current = new Date(startDate);
    while (current <= endDate) {
        const dateStr = format(current, 'yyyy-MM-dd');
        dailyMap.set(dateStr, {
            date: dateStr,
            orderCount: 0,
            grossTotal: 0,
            netTotal: 0,
            discountTotal: 0,
            redemptionTotal: 0,
            refundTotal: 0
        });
        current.setDate(current.getDate() + 1);
    }

    // Aggregate data
    orders.forEach(order => {
        const dateStr = format(new Date(order.createdAt), 'yyyy-MM-dd');
        if (dailyMap.has(dateStr)) {
            const data = dailyMap.get(dateStr)!;

            // Calculations
            // Assuming order.total is NET (what customer pays cash + card)
            // If we want Gross, we might need to add back discounts or redemptions depending on storage strategy.
            // Based on previous implementation: 
            // addOrder sets total = cartTotal (which is after per-item discount? no, cartTotal = subtotal - discount)
            // Wait, let's checking store.tsx addOrder...
            // store.tsx: total: cartTotal
            // cartTotal = cartSubtotal - discountAmount
            // So order.total is effectively "Post-Discount Pre-Redemption"?
            // Let's check redemption logic:
            // In POS: finalPayable = max(0, cartTotal - redemptionAmount)
            // order.total stored is cartTotal.
            // order.redemptionAmount is stored separately.

            const orderTotal = order.total; // This is (Subtotal - Item Discounts - Order Discount)
            const redemption = order.redemptionAmount || 0;
            // Net Sales = Cash/Card collected = Total - Redemption
            const net = Math.max(0, orderTotal - redemption);

            data.orderCount += 1;
            data.grossTotal += orderTotal; // Actually this is "Sales after discount", let's call it Gross for now relative to redemption
            data.netTotal += net;
            data.redemptionTotal += redemption;

            // Note: Refund tracking needs 'refundedAmount' or similar if we implemented it?
            // For now we assume completed orders unless we check another field.
        }
    });

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate summary from filtered orders
 */
export function generateReportSummary(orders: Order[], startDate: Date, endDate: Date): SalesReportSummary {
    const summary: SalesReportSummary = {
        rangeStart: startDate,
        rangeEnd: endDate,
        totalOrders: 0,
        totalGross: 0,
        totalNet: 0,
        totalDiscounts: 0,
        totalRedemptions: 0,
        totalRefunds: 0,
        averageOrderValue: 0
    };

    orders.forEach(order => {
        const orderTotal = order.total;
        const redemption = order.redemptionAmount || 0;
        const net = Math.max(0, orderTotal - redemption);

        summary.totalOrders += 1;
        summary.totalGross += orderTotal;
        summary.totalNet += net;
        summary.totalRedemptions += redemption;
    });

    summary.averageOrderValue = summary.totalOrders > 0
        ? summary.totalNet / summary.totalOrders
        : 0;

    return summary;
}

/**
 * Convert JSON data to CSV string and trigger download
 */
export function downloadCSV(data: any[], filename: string) {
    if (data.length === 0) return;

    // Extract headers
    const headers = Object.keys(data[0]);

    // Convert to CSV string
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(header => {
                const val = row[header];
                // Handle strings with commas or quotes
                if (typeof val === 'string') {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }).join(',')
        )
    ].join('\n');

    // Create blob and simple link download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
