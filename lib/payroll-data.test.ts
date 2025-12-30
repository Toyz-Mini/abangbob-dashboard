import { describe, it, expect } from 'vitest';
import { calculateTAP, calculateSCP, calculatePayroll, TAP_EMPLOYEE_RATE, TAP_EMPLOYER_RATE, SCP_EMPLOYEE_RATE, SCP_EMPLOYER_RATE } from './payroll-data';
import { StaffProfile } from './types';

describe('Payroll Logic', () => {
    describe('calculateTAP', () => {
        it('should calculate 5% for employee and employer by default', () => {
            const salary = 1000;
            const result = calculateTAP(salary);
            // 5% of 1000 = 50
            expect(result.employee).toBe(50);
            expect(result.employer).toBe(50);
        });

        it('should return 0 when disabled', () => {
            const salary = 1000;
            const result = calculateTAP(salary, false);
            expect(result.employee).toBe(0);
            expect(result.employer).toBe(0);
        });

        it('should handle custom rates', () => {
            const salary = 1000;
            const result = calculateTAP(salary, true, 3.5, 3.5);
            // 3.5% of 1000 = 35
            expect(result.employee).toBe(35);
            expect(result.employer).toBe(35);
        });
    });

    describe('calculateSCP', () => {
        it('should calculate 3.5% for employee and employer by default', () => {
            const salary = 1000;
            const result = calculateSCP(salary);
            // 3.5% of 1000 = 35
            expect(result.employee).toBe(35);
            expect(result.employer).toBe(35);
        });

        it('should return 0 when disabled', () => {
            const salary = 1000;
            const result = calculateSCP(salary, false);
            expect(result.employee).toBe(0);
            expect(result.employer).toBe(0);
        });
    });

    describe('calculatePayroll', () => {
        const mockStaff: StaffProfile = {
            id: 'staff-1',
            name: 'Ali Baba',
            email: 'ali@example.com',
            role: 'staff',
            status: 'active',
            baseSalary: 1000,
            allowances: [],
            fixedDeductions: [],
            statutoryContributions: {
                tapEnabled: true,
                scpEnabled: true,
                tapEmployeeRate: TAP_EMPLOYEE_RATE,
                tapEmployerRate: TAP_EMPLOYER_RATE,
                scpEmployeeRate: SCP_EMPLOYEE_RATE,
                scpEmployerRate: SCP_EMPLOYER_RATE
            }
        } as unknown as StaffProfile;

        it('should calculate basic payroll correctly', () => {
            const result = calculatePayroll(mockStaff);

            expect(result.grossSalary).toBe(1000);
            expect(result.tapEmployee).toBe(50); // 5%
            expect(result.scpEmployee).toBe(35); // 3.5%
            expect(result.totalDeductions).toBe(85); // 50 + 35
            expect(result.netPay).toBe(915); // 1000 - 85
        });

        it('should include allowances in gross salary and contributions', () => {
            const staffWithAllowance = {
                ...mockStaff,
                allowances: [{ id: '1', name: 'Transport', amount: 100, type: 'fixed' }]
            } as unknown as StaffProfile;

            const result = calculatePayroll(staffWithAllowance);

            expect(result.allowances).toBe(100);
            expect(result.grossSalary).toBe(1100); // 1000 + 100

            // Contributions based on 1100
            expect(result.tapEmployee).toBe(55); // 5% of 1100
            expect(result.scpEmployee).toBe(38.5); // 3.5% of 1100
            expect(result.netPay).toBe(1100 - (55 + 38.5));
        });

        it('should handle unpaid leave deductions', () => {
            // Unpaid leave deduction = (Base Salary / 26) * Days
            const unpaidDays = 2;
            const result = calculatePayroll(mockStaff, 0, 0, 0, 0, unpaidDays);

            const expectedDeduction = (1000 / 26) * 2;
            expect(result.unpaidLeaveDeduction).toBeCloseTo(expectedDeduction, 2);
            expect(result.totalDeductions).toBeCloseTo(50 + 35 + expectedDeduction, 2);
        });
    });
});
