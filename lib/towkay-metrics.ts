import { InventoryLog, Order, StaffProfile, CashRegister, StaffKPI, AttendanceRecord, ScheduleEntry, Shift, MenuItem, StockItem, Customer } from './types';

// ============ TYPES ============

export interface RiskMetric {
    id: string;
    type: 'theft' | 'waste' | 'efficiency' | 'fraud' | 'cost';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    value: string;
    timestamp: string;
    staffName?: string;
    actionLabel?: string;
}

export interface OpportunityMetric {
    id: string;
    type: 'sales' | 'menu' | 'customer' | 'efficiency' | 'scheduling';
    title: string;
    description: string;
    potentialValue: string;
    actionLabel?: string;
}

export interface StaffLeaderboardEntry {
    staffId: string;
    name: string;
    role: string;
    points: number;
    badges: string[];
    breakdown?: {
        salesPoints: number;
        speedPoints: number;
        attendancePoints: number;
        reviewPoints: number;
    };
}

export interface OperationsMetric {
    avgPrepTime: number; // minutes
    peakHour: string;
    ordersPerHour: number;
    kitchenLagAlerts: number;
}

export interface AISchedulerSuggestion {
    id: string;
    type: 'understaffed' | 'overstaffed' | 'optimal';
    timeSlot: string;
    currentStaff: number;
    suggestedStaff: number;
    reason: string;
}

export interface RevenueForecast {
    date: string;
    predictedSales: number;
    confidence: 'low' | 'medium' | 'high';
    trend: 'up' | 'down' | 'stable';
}

export interface ChurnRiskCustomer {
    customerId: string;
    name: string;
    phone?: string;
    lastVisit: string;
    daysSinceVisit: number;
    totalSpent: number;
    visitCount: number;
}

export interface AnomalyAlert {
    id: string;
    type: 'sales_spike' | 'sales_drop' | 'unusual_void' | 'inventory_anomaly';
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    value: string;
    timestamp: string;
}

export interface QuickActionsSummary {
    pendingLeaveRequests: number;
    pendingClaimRequests: number;
    pendingVoidRequests: number;
    lowStockItems: number;
    staffOnDuty: number;
    todayBirthdays: string[];
}

export interface AutoReorderSuggestion {
    itemId: string;
    itemName: string;
    currentQty: number;
    minQty: number;
    suggestedQty: number;
    estimatedCost: number;
    supplier?: string;
    urgency: 'low' | 'medium' | 'high';
    reason: string;
}

export interface TowkayStats {
    financial: {
        realtimeProfit: number;
        projectedCashFlow: number;
        dailySales: number;
        dailyShortage: number;
        laborCostPercent: number;
        foodCostPercent: number;
    };
    operations: OperationsMetric;
    risks: RiskMetric[];
    opportunities: OpportunityMetric[];
    staffLeaderboard: StaffLeaderboardEntry[];
    aiScheduler: AISchedulerSuggestion[];
    stockoutWarnings: { itemName: string; daysLeft: number; urgency: 'low' | 'medium' | 'high' }[];
    revenueForecast: RevenueForecast[];
    churnRisk: ChurnRiskCustomer[];
    anomalies: AnomalyAlert[];
    quickActions: QuickActionsSummary;
    autoReorder: AutoReorderSuggestion[];
}

export interface DataContext {
    orders: Order[];
    inventoryLogs: InventoryLog[];
    cashRegisters: CashRegister[];
    staff: StaffProfile[];
    staffKPI: StaffKPI[];
    attendance?: AttendanceRecord[];
    schedules?: ScheduleEntry[];
    shifts?: Shift[];
    menuItems?: MenuItem[];
    inventory?: StockItem[];
    customers?: Customer[];
}

// ============ CONSTANTS ============
const DISCOUNT_ABUSE_THRESHOLD = 0.20; // 20%
const HIGH_VOID_THRESHOLD = 5;
const KITCHEN_LAG_THRESHOLD_MINS = 15;
const STOCKOUT_WARNING_DAYS = 3;

// ============ HELPER FUNCTIONS ============

