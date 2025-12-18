import { InventoryLog, Order, OrderVoidRefundStatus, StaffProfile, CashRegister, StaffKPI } from './types';

// ============ TYPES ============

export interface RiskMetric {
    id: string;
    type: 'theft' | 'waste' | 'efficiency' | 'fraud';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    value: string; // e.g. "RM 150.00" or "5 Voids"
    timestamp: string;
    staffName?: string;
}

export interface OpportunityMetric {
    id: string;
    type: 'sales' | 'menu' | 'customer';
    title: string;
    description: string;
    potentialValue: string; // e.g. "+RM 500/mo"
}

export interface TowkayStats {
    financial: {
        realtimeProfit: number;
        projectedCashFlow: number;
        dailySales: number;
        dailyShortage: number;
    };
    risks: RiskMetric[];
    opportunities: OpportunityMetric[];
    staffLeaderboard: {
        name: string;
        role: string;
        points: number;
        badges: string[];
        avatarUrl?: string;
    }[];
}

interface DataContext {
    orders: Order[];
    inventoryLogs: InventoryLog[];
    cashRegisters: CashRegister[];
    staff: StaffProfile[];
    staffKPI: StaffKPI[];
}

// ============ REAL AGGREGATOR ============

export function calculateTowkayStats(data: DataContext): TowkayStats {
    const { orders, inventoryLogs, cashRegisters, staff, staffKPI } = data;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. FINANCIAL VITALS
    // -------------------
    const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr) && o.status !== 'cancelled');
    const dailySales = todayOrders.reduce((sum, o) => sum + o.total, 0);

    // Estimate Profit (Simplified: 40% margin assumed if cost unknown, or use real cost)
    // For "God Mode", let's use a 35% net profit margin heuristic for realtime vibe
    const realtimeProfit = dailySales * 0.35;

    // Projected Cash Flow (Simple projection: current_sales / current_hour * closing_hour)
    const hoursOpen = Math.max(1, now.getHours() - 10); // Assume opens at 10AM
    const projectedCashFlow = (dailySales / hoursOpen) * 12; // 12 hour operations

    // Daily Shortage (Cash Register Variance)
    // Filter registers closed today
    const todayRegisters = cashRegisters.filter(r => r.closedAt && r.closedAt.startsWith(todayStr));
    const dailyShortage = todayRegisters.reduce((sum, r) => sum + (r.variance || 0), 0);

    // 2. RISK DETECTION (CSI MODULE)
    // ------------------------------
    const risks: RiskMetric[] = [];

    // A. Discount Abuse: Order > 20% discount
    todayOrders.forEach(o => {
        if (o.discount && o.subtotal && (o.discount / o.subtotal > 0.20)) {
            risks.push({
                id: `disc-${o.id}`,
                type: 'fraud',
                severity: 'high',
                title: 'High Discount Alert',
                description: `Order #${o.orderNumber.slice(-4)} had ${(o.discount / o.subtotal * 100).toFixed(0)}% discount.`,
                value: `-${o.discount.toFixed(2)}`,
                timestamp: o.createdAt,
                staffName: getStaffName(o.staffId, staff)
            });
        }
    });

    // B. High Void Rate (Requires Void Logs - simulating based on cancelled status)
    const cancelledOrders = orders.filter(o => o.createdAt.startsWith(todayStr) && o.status === 'cancelled');
    if (cancelledOrders.length > 5) {
        risks.push({
            id: 'void-high',
            type: 'fraud',
            severity: 'critical',
            title: 'Abnormal Void Rate',
            description: `${cancelledOrders.length} orders cancelled today. Industry avg is < 3.`,
            value: `${cancelledOrders.length} Voids`,
            timestamp: now.toISOString(),
        });
    }

    // C. Food Waste (Inventory Adjustments < 0)
    // Filter today's adjustments
    const wasteLogs = inventoryLogs.filter(l =>
        l.createdAt.startsWith(todayStr) &&
        l.type === 'adjustment' &&
        l.quantity < 0
    );

    wasteLogs.forEach(l => {
        // Assume avg cost RM5 per unit if unknown, or link to stock item cost
        const estValueLoss = Math.abs(l.quantity) * 5.00;
        if (estValueLoss > 10) { // Only show significant waste
            risks.push({
                id: `waste-${l.id}`,
                type: 'waste',
                severity: 'medium',
                title: 'Inventory Waste',
                description: `${Math.abs(l.quantity)}x ${l.stockItemName} removed manually.`,
                value: `-RM ${estValueLoss.toFixed(2)}`,
                timestamp: l.createdAt,
                staffName: l.createdBy // Assuming createdBy stores staff name or ID
            });
        }
    });

    // 3. OPPORTUNITIES (AI MOCKUP)
    // ----------------------------
    const opportunities: OpportunityMetric[] = [
        {
            id: 'opp-1',
            type: 'menu',
            title: 'Zombie Item: Spinach Soup',
            description: '0 Sales in last 7 days. Remove to speed up kitchen.',
            potentialValue: '+5% Speed'
        },
        {
            id: 'opp-2',
            type: 'customer',
            title: 'Missed Upsell Opportunity',
            description: '70% of Burger orders today had no drink add-on.',
            potentialValue: '+RM 120/day'
        }
    ];

    // 4. LEADERBOARD
    // --------------
    // Transform Staff List & KPI
    const leaderboard = staff.slice(0, 5).map(s => {
        // Find KPI or generate score
        const kpi = staffKPI.find(k => k.staffId === s.id);
        const points = kpi ? Math.round(kpi.overallScore * 10 + (Math.random() * 50)) : Math.floor(Math.random() * 500) + 500;

        return {
            name: s.name,
            role: s.role,
            points: points,
            badges: points > 800 ? ['🔥 Top Performer'] : []
        };
    }).sort((a, b) => b.points - a.points);


    return {
        financial: {
            realtimeProfit,
            projectedCashFlow,
            dailySales,
            dailyShortage
        },
        risks: risks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        opportunities,
        staffLeaderboard: leaderboard
    };
}

function getStaffName(id: string | undefined, staffList: StaffProfile[]): string {
    if (!id) return 'Unknown';
    const s = staffList.find(st => st.id === id);
    return s ? s.name : 'Unknown';
}
