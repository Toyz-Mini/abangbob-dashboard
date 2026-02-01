import { StaffProfile } from './types';

// ==================== BRUNEI TAP/SCP CONSTANTS ====================

// TAP - Tabung Amanah Pekerja (Employee Trust Fund)
export const TAP_EMPLOYEE_RATE = 5; // 5% of gross salary
export const TAP_EMPLOYER_RATE = 5; // 5% of gross salary

// SCP - Supplemental Contributory Pension
export const SCP_EMPLOYEE_RATE = 3.5; // 3.5% of gross salary
export const SCP_EMPLOYER_RATE = 3.5; // 3.5% of gross salary

// ==================== PAYROLL TYPES ====================

export interface PayrollEntry {
    id: string;
    staffId: string;
    staffName: string;
    month: string; // Format: YYYY-MM

    // Earnings
    baseSalary: number;
    overtimePay: number;
    allowances: number;
    bonus: number;           // Manual bonus
    kpiBonus: number;        // Auto-calculated from KPI score
    otherEarnings: number;
    grossSalary: number;

    // Deductions
    tapEmployee: number;
    tapEmployer: number;
    scpEmployee: number;
    scpEmployer: number;
    unpaidLeaveDays: number;
    unpaidLeaveDeduction: number;
    otherDeductions: number;
    totalDeductions: number;

    // Net Pay
    netPay: number;

    // Status
    status: 'draft' | 'pending' | 'approved' | 'paid';
    paidAt?: string;
    paidBy?: string;

    // Settings snapshot
    tapEnabled: boolean;
    scpEnabled: boolean;

    createdAt: string;
    updatedAt: string;
}

export interface PayrollSummary {
    month: string;
    totalGrossSalary: number;
    totalNetPay: number;
    totalTapEmployee: number;
    totalTapEmployer: number;
    totalScpEmployee: number;
    totalScpEmployer: number;
    staffCount: number;
}

// ==================== CALCULATION FUNCTIONS ====================

/**
 * Calculate TAP contribution for a staff member
 */
export function calculateTAP(
    grossSalary: number,
    enabled: boolean = true,
    employeeRate: number = TAP_EMPLOYEE_RATE,
    employerRate: number = TAP_EMPLOYER_RATE
): { employee: number; employer: number } {
    if (!enabled) {
        return { employee: 0, employer: 0 };
    }
    return {
        employee: Math.round(grossSalary * (employeeRate / 100) * 100) / 100,
        employer: Math.round(grossSalary * (employerRate / 100) * 100) / 100,
    };
}

/**
 * Calculate SCP contribution for a staff member
 */
export function calculateSCP(
    grossSalary: number,
    enabled: boolean = true,
    employeeRate: number = SCP_EMPLOYEE_RATE,
    employerRate: number = SCP_EMPLOYER_RATE
): { employee: number; employer: number } {
    if (!enabled) {
        return { employee: 0, employer: 0 };
    }
    return {
        employee: Math.round(grossSalary * (employeeRate / 100) * 100) / 100,
        employer: Math.round(grossSalary * (employerRate / 100) * 100) / 100,
    };
}

/**
 * Calculate full payroll for a staff member
 * @param staff - Staff profile
 * @param overtimePay - Overtime pay amount
 * @param bonus - Manual bonus
 * @param kpiBonus - Auto-calculated KPI bonus (from staff_kpi table)
 * @param otherEarnings - Other earnings
 * @param otherDeductions - Other deductions
 * @param unpaidLeaveDays - Number of unpaid leave days
 */
export function calculatePayroll(
    staff: StaffProfile,
    overtimePay: number = 0,
    bonus: number = 0,
    kpiBonus: number = 0,
    otherEarnings: number = 0,
    otherDeductions: number = 0,
    unpaidLeaveDays: number = 0
): Omit<PayrollEntry, 'id' | 'month' | 'status' | 'createdAt' | 'updatedAt'> {
    // Get settings from staff profile or use defaults
    const tapEnabled = staff.statutoryContributions?.tapEnabled ?? true;
    const scpEnabled = staff.statutoryContributions?.scpEnabled ?? true;
    const tapEmployeeRate = staff.statutoryContributions?.tapEmployeeRate ?? TAP_EMPLOYEE_RATE;
    const tapEmployerRate = staff.statutoryContributions?.tapEmployerRate ?? TAP_EMPLOYER_RATE;
    const scpEmployeeRate = staff.statutoryContributions?.scpEmployeeRate ?? SCP_EMPLOYEE_RATE;
    const scpEmployerRate = staff.statutoryContributions?.scpEmployerRate ?? SCP_EMPLOYER_RATE;

    // Calculate total allowances
    const allowances = (staff.allowances || []).reduce((sum, a) => sum + a.amount, 0);

    // Calculate gross salary (now includes kpiBonus)
    const grossSalary = staff.baseSalary + overtimePay + allowances + bonus + kpiBonus + otherEarnings;

    // Calculate statutory contributions
    const tap = calculateTAP(grossSalary, tapEnabled, tapEmployeeRate, tapEmployerRate);
    const scp = calculateSCP(grossSalary, scpEnabled, scpEmployeeRate, scpEmployerRate);

    // Calculate Unpaid Leave Deduction
    // Formula: (Base Salary / 26) * Days
    const WORKING_DAYS_PER_MONTH = 26;
    const unpaidLeaveDeduction = (staff.baseSalary / WORKING_DAYS_PER_MONTH) * unpaidLeaveDays;

    // Calculate fixed deductions from staff profile
    const fixedDeductions = (staff.fixedDeductions || []).reduce((sum, d) => sum + d.amount, 0);

    // Total deductions (employee portion only)
    const totalDeductions = tap.employee + scp.employee + fixedDeductions + otherDeductions + unpaidLeaveDeduction;

    // Net pay
    const netPay = grossSalary - totalDeductions;

    return {
        staffId: staff.id,
        staffName: staff.name,
        baseSalary: staff.baseSalary,
        overtimePay,
        allowances,
        bonus,
        kpiBonus,
        otherEarnings,
        grossSalary,
        tapEmployee: tap.employee,
        tapEmployer: tap.employer,
        scpEmployee: scp.employee,
        scpEmployer: scp.employer,
        unpaidLeaveDays,
        unpaidLeaveDeduction,
        otherDeductions: fixedDeductions + otherDeductions,
        totalDeductions,
        netPay,
        tapEnabled,
        scpEnabled,
        paidAt: undefined,
        paidBy: undefined,
    };
}