function getStaffName(id: string | undefined, staffList: StaffProfile[]): string {
    if (!id) return 'Unknown';
    const s = staffList.find(st => st.id === id);
    return s ? s.name : 'Unknown';
}

function parseTime(timeStr: string): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
}

function getHourFromDate(dateStr: string): number {
    try {
        return new Date(dateStr).getHours();
    } catch {
        return 12;
    }
}

// ============ MAIN AGGREGATOR ============

export function calculateTowkayStats(data: DataContext): TowkayStats {
    const { orders, inventoryLogs, cashRegisters, staff, staffKPI, attendance = [], schedules = [], shifts = [], menuItems = [], inventory = [] } = data;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // =====================
    // 1. FINANCIAL VITALS
    // =====================
    const todayOrders = orders.filter(o => o.createdAt?.startsWith(todayStr) && o.status !== 'cancelled');
    const dailySales = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const realtimeProfit = dailySales * 0.35; // 35% net margin assumption

    const hoursOpen = Math.max(1, now.getHours() - 10);
    const projectedCashFlow = (dailySales / hoursOpen) * 12;

    const todayRegisters = cashRegisters.filter(r => r.closedAt?.startsWith(todayStr));
    const dailyShortage = todayRegisters.reduce((sum, r) => sum + (r.variance || 0), 0);

    // Labor Cost % (simplified: assume RM15/hr per staff on duty)
    const staffOnDuty = attendance.filter(a => a.date === todayStr && a.clockInTime && !a.clockOutTime).length || staff.filter(s => s.status === 'active').length;
    const laborCost = staffOnDuty * hoursOpen * 15;
    const laborCostPercent = dailySales > 0 ? (laborCost / dailySales) * 100 : 0;

    // Food Cost % (simplified: 30% assumption)
    const foodCostPercent = 30;

    // =====================
    // 2. OPERATIONS METRICS
    // =====================
    let totalPrepTime = 0;
    let prepCount = 0;
    const hourlyOrders: Record<number, number> = {};

    todayOrders.forEach(o => {
        // Prep Time: readyAt - preparingStartedAt
        if (o.preparingStartedAt && o.readyAt) {
            const start = new Date(o.preparingStartedAt).getTime();
            const end = new Date(o.readyAt).getTime();
            const mins = (end - start) / 60000;
            if (mins > 0 && mins < 120) { // sanity check
                totalPrepTime += mins;
                prepCount++;
            }
        }
        // Count orders per hour
        const hour = getHourFromDate(o.createdAt);
        hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
    });

    const avgPrepTime = prepCount > 0 ? Math.round(totalPrepTime / prepCount) : 0;
    const peakHourEntry = Object.entries(hourlyOrders).sort((a, b) => b[1] - a[1])[0];
    const peakHour = peakHourEntry ? `${peakHourEntry[0]}:00` : '12:00';
    const ordersPerHour = hoursOpen > 0 ? Math.round(todayOrders.length / hoursOpen) : 0;

    const kitchenLagAlerts = todayOrders.filter(o => {
        if (o.preparingStartedAt && o.readyAt) {
            const mins = (new Date(o.readyAt).getTime() - new Date(o.preparingStartedAt).getTime()) / 60000;
            return mins > KITCHEN_LAG_THRESHOLD_MINS;
        }
        return false;
    }).length;

    // =====================
    // 3. RISK DETECTION
    // =====================
    const risks: RiskMetric[] = [];

    // A. Discount Abuse
    todayOrders.forEach(o => {
        if (o.discount && o.subtotal && (o.discount / o.subtotal > DISCOUNT_ABUSE_THRESHOLD)) {
            risks.push({
                id: `disc-${o.id}`,
                type: 'fraud',
                severity: 'high',
                title: 'High Discount Alert',
                description: `Order #${o.orderNumber?.slice(-4) || o.id.slice(-4)} had ${Math.round((o.discount / o.subtotal) * 100)}% discount.`,
                value: `-BND ${o.discount.toFixed(2)}`,
                timestamp: o.createdAt,
                staffName: getStaffName(o.staffId, staff),
                actionLabel: 'Review Order'
            });
        }
    });

    // B. High Void Rate
    const cancelledOrders = orders.filter(o => o.createdAt?.startsWith(todayStr) && o.status === 'cancelled');
    if (cancelledOrders.length > HIGH_VOID_THRESHOLD) {
        risks.push({
            id: 'void-high',
            type: 'fraud',
            severity: 'critical',
            title: 'Abnormal Void Rate',
            description: `${cancelledOrders.length} orders cancelled today. Normal is <${HIGH_VOID_THRESHOLD}.`,
            value: `${cancelledOrders.length} Voids`,
            timestamp: now.toISOString(),
            actionLabel: 'Investigate'
        });
    }

    // C. Food Waste
    const wasteLogs = inventoryLogs.filter(l =>
        l.createdAt?.startsWith(todayStr) &&
        l.type === 'adjustment' &&
        l.quantity < 0
    );

    const totalWasteValue = wasteLogs.reduce((sum, l) => sum + Math.abs(l.quantity) * 5, 0);
    if (totalWasteValue > 20) {
        risks.push({
            id: 'waste-total',
            type: 'waste',
            severity: totalWasteValue > 100 ? 'critical' : 'medium',
            title: 'Food Waste Detected',
            description: `${wasteLogs.length} adjustment(s) totaling significant loss.`,
            value: `-BND ${totalWasteValue.toFixed(2)}`,
            timestamp: now.toISOString(),
            actionLabel: 'Review Logs'
        });
    }

    // D. Kitchen Lag Alert
    if (kitchenLagAlerts > 3) {
        risks.push({
            id: 'kitchen-lag',
            type: 'efficiency',
            severity: 'high',
            title: 'Kitchen Slow Down',
            description: `${kitchenLagAlerts} orders took >${KITCHEN_LAG_THRESHOLD_MINS} mins to prepare.`,
            value: `${kitchenLagAlerts} Delays`,
            timestamp: now.toISOString(),
            actionLabel: 'Check Kitchen'
        });
    }

    // E. Overtime Alert (simplified)
    const currentHour = now.getHours();
    if (currentHour > 21 && staffOnDuty > 2) {
        risks.push({
            id: 'overtime-risk',
            type: 'cost',
            severity: 'medium',
            title: 'Potential Overtime',
            description: `${staffOnDuty} staff still on duty after 9PM.`,
            value: `+BND ${(staffOnDuty * 10).toFixed(2)} Est.`,
            timestamp: now.toISOString(),
            actionLabel: 'Review Schedule'
        });
    }

    // =====================
    // 4. OPPORTUNITIES
    // =====================
    const opportunities: OpportunityMetric[] = [];

    // A. Zombie Items (Items with 0 sales in last 7 days)
    if (menuItems.length > 0) {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const recentOrders = orders.filter(o => o.createdAt >= sevenDaysAgo);
        const soldItemIds = new Set<string>();
        recentOrders.forEach(o => o.items?.forEach(item => soldItemIds.add(item.id)));

        const zombieItems = menuItems.filter(m => m.isAvailable && !soldItemIds.has(m.id));
        if (zombieItems.length > 0) {
            opportunities.push({
                id: 'zombie-items',
                type: 'menu',
                title: `${zombieItems.length} Zombie Item(s)`,
                description: `${zombieItems[0]?.name || 'Items'} had 0 sales in 7 days. Consider removing.`,
                potentialValue: '+5% Kitchen Speed',
                actionLabel: 'Review Menu'
            });
        }
    }

    // B. Upsell Opportunity (simplified)
    const ordersWithoutDrink = todayOrders.filter(o => {
        const hasDrink = o.items?.some(i => i.name?.toLowerCase().includes('drink') || i.name?.toLowerCase().includes('air'));
        return !hasDrink;
    });
    const upsellPercent = todayOrders.length > 0 ? Math.round((ordersWithoutDrink.length / todayOrders.length) * 100) : 0;
    if (upsellPercent > 50) {
        opportunities.push({
            id: 'upsell-drink',
            type: 'sales',
            title: 'Missed Upsell',
            description: `${upsellPercent}% of orders had no drink. Train staff to suggest.`,
            potentialValue: `+BND ${Math.round(ordersWithoutDrink.length * 2)}/day`,
            actionLabel: 'Train Staff'
        });
    }

    // C. Peak Hour Staffing
    if (peakHourEntry && peakHourEntry[1] > 10) {
        opportunities.push({
            id: 'peak-staff',
            type: 'scheduling',
            title: 'Peak Hour Opportunity',
            description: `${peakHour} is busiest (${peakHourEntry[1]} orders). Ensure adequate staff.`,
            potentialValue: '+15% Speed',
            actionLabel: 'Adjust Schedule'
        });
    }

    // =====================
    // 5. STOCKOUT FORECAST
    // =====================
    const stockoutWarnings: { itemName: string; daysLeft: number; urgency: 'low' | 'medium' | 'high' }[] = [];

    if (inventory.length > 0) {
        inventory.forEach(item => {
            if (item.currentQuantity <= item.minQuantity) {
                const daysLeft = item.currentQuantity > 0 ? Math.ceil(item.currentQuantity / Math.max(1, (item.minQuantity / 7))) : 0;
                stockoutWarnings.push({
                    itemName: item.name,
                    daysLeft,
                    urgency: daysLeft <= 1 ? 'high' : daysLeft <= 3 ? 'medium' : 'low'
                });
            }
        });
    }

    // Add stockout as risk if critical
    const criticalStock = stockoutWarnings.filter(s => s.urgency === 'high');
    if (criticalStock.length > 0) {
        risks.push({
            id: 'stockout-critical',
            type: 'efficiency',
            severity: 'critical',
            title: 'Stockout Imminent',
            description: `${criticalStock.length} item(s) will run out: ${criticalStock[0].itemName}`,
            value: `${criticalStock.length} Items`,
            timestamp: now.toISOString(),
            actionLabel: 'Reorder Now'
        });
    }

    // =====================
    // 5.5 AUTO-REORDER SUGGESTIONS
    // =====================
    const autoReorder: AutoReorderSuggestion[] = [];

    if (inventory.length > 0) {
        // Analyze usage from inventory logs
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const recentLogs = inventoryLogs.filter(log =>
            log.createdAt >= sevenDaysAgo &&
            (log.type === 'out' || log.type === 'adjustment')
        );

        // Calculate daily usage per item (only count 'out' transactions)
        const usageByItem: Record<string, number> = {};
        recentLogs.forEach(log => {
            if (log.type === 'out') {
                usageByItem[log.stockItemId] = (usageByItem[log.stockItemId] || 0) + log.quantity;
            } else if (log.type === 'adjustment' && log.newQuantity < log.previousQuantity) {
                const consumed = log.previousQuantity - log.newQuantity;
                usageByItem[log.stockItemId] = (usageByItem[log.stockItemId] || 0) + consumed;
            }
        });

        inventory.forEach(item => {
            const weeklyUsage = usageByItem[item.id] || 0;
            const dailyUsage = weeklyUsage / 7;
            const daysOfStock = dailyUsage > 0 ? item.currentQuantity / dailyUsage : 999;

            // Suggest reorder if will run out within 5 days or below minQty
            if ((daysOfStock <= 5 && dailyUsage > 0) || item.currentQuantity <= item.minQuantity) {
                // Calculate suggested order (enough for 14 days + buffer)
                const targetStock = Math.ceil(dailyUsage * 14) + item.minQuantity;
                const suggestedQty = Math.max(item.minQuantity, targetStock - item.currentQuantity);

                if (suggestedQty > 0) {
                    autoReorder.push({
                        itemId: item.id,
                        itemName: item.name,
                        currentQty: item.currentQuantity,
                        minQty: item.minQuantity,
                        suggestedQty: Math.ceil(suggestedQty),
                        estimatedCost: suggestedQty * item.cost,
                        supplier: item.supplier,
                        urgency: daysOfStock <= 1 ? 'high' : daysOfStock <= 3 ? 'medium' : 'low',
                        reason: item.currentQuantity <= item.minQuantity
                            ? 'Di bawah kuantiti minimum'
                            : `Dijangka habis dalam ${Math.ceil(daysOfStock)} hari`
                    });
                }
            }
        });

        // Sort by urgency
        autoReorder.sort((a, b) => {
            const urgencyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
            return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        });
    }

    // =====================
    // 6. AI SCHEDULER
    // =====================
    const aiScheduler: AISchedulerSuggestion[] = [];

    // Simplified: suggest based on hourly order patterns
    Object.entries(hourlyOrders).forEach(([hour, count]) => {
        const h = parseInt(hour);
        const idealStaff = Math.ceil(count / 5); // 5 orders/hr per staff
        const scheduledStaff = schedules.filter(s => {
            if (s.date !== todayStr) return false;
            const start = parseTime(s.startTime);
            const end = parseTime(s.endTime);
            const current = h * 60;
            return current >= start && current < end;
        }).length || Math.ceil(staffOnDuty / 2);

        if (idealStaff > scheduledStaff) {
            aiScheduler.push({
                id: `ai-${hour}`,
                type: 'understaffed',
                timeSlot: `${hour}:00 - ${parseInt(hour) + 1}:00`,
                currentStaff: scheduledStaff,
                suggestedStaff: idealStaff,
                reason: `${count} orders expected, need ${idealStaff} staff.`
            });
        } else if (idealStaff < scheduledStaff - 1 && scheduledStaff > 2) {
            aiScheduler.push({
                id: `ai-${hour}`,
                type: 'overstaffed',
                timeSlot: `${hour}:00 - ${parseInt(hour) + 1}:00`,
                currentStaff: scheduledStaff,
                suggestedStaff: idealStaff,
                reason: `Only ${count} orders, can reduce to ${idealStaff} staff.`
            });
        }
    });

    // =====================
    // 7. GAMIFICATION LEADERBOARD
    // =====================
    const leaderboard: StaffLeaderboardEntry[] = staff.slice(0, 10).map(s => {
        const kpi = staffKPI.find(k => k.staffId === s.id);
        const staffOrders = todayOrders.filter(o => o.staffId === s.id);
        const staffSales = staffOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        // Calculate points
        const salesPoints = Math.round(staffSales / 10); // 1 point per BND 10
        const speedPoints = staffOrders.length * 5; // 5 points per order
        const attendancePoints = attendance.find(a => a.staffId === s.id && a.date === todayStr && a.clockInTime) ? 50 : 0;
        const reviewPoints = kpi ? Math.round(kpi.overallScore * 5) : 0;

        const totalPoints = salesPoints + speedPoints + attendancePoints + reviewPoints;

        // Assign badges
        const badges: string[] = [];
        if (salesPoints > 100) badges.push('💰 Sales Star');
        if (speedPoints > 50) badges.push('⚡ Speed Demon');
        if (attendancePoints === 50) badges.push('✅ On Time');
        if (totalPoints > 200) badges.push('🔥 Top Performer');

        return {
            staffId: s.id,
            name: s.name,
            role: s.role,
            points: totalPoints,
            badges,
            breakdown: { salesPoints, speedPoints, attendancePoints, reviewPoints }
        };
    }).sort((a, b) => b.points - a.points);

    // =====================
    // 8. REVENUE FORECAST (God Mode 2.0)
    // =====================
    const revenueForecast: RevenueForecast[] = [];

    // Calculate average daily sales from last 7 days
    const last7Days: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        const daySales = orders
            .filter(o => o.createdAt?.startsWith(dateStr) && o.status !== 'cancelled')
            .reduce((sum, o) => sum + (o.total || 0), 0);
        last7Days[dateStr] = daySales;
    }

    const avgDailySales = Object.values(last7Days).reduce((a, b) => a + b, 0) / 7;
    const salesTrend = dailySales > avgDailySales * 1.1 ? 'up' : dailySales < avgDailySales * 0.9 ? 'down' : 'stable';

    // Predict next 7 days
    for (let i = 1; i <= 7; i++) {
        const futureDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        const dayOfWeek = futureDate.getDay();
        // Weekend bump: +20%
        const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
        revenueForecast.push({
            date: futureDate.toISOString().split('T')[0],
            predictedSales: Math.round(avgDailySales * weekendMultiplier),
            confidence: avgDailySales > 100 ? 'high' : avgDailySales > 50 ? 'medium' : 'low',
            trend: salesTrend
        });
    }

    // =====================
    // 9. ANOMALY DETECTION (God Mode 2.0)
    // =====================
    const anomalies: AnomalyAlert[] = [];

    // Check for sales spike/drop
    if (dailySales > avgDailySales * 1.5) {
        anomalies.push({
            id: 'anomaly-spike',
            type: 'sales_spike',
            severity: 'medium',
            title: 'Sales Spike Detected',
            description: `Today's sales are ${Math.round((dailySales / avgDailySales - 1) * 100)}% above average.`,
            value: `+${Math.round((dailySales / avgDailySales - 1) * 100)}%`,
            timestamp: now.toISOString()
        });
    } else if (dailySales < avgDailySales * 0.5 && hoursOpen > 4) {
        anomalies.push({
            id: 'anomaly-drop',
            type: 'sales_drop',
            severity: 'high',
            title: 'Sales Drop Alert',
            description: `Today's sales are ${Math.round((1 - dailySales / avgDailySales) * 100)}% below average.`,
            value: `-${Math.round((1 - dailySales / avgDailySales) * 100)}%`,
            timestamp: now.toISOString()
        });
    }

    // Unusual void pattern
    if (cancelledOrders.length > 3 && cancelledOrders.length > todayOrders.length * 0.2) {
        anomalies.push({
            id: 'anomaly-void',
            type: 'unusual_void',
            severity: 'high',
            title: 'Unusual Void Pattern',
            description: `${Math.round(cancelledOrders.length / todayOrders.length * 100)}% of orders voided - investigate.`,
            value: `${cancelledOrders.length} voids`,
            timestamp: now.toISOString()
        });
    }

    // =====================
    // 10. QUICK ACTIONS SUMMARY (God Mode 2.0)
    // =====================
    const quickActions: QuickActionsSummary = {
        pendingLeaveRequests: 0, // Would need leaveRequests in DataContext
        pendingClaimRequests: 0, // Would need claimRequests in DataContext
        pendingVoidRequests: 0,  // Would need voidRequests in DataContext
        lowStockItems: stockoutWarnings.filter(s => s.urgency === 'high' || s.urgency === 'medium').length,
        staffOnDuty: staffOnDuty,
        todayBirthdays: [] // Would need staff birthDates
    };

    // =====================
    // 11. CHURN RISK (God Mode 2.0)
    // =====================
    const churnRisk: ChurnRiskCustomer[] = [];
    const customers = data.customers || [];
    const churnNow = new Date();

    customers.forEach(customer => {
        if (!customer.lastOrderAt) return;

        const lastVisit = new Date(customer.lastOrderAt);
        const daysSinceVisit = Math.floor((churnNow.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

        // Consider at risk if haven't visited in 30+ days and was previously regular
        if (daysSinceVisit >= 30 && customer.totalOrders >= 3) {
            churnRisk.push({
                customerId: customer.id,
                name: customer.name,
                phone: customer.phone,
                lastVisit: customer.lastOrderAt,
                daysSinceVisit,
                totalSpent: customer.totalSpent,
                visitCount: customer.totalOrders
            });
        }
    });

    // Sort by days since visit (most at-risk first)
    churnRisk.sort((a, b) => b.daysSinceVisit - a.daysSinceVisit);

    // =====================
    // RETURN AGGREGATED STATS
    // =====================
    return {
        financial: {
            realtimeProfit,
            projectedCashFlow,
            dailySales,
            dailyShortage,
            laborCostPercent: Math.round(laborCostPercent),
            foodCostPercent
        },
        operations: {
            avgPrepTime,
            peakHour,
            ordersPerHour,
            kitchenLagAlerts
        },
        risks: risks.sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        }),
        opportunities,
        staffLeaderboard: leaderboard,
        aiScheduler: aiScheduler.slice(0, 5),
        stockoutWarnings: stockoutWarnings.slice(0, 5),
        // God Mode 2.0
        revenueForecast,
        churnRisk,
        anomalies,
        quickActions,
        autoReorder: autoReorder.slice(0, 10)
    };
}
