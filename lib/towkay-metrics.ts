import { InventoryLog, Order, OrderVoidRefundStatus, StaffProfile } from './types';

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

// ============ MOCK DATA GENERATOR (Temporary) ============

export function getTowkayStats(): TowkayStats {
    return {
        financial: {
            realtimeProfit: 1250.50,
            projectedCashFlow: 45000.00,
            dailySales: 3200.00,
            dailyShortage: -15.00,
        },
        risks: [
            {
                id: 'r1',
                type: 'fraud',
                severity: 'critical',
                title: 'Possible Discount Abuse',
                description: 'Ali gave >20% discount 5 times today.',
                value: '5 Incidents',
                timestamp: new Date().toISOString(),
                staffName: 'Ali',
            },
            {
                id: 'r2',
                type: 'waste',
                severity: 'high',
                title: 'High Food Waste',
                description: 'Chicken Wings variance found during audit.',
                value: '-RM 45.00',
                timestamp: new Date().toISOString(),
            },
            {
                id: 'r3',
                type: 'efficiency',
                severity: 'medium',
                title: 'Kitchen Lag',
                description: 'Avg prep time > 18 mins during lunch.',
                value: '18m Avg',
                timestamp: new Date().toISOString(),
            }
        ],
        opportunities: [
            {
                id: 'o1',
                type: 'menu',
                title: 'Zombie Item Detected',
                description: 'Spinach Soup has 0 sales in 30 days.',
                potentialValue: 'Save RM 200/mo',
            },
            {
                id: 'o2',
                type: 'customer',
                title: 'Churn Risk',
                description: '3 Regulars haven\'t visited in 2 weeks.',
                potentialValue: 'Recover RM 150',
            }
        ],
        staffLeaderboard: [
            { name: 'Sarah', role: 'Server', points: 1250, badges: ['⚡ Speed Demon'], avatarUrl: '' },
            { name: 'Ahmad', role: 'Kitchen', points: 980, badges: ['🔥 Chef Mode'], avatarUrl: '' },
            { name: 'Ali', role: 'Cashier', points: 450, badges: [], avatarUrl: '' },
        ]
    };
}
