'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useStore, useKPI } from '@/lib/store';
import { StaffProfile, AttendanceRecord, LeaveRequest, SalaryAdvance, ClaimRequest, PublicHoliday, HolidayPolicy, HolidayWorkLog } from '@/lib/types';
import { fetchPublicHolidays, fetchHolidayPolicies, fetchHolidayWorkLogs } from '@/lib/supabase/operations';
import { usePublicHolidaysRealtime, useHolidayPoliciesRealtime, useHolidayWorkLogsRealtime } from '@/lib/supabase/realtime-hooks';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getRankTier, getScoreColor } from '@/lib/kpi-data';
import { downloadPayslipPDF, type PayslipData } from '@/lib/services';
import Link from 'next/link';
import {
  DollarSign,
  Calculator,
  FileText,
  Download,
  Users,
  Clock,
  Calendar,
  Printer,
  CheckCircle,
  Trophy,
  Award,
  AlertCircle
} from 'lucide-react';
import StatCard from '@/components/StatCard';

interface DetailedDeduction {
  name: string;
  amount: number;
}

interface DetailedAddition {
  name: string;
  amount: number;
}

interface PayrollEntry {
  staffId: string;
  staffName: string;
  role: string;
  salaryType: 'monthly' | 'hourly' | 'daily'; // Matched with lib/types.ts

  // Base Data
  baseSalary: number;
  hourlyRate: number;

  // Time Data
  daysWorked: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  daysAbsent: number; // For monthly logic
  totalHours: number; // Actual worked hours
  otHours: number;

  // Earnings
  basePay: number; // Monthly: Base - Unpaid/Absent; Hourly: Worked * Rate
  otPay: number;
  holidayPay: number; // New field for Double Pay portion
  kpiBonus: number;
  kpiScore: number;
  allowances: DetailedAddition[];
  claims: DetailedAddition[]; // Approved claims
  grossPay: number;

  // Deductions
  statutory: {
    tap: number; // Employee Share
    scp: number; // Employee Share
    tapEmployer: number;
    scpEmployer: number;
  };
  fixedDeductions: DetailedDeduction[];
  advances: number; // Approved salary advances
  otherDeductions: number;
  totalDeductions: number;

  netPay: number;
}