/**
 * Calculate payroll summary for a month
 */
export function calculatePayrollSummary(entries: PayrollEntry[]): PayrollSummary {
    return {
        month: entries[0]?.month || '',
        totalGrossSalary: entries.reduce((sum, e) => sum + e.grossSalary, 0),
        totalNetPay: entries.reduce((sum, e) => sum + e.netPay, 0),
        totalTapEmployee: entries.reduce((sum, e) => sum + e.tapEmployee, 0),
        totalTapEmployer: entries.reduce((sum, e) => sum + e.tapEmployer, 0),
        totalScpEmployee: entries.reduce((sum, e) => sum + e.scpEmployee, 0),
        totalScpEmployer: entries.reduce((sum, e) => sum + e.scpEmployer, 0),
        staffCount: entries.length,
    };
}

// ==================== MOCK DATA ====================

// Dynamic month for mock data
const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

export const MOCK_PAYROLL_ENTRIES: PayrollEntry[] = [
    {
        id: 'pay_001',
        staffId: '1',
        staffName: 'Ahmad Bin Hassan',
        month: currentMonth,
        baseSalary: 1500,
        overtimePay: 150,
        allowances: 100,
        bonus: 0,
        kpiBonus: 0,
        otherEarnings: 0,
        grossSalary: 1750,
        tapEmployee: 87.50,
        tapEmployer: 87.50,
        scpEmployee: 61.25,
        scpEmployer: 61.25,
        unpaidLeaveDays: 0,
        unpaidLeaveDeduction: 0,
        otherDeductions: 0,
        totalDeductions: 148.75,
        netPay: 1601.25,
        status: 'paid',
        paidAt: `${currentMonth}-25T10:00:00Z`,
        paidBy: 'Admin',
        tapEnabled: true,
        scpEnabled: true,
        createdAt: `${currentMonth}-20T08:00:00Z`,
        updatedAt: `${currentMonth}-25T10:00:00Z`,
    },
    {
        id: 'pay_002',
        staffId: '2',
        staffName: 'Siti Nurhaliza',
        month: currentMonth,
        baseSalary: 1200,
        overtimePay: 0,
        allowances: 50,
        bonus: 0,
        kpiBonus: 0,
        otherEarnings: 0,
        grossSalary: 1250,
        tapEmployee: 62.50,
        tapEmployer: 62.50,
        scpEmployee: 43.75,
        scpEmployer: 43.75,
        unpaidLeaveDays: 0,
        unpaidLeaveDeduction: 0,
        otherDeductions: 0,
        totalDeductions: 106.25,
        netPay: 1143.75,
        status: 'paid',
        paidAt: `${currentMonth}-25T10:00:00Z`,
        paidBy: 'Admin',
        tapEnabled: true,
        scpEnabled: true,
        createdAt: `${currentMonth}-20T08:00:00Z`,
        updatedAt: `${currentMonth}-25T10:00:00Z`,
    },
    {
        id: 'pay_003',
        staffId: '3',
        staffName: 'Rahman Ali (Part-time)',
        month: currentMonth,
        baseSalary: 600,
        overtimePay: 0,
        allowances: 0,
        bonus: 0,
        kpiBonus: 0,
        otherEarnings: 0,
        grossSalary: 600,
        tapEmployee: 0, // TAP disabled for part-time
        tapEmployer: 0,
        scpEmployee: 0, // SCP disabled for part-time
        scpEmployer: 0,
        unpaidLeaveDays: 0,
        unpaidLeaveDeduction: 0,
        otherDeductions: 0,
        totalDeductions: 0,
        netPay: 600,
        status: 'paid',
        paidAt: `${currentMonth}-25T10:00:00Z`,
        paidBy: 'Admin',
        tapEnabled: false,
        scpEnabled: false,
        createdAt: `${currentMonth}-20T08:00:00Z`,
        updatedAt: `${currentMonth}-25T10:00:00Z`,
    },
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Format currency for display (BND)
 */
export function formatBND(amount: number): string {
    return `BND ${amount.toFixed(2)}`;
}

/**
 * Get month label from YYYY-MM format
 */
export function getMonthLabel(month: string): string {
    const [year, monthNum] = month.split('-');
    const monthNames = [
        'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
        'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
    ];
    return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
}

/**
 * Get status label and color
 */
export function getPayrollStatusLabel(status: PayrollEntry['status']): { label: string; color: string } {
    const statusMap: Record<PayrollEntry['status'], { label: string; color: string }> = {
        draft: { label: 'Draf', color: 'secondary' },
        pending: { label: 'Menunggu', color: 'warning' },
        approved: { label: 'Diluluskan', color: 'info' },
        paid: { label: 'Dibayar', color: 'success' },
    };
    return statusMap[status] || { label: status, color: 'secondary' };
}