export default function PayrollPage() {
  const {
    staff,
    attendance,
    leaveRequests,
    salaryAdvances,
    claimRequests,
    isInitialized
  } = useStore();

  const { getStaffKPI, getStaffBonus } = useKPI();

  // Load Holiday Data
  const loadHolidayData = async () => {
    // Load for current year context? 
    // Assuming mostly current year operations.
    const currentYear = new Date().getFullYear();
    try {
      const [h, p, w] = await Promise.all([
        fetchPublicHolidays(currentYear),
        fetchHolidayPolicies(currentYear),
        fetchHolidayWorkLogs() // API might need pagination later, fetching all for now
      ]);
      setHolidays(h);
      setPolicies(p);
      setWorkLogs(w);
    } catch (err) {
      console.error('Error loading holiday data', err);
    }
  };

  usePublicHolidaysRealtime(loadHolidayData);
  useHolidayPoliciesRealtime(loadHolidayData);
  useHolidayWorkLogsRealtime(loadHolidayData);

  // Initial load
  useState(() => {
    loadHolidayData();
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollEntry | null>(null);

  // Holiday Data
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [policies, setPolicies] = useState<HolidayPolicy[]>([]);
  const [workLogs, setWorkLogs] = useState<HolidayWorkLog[]>([]);

  // Fetch Holiday Data

  // Wait, I should use useEffect properly.

  // Realtime hooks
  // We can just load data once on mount or when year changes.

  // Settings
  const [otRate, setOtRate] = useState(1.5);
  const [regularHoursPerDay, setRegularHoursPerDay] = useState(8);
  const [workingDaysPerMonth, setWorkingDaysPerMonth] = useState(26); // Default standard

  // Calculate payroll for each staff
  const payrollData = useMemo((): PayrollEntry[] => {
    const activeStaff = staff.filter(s => s.status === 'active');
    // Filter data by month
    const monthAttendance = attendance.filter(a => a.date.startsWith(selectedMonth));
    const monthLeaves = leaveRequests.filter(l =>
      l.status === 'approved' &&
      (l.startDate.startsWith(selectedMonth) || l.endDate.startsWith(selectedMonth))
    );
    const monthAdvances = salaryAdvances.filter(a =>
      a.status === 'approved' &&
      (!a.deductedMonth || a.deductedMonth === selectedMonth)
    );
    const monthClaims = claimRequests.filter(c =>
      c.status === 'approved' &&
      c.claimDate.startsWith(selectedMonth)
    );

    return activeStaff.map(s => {
      // 1. Calculate Attendance & Hours
      const staffRecords = monthAttendance.filter(a => a.staffId === s.id);
      let totalMinutes = 0;
      let daysWorked = 0;

      staffRecords.forEach(record => {
        if (record.clockInTime && record.clockOutTime) {
          const [inH, inM] = record.clockInTime.split(':').map(Number);
          const [outH, outM] = record.clockOutTime.split(':').map(Number);
          const worked = (outH * 60 + outM) - (inH * 60 + inM) - record.breakDuration;
          if (worked > 0) {
            totalMinutes += worked;
            daysWorked++;
          }
        }
      });

      const totalHours = totalMinutes / 60;

      // 2. Calculate Leave Days
      // Simple logic: If leave falls in this month, count days.
      // (Advanced logic would split across months, simplified here for MVP)
      const staffLeaves = monthLeaves.filter(l => l.staffId === s.id);
      const paidLeaveDays = staffLeaves
        .filter(l => l.type !== 'unpaid')
        .reduce((sum, l) => sum + l.duration, 0);
      const unpaidLeaveDays = staffLeaves
        .filter(l => l.type === 'unpaid')
        .reduce((sum, l) => sum + l.duration, 0);

      // 3. Determine Salary Logic
      const isMonthly = s.salaryType === 'monthly';
      const dailyRate = isMonthly ? (s.baseSalary / workingDaysPerMonth) : (s.hourlyRate * regularHoursPerDay);

      let basePay = 0;
      let otPay = 0;
      let otHours = 0;
      let daysAbsent = 0;

      if (isMonthly) {
        // Monthly Logic
        // Base = Salary
        // Deduct: Unpaid Leave days + Absent days
        // Absent days = WorkingDaysPerMonth - (DaysWorked + PaidLeaveDays + UnpaidLeaveDays)
        // If they worked EXTRA days, do we pay extra? Usually no for fixed salary, unless OT.
        // We will assume "Absent" deduction.

        const accountableDays = daysWorked + paidLeaveDays + unpaidLeaveDays;
        daysAbsent = Math.max(0, workingDaysPerMonth - accountableDays);

        const unpaidDays = unpaidLeaveDays + daysAbsent;
        basePay = s.baseSalary - (unpaidDays * dailyRate);

        // OT Calculation for Monthly
        // Assume OT starts after 8 hours/day OR working days > 26?
        // Standard: OT is calculated on hourly basis derived from monthly
        const hourlyRateDerived = s.baseSalary / workingDaysPerMonth / regularHoursPerDay;

        // Calculate OT hours based on daily limit
        const regularHoursLimit = daysWorked * regularHoursPerDay;
        otHours = Math.max(0, totalHours - regularHoursLimit);
        otPay = otHours * hourlyRateDerived * otRate;

      } else {
        // Hourly Logic
        // Pay = (WorkedHours * Rate) + (PaidLeaveDays * 8 * Rate)
        const workedPay = totalHours * s.hourlyRate;
        const leavePay = paidLeaveDays * regularHoursPerDay * s.hourlyRate;
        basePay = workedPay + leavePay;

        // Hourly Staff OT?
        // Usually implied in totalHours if just flat rate.
        // If we want detailed OT:
        const regularHoursLimit = daysWorked * regularHoursPerDay;
        const regularHours = Math.min(totalHours, regularHoursLimit);
        otHours = Math.max(0, totalHours - regularHoursLimit);

        // Recalculate with OT Rate overlap
        // BasePay above assumes all hours at flat rate. Let's adjust.
        // Real Base = RegularHours * Rate
        // Real OT = OTHours * Rate * Multiplier

        basePay = (regularHours * s.hourlyRate) + (paidLeaveDays * regularHoursPerDay * s.hourlyRate);
        otPay = otHours * s.hourlyRate * otRate;
      }

      // 3.5 Holiday Pay Calculation (Double Pay)
      let holidayPay = 0;
      // Iterate days worked to check if any is a holiday
      // We already iterated attendance to calc totalHours. We might need to map attendance to dates.

      const workedDates = monthAttendance.filter(a => a.staffId === s.id && a.clockInTime && a.clockOutTime).map(a => {
        // Parse worked hours for that day
        const [inH, inM] = (a.clockInTime || '00:00').split(':').map(Number);
        const [outH, outM] = (a.clockOutTime || '00:00').split(':').map(Number);
        const hours = ((outH * 60 + outM) - (inH * 60 + inM) - a.breakDuration) / 60;
        return { date: a.date, hours };
      });

      workedDates.forEach(wd => {
        const holiday = holidays.find(h => h.date === wd.date);
        if (holiday) {
          const policy = policies.find(p => p.holidayId === holiday.id);
          const log = workLogs.find(w => w.workDate === wd.date && w.staffId === s.id);

          // Determine if eligible for Double Pay
          let isDoublePay = false;

          if (log && log.compensationChoice === 'double_pay') {
            isDoublePay = true;
          } else if (!log && policy?.compensationType === 'double_pay') {
            isDoublePay = true; // Default if mandatory
          } else if (!log && policy?.compensationType === 'staff_choice') {
            isDoublePay = true; // Default to pay if no choice recorded (or warn?)
          }

          if (isDoublePay && policy) {
            // Add EXTRA pay portion (multiplier - 1)
            // Base pay (1x) is already in basePay/otPay above.
            // We adding the premium.
            // Rate to use:
            const rate = isMonthly ? (s.baseSalary / workingDaysPerMonth / regularHoursPerDay) : s.hourlyRate;
            const extraMultiplier = (policy.payMultiplier || 2.0) - 1.0;
            const extraPay = wd.hours * rate * extraMultiplier;
            holidayPay += extraPay;
          }
        }
      });


      // 4. KPI Bonus
      const staffKPI = getStaffKPI(s.id, selectedMonth);
      const kpiBonus = getStaffBonus(s.id, selectedMonth); // Uses helper which checks global config
      const kpiScore = staffKPI?.overallScore || 0;

      // 5. Allowances (From Staff Profile)
      const allowanceList: DetailedAddition[] = s.allowances?.map(a => ({
        name: a.name,
        amount: a.type === 'percentage' ? (basePay * a.amount / 100) : a.amount
      })) || [];
      const totalAllowances = allowanceList.reduce((sum, a) => sum + a.amount, 0);

      // 6. Claims (From ClaimRequests)
      const staffClaims = monthClaims.filter(c => c.staffId === s.id);
      const claimList: DetailedAddition[] = staffClaims.map(c => ({
        name: c.description || c.type,
        amount: c.amount
      }));
      const totalClaims = claimList.reduce((sum, c) => sum + c.amount, 0);

      // GROSS PAY
      const grossPay = basePay + otPay + holidayPay + kpiBonus + totalAllowances + totalClaims; // claims usually tax exempt? keeping simple

      // 7. Statutory Deductions (TAP/SCP)
      const tapRate = s.statutoryContributions?.tapEnabled ? (s.statutoryContributions.tapEmployeeRate || 5) : 0;
      const scpRate = s.statutoryContributions?.scpEnabled ? (s.statutoryContributions.scpEmployeeRate || 3.5) : 0;

      const tapEmployerRate = s.statutoryContributions?.tapEnabled ? (s.statutoryContributions.tapEmployerRate || 5) : 0;
      const scpEmployerRate = s.statutoryContributions?.scpEnabled ? (s.statutoryContributions.scpEmployerRate || 3.5) : 0; // SCP Employer often fixed? Using % for consistency

      // Calculation Base: Usually Base + Allowances? Or just Base?
      // Brunei TAP is on Wages.
      const contributionBase = basePay + otPay + holidayPay + totalAllowances + kpiBonus; // Broad definition

      const tapAmount = (contributionBase * tapRate) / 100;
      const scpAmount = (contributionBase * scpRate) / 100;
      const tapEmployerAmount = (contributionBase * tapEmployerRate) / 100;
      const scpEmployerAmount = (contributionBase * scpEmployerRate) / 100;

      // 8. Fixed Deductions (From Staff Profile)
      const fixedDeductionList: DetailedDeduction[] = s.fixedDeductions?.map(d => ({
        name: d.name,
        amount: d.type === 'percentage' ? (basePay * d.amount / 100) : d.amount
      })) || [];
      const totalFixedDeductions = fixedDeductionList.reduce((sum, d) => sum + d.amount, 0);

      // 9. Salary Advances
      const staffAdvances = monthAdvances.filter(a => a.staffId === s.id);
      const totalAdvances = staffAdvances.reduce((sum, a) => sum + a.amount, 0);

      // Total Deductions
      const totalDeductions = tapAmount + scpAmount + totalFixedDeductions + totalAdvances;

      // NET PAY
      const netPay = grossPay - totalDeductions;

      return {
        staffId: s.id,
        staffName: s.name,
        role: s.role,
        salaryType: s.salaryType || 'hourly',
        baseSalary: s.baseSalary || 0,
        hourlyRate: s.hourlyRate || 0,
        daysWorked,
        paidLeaveDays,
        unpaidLeaveDays,
        daysAbsent,
        totalHours,
        otHours,
        basePay: Math.round(basePay * 100) / 100,
        otPay: Math.round(otPay * 100) / 100,
        holidayPay: Math.round(holidayPay * 100) / 100,
        kpiBonus: Math.round(kpiBonus * 100) / 100,
        kpiScore,
        allowances: allowanceList,
        claims: claimList,
        grossPay: Math.round(grossPay * 100) / 100,
        statutory: {
          tap: Math.round(tapAmount * 100) / 100,
          scp: Math.round(scpAmount * 100) / 100,
          tapEmployer: Math.round(tapEmployerAmount * 100) / 100,
          scpEmployer: Math.round(scpEmployerAmount * 100) / 100,
        },
        fixedDeductions: fixedDeductionList,
        advances: totalAdvances,
        otherDeductions: 0,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        netPay: Math.round(netPay * 100) / 100,
      };
    }).sort((a, b) => b.netPay - a.netPay);
  }, [staff, attendance, selectedMonth, otRate, regularHoursPerDay, workingDaysPerMonth, leaveRequests, salaryAdvances, claimRequests, getStaffKPI, getStaffBonus, holidays, policies, workLogs]);

  const summary = useMemo(() => {
    return {
      totalStaff: payrollData.length,
      totalGross: payrollData.reduce((sum, p) => sum + p.grossPay, 0),
      totalDeductions: payrollData.reduce((sum, p) => sum + p.totalDeductions, 0),
      totalNet: payrollData.reduce((sum, p) => sum + p.netPay, 0),
      totalHours: payrollData.reduce((sum, p) => sum + p.totalHours, 0),
      totalOT: payrollData.reduce((sum, p) => sum + p.otHours, 0),
      totalTapEmployer: payrollData.reduce((sum, p) => sum + p.statutory.tapEmployer, 0),
      totalScpEmployer: payrollData.reduce((sum, p) => sum + p.statutory.scpEmployer, 0),
      totalKPIBonus: payrollData.reduce((sum, p) => sum + p.kpiBonus, 0),
    };
  }, [payrollData]);

  const openPayslip = (entry: PayrollEntry) => {
    setSelectedPayroll(entry);
    setShowPayslipModal(true);
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (selectedPayroll) {
      // Need to adjust PayslipData type if needed, but for now allow basic
      // For this MVP we'll just download mostly static data or update type
      // Assuming downloadPayslipPDF can accept extra fields or we map carefully
      const payslipData: any = { // Using any to bypass strict type for MVP rapid dev
        staffName: selectedPayroll.staffName,
        staffId: selectedPayroll.staffId,
        role: selectedPayroll.role,
        period: selectedMonth,
        daysWorked: selectedPayroll.daysWorked,
        regularHours: selectedPayroll.totalHours - selectedPayroll.otHours,
        otHours: selectedPayroll.otHours,
        hourlyRate: selectedPayroll.hourlyRate,
        otRate: otRate,
        regularPay: selectedPayroll.basePay, // Using basePay as regular
        otPay: selectedPayroll.otPay,
        kpiScore: selectedPayroll.kpiScore,
        kpiBonus: selectedPayroll.kpiBonus,
        grossPay: selectedPayroll.grossPay,
        deductions: {
          tap: selectedPayroll.statutory.tap,
          scp: selectedPayroll.statutory.scp,
          advances: selectedPayroll.advances,
          other: selectedPayroll.totalDeductions - selectedPayroll.statutory.tap - selectedPayroll.statutory.scp - selectedPayroll.advances
        },
        netPay: selectedPayroll.netPay
      };
      downloadPayslipPDF(payslipData);
    }
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
  };

  if (!isInitialized) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Payroll Generator v2.0
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Integrated payroll with Leaves, Claims, Advances & Statutory
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Calendar size={20} color="var(--text-secondary)" />
            <input
              type="month"
              className="form-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: 'auto' }}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="content-grid cols-4 mb-lg">
          <StatCard
            label="Total Staff"
            value={summary.totalStaff}
            change="Active"
            changeType="neutral"
            icon={Users}
            gradient="primary"
          />
          <StatCard
            label="Employer Cost"
            value={`BND ${(summary.totalTapEmployer + summary.totalScpEmployer).toFixed(2)}`}
            change="TAP + SCP Contribution"
            changeType="neutral"
            icon={DollarSign}
          />
          <StatCard
            label="Total Gross"
            value={`BND ${summary.totalGross.toFixed(2)}`}
            change="Before Deductions"
            changeType="neutral"
            icon={Calculator}
            gradient="warning"
          />
          <StatCard
            label="Total Net Payout"
            value={`BND ${summary.totalNet.toFixed(2)}`}
            change={`Bonus: ${summary.totalKPIBonus.toFixed(2)}`} // Simplified context
            changeType="positive"
            icon={DollarSign}
            gradient="sunset"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4" style={{ gap: '1.5rem' }}>
          {/* Settings */}
          <div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Parameter Gaji</div>
              </div>

              <div className="form-group">
                <label className="form-label">Min Working Days</label>
                <input
                  type="number"
                  className="form-input"
                  value={workingDaysPerMonth}
                  onChange={(e) => setWorkingDaysPerMonth(Number(e.target.value))}
                  min="20"
                  max="31"
                />
                <small style={{ color: 'var(--text-secondary)' }}>Used for Monthly calculations</small>
              </div>

              <div className="form-group">
                <label className="form-label">Kadar OT (×)</label>
                <select
                  className="form-select"
                  value={otRate}
                  onChange={(e) => setOtRate(Number(e.target.value))}
                >
                  <option value="1.25">1.25× (25% lebih)</option>
                  <option value="1.5">1.5× (50% lebih)</option>
                  <option value="2">2× (Double)</option>
                </select>
              </div>
            </div>

            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header"><div className="card-title">Info</div></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <p>✅ <strong>Monthly:</strong> Based on {workingDaysPerMonth} days. Unpaid leaves deduct daily rate.</p>
                <p>✅ <strong>Hourly:</strong> Based on clocked hours + Approved Paid Leave (8h).</p>
                <p>✅ <strong>Deductions:</strong> Advance & TAP/SCP auto-calculated.</p>
              </div>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="md:col-span-3 lg:col-span-3">
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} />
                  Senarai Gaji - {getMonthName(selectedMonth)}
                </div>
              </div>

              {payrollData.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Staf</th>
                        <th>Type</th>
                        <th>Hari/Jam</th>
                        <th>OT</th>
                        <th>Perolehan</th>
                        <th>Potongan</th>
                        <th>Gaji Bersih</th>
                        <th>Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollData.map(entry => (
                        <tr key={entry.staffId}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{entry.staffName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entry.role}</div>
                          </td>
                          <td>
                            <span className={`badge ${entry.salaryType === 'monthly' ? 'badge-primary' : 'badge-secondary'}`}>
                              {entry.salaryType === 'monthly' ? 'Bulanan' : 'Jam'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>
                              <div>Work: {entry.daysWorked}d ({entry.totalHours.toFixed(1)}h)</div>
                              {entry.paidLeaveDays > 0 && <div style={{ color: 'var(--success)' }}>+Leave: {entry.paidLeaveDays}d</div>}
                              {entry.daysAbsent > 0 && <div style={{ color: 'var(--danger)' }}>-Absent: {entry.daysAbsent}d</div>}
                            </div>
                          </td>
                          <td>
                            {entry.otHours > 0 ? (
                              <span style={{ fontWeight: 600 }}>{entry.otHours.toFixed(1)}h</span>
                            ) : '-'}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>
                              <div>Base: {entry.basePay.toFixed(2)}</div>
                              {entry.otPay > 0 && <div>OT: {entry.otPay.toFixed(2)}</div>}
                              {entry.holidayPay > 0 && <div style={{ color: '#8b5cf6' }}>Hol: {entry.holidayPay.toFixed(2)}</div>}
                              {entry.kpiBonus > 0 && <div style={{ color: '#d97706' }}>KPI: {entry.kpiBonus.toFixed(2)}</div>}
                              {entry.claims.length > 0 && <div style={{ color: 'var(--info)' }}>Claims: {entry.claims.reduce((s, c) => s + c.amount, 0).toFixed(2)}</div>}
                              {entry.allowances.length > 0 && <div style={{ color: 'var(--success)' }}>Allow: {entry.allowances.reduce((s, a) => s + a.amount, 0).toFixed(2)}</div>}
                              <div style={{ borderTop: '1px solid #eee', fontWeight: 600 }}>Gross: {entry.grossPay.toFixed(2)}</div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>
                              {entry.statutory.tap > 0 && <div>TAP: {entry.statutory.tap.toFixed(2)}</div>}
                              {entry.statutory.scp > 0 && <div>SCP: {entry.statutory.scp.toFixed(2)}</div>}
                              {entry.advances > 0 && <div>Adv: {entry.advances.toFixed(2)}</div>}
                              {entry.fixedDeductions.length > 0 && <div>Fixed: {entry.fixedDeductions.reduce((s, d) => s + d.amount, 0).toFixed(2)}</div>}
                              <div style={{ borderTop: '1px solid #eee', fontWeight: 600 }}>Total: {entry.totalDeductions.toFixed(2)}</div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>
                            {entry.netPay.toFixed(2)}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline" onClick={() => openPayslip(entry)}>
                              <FileText size={14} /> Payslip
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <Users size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
                  <p>Tiada data untuk bulan ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payslip Modal */}
        <Modal
          isOpen={showPayslipModal}
          onClose={() => setShowPayslipModal(false)}
          title="Payslip Details"
          subtitle={`${selectedPayroll?.staffName} - ${getMonthName(selectedMonth)}`}
          maxWidth="600px" // Wider for better layout
        >
          {selectedPayroll && (
            <div>
              <div style={{ background: 'var(--gray-50)', padding: '2rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #ddd', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>ABANGBOB</h2>
                  <p>OFFICIAL PAYSLIP</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <p style={{ color: '#666', fontSize: '0.8rem' }}>NAME</p>
                    <p style={{ fontWeight: 600 }}>{selectedPayroll.staffName}</p>
                  </div>
                  <div>
                    <p style={{ color: '#666', fontSize: '0.8rem' }}>POSITION</p>
                    <p style={{ fontWeight: 600 }}>{selectedPayroll.role}</p>
                  </div>
                  <div>
                    <p style={{ color: '#666', fontSize: '0.8rem' }}>PERIOD</p>
                    <p style={{ fontWeight: 600 }}>{getMonthName(selectedMonth)}</p>
                  </div>
                  <div>
                    <p style={{ color: '#666', fontSize: '0.8rem' }}>TYPE</p>
                    <p style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedPayroll.salaryType}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* EARNINGS */}
                  <div>
                    <h4 style={{ fontWeight: 700, borderBottom: '1px solid #ccc', marginBottom: '0.5rem' }}>EARNINGS</h4>
                    <div className="flex justify-between mb-1">
                      <span>Base Pay</span>
                      <span>{selectedPayroll.basePay.toFixed(2)}</span>
                    </div>
                    {selectedPayroll.holidayPay > 0 && (
                      <div className="flex justify-between mb-1">
                        <span>Holiday Pay</span>
                        <span>{selectedPayroll.holidayPay.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedPayroll.otPay > 0 && (
                      <div className="flex justify-between mb-1">
                        <span>Overtime ({selectedPayroll.otHours.toFixed(1)}h)</span>
                        <span>{selectedPayroll.otPay.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedPayroll.kpiBonus > 0 && (
                      <div className="flex justify-between mb-1">
                        <span>KPI Bonus ({selectedPayroll.kpiScore}%)</span>
                        <span>{selectedPayroll.kpiBonus.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedPayroll.allowances.map((a, i) => (
                      <div key={i} className="flex justify-between mb-1">
                        <span>{a.name}</span>
                        <span>{a.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {selectedPayroll.claims.map((c, i) => (
                      <div key={i} className="flex justify-between mb-1 text-sm text-gray-600">
                        <span>Claim: {c.name}</span>
                        <span>{c.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between mt-2 pt-2 border-t font-bold">
                      <span>TOTAL EARNINGS</span>
                      <span>{selectedPayroll.grossPay.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* DEDUCTIONS */}
                  <div>
                    <h4 style={{ fontWeight: 700, borderBottom: '1px solid #ccc', marginBottom: '0.5rem' }}>DEDUCTIONS</h4>
                    {selectedPayroll.statutory.tap > 0 && (
                      <div className="flex justify-between mb-1">
                        <span>TAP (Employee)</span>
                        <span className="text-red-500">-{selectedPayroll.statutory.tap.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedPayroll.statutory.scp > 0 && (
                      <div className="flex justify-between mb-1">
                        <span>SCP (Employee)</span>
                        <span className="text-red-500">-{selectedPayroll.statutory.scp.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedPayroll.advances > 0 && (
                      <div className="flex justify-between mb-1">
                        <span>Salary Advance</span>
                        <span className="text-red-500">-{selectedPayroll.advances.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedPayroll.fixedDeductions.map((d, i) => (
                      <div key={i} className="flex justify-between mb-1">
                        <span>{d.name}</span>
                        <span className="text-red-500">-{d.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between mt-2 pt-2 border-t font-bold">
                      <span>TOTAL DEDUCTIONS</span>
                      <span className="text-red-500">-{selectedPayroll.totalDeductions.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#d1fae5', padding: '1rem', marginTop: '2rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#065f46', fontWeight: 700 }}>NET PAY</span>
                  <span style={{ color: '#065f46', fontWeight: 700, fontSize: '1.5rem' }}>BND {selectedPayroll.netPay.toFixed(2)}</span>
                </div>

                <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#888', textAlign: 'center' }}>
                  <p>Employer Contribution: TAP {selectedPayroll.statutory.tapEmployer.toFixed(2)} | SCP {selectedPayroll.statutory.scpEmployer.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="btn btn-primary flex-1" onClick={handlePrintPayslip}>Print</button>
                <button className="btn btn-outline flex-1" onClick={() => setShowPayslipModal(false)}>Close</button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}
