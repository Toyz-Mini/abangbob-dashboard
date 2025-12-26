'use client';

/**
 * Attendance utilities for late detection, overtime calculation, and shift management
 */

import {
    getBruneiNow,
    getBruneiToday,
    getBruneiDayOfWeek,
    formatTime,
    timeToMinutes,
    getClockInStatus,
    calculateOvertimeMinutes
} from './timezone-utils';
import {
    fetchStaffShifts,
    fetchShiftDefinitions,
    getSystemSetting,
    isHoliday
} from './supabase/operations';
import { ShiftDefinition, StaffShift } from './types';

// Default settings (used if database fetch fails)
const DEFAULT_GRACE_PERIOD = 15;
const DEFAULT_EARLY_LIMIT = 30;
const DEFAULT_OT_THRESHOLD = 30;

/**
 * Get attendance settings from system_settings table
 */
export async function getAttendanceSettings(): Promise<{
    graceMinutes: number;
    earlyLimitMinutes: number;
    otThresholdMinutes: number;
    maxLatePerMonth: number;
}> {
    try {
        const [grace, early, ot, maxLate] = await Promise.all([
            getSystemSetting('late_threshold_minutes'),
            getSystemSetting('early_clock_in_limit_minutes'),
            getSystemSetting('overtime_threshold_minutes'),
            getSystemSetting('max_late_per_month')
        ]);

        return {
            graceMinutes: parseInt(grace || String(DEFAULT_GRACE_PERIOD)),
            earlyLimitMinutes: parseInt(early || String(DEFAULT_EARLY_LIMIT)),
            otThresholdMinutes: parseInt(ot || String(DEFAULT_OT_THRESHOLD)),
            maxLatePerMonth: parseInt(maxLate || '3')
        };
    } catch (error) {
        console.error('Error fetching attendance settings:', error);
        return {
            graceMinutes: DEFAULT_GRACE_PERIOD,
            earlyLimitMinutes: DEFAULT_EARLY_LIMIT,
            otThresholdMinutes: DEFAULT_OT_THRESHOLD,
            maxLatePerMonth: 3
        };
    }
}

/**
 * Get shift for a staff member for today
 */
export async function getStaffShiftForToday(staffId: string): Promise<{
    shift: ShiftDefinition | null;
    isOffDay: boolean;
    dayOfWeek: number;
}> {
    const dayOfWeek = getBruneiDayOfWeek();

    try {
        const staffShifts = await fetchStaffShifts(staffId);
        const todayShift = staffShifts.find((s: StaffShift) => s.dayOfWeek === dayOfWeek);

        if (!todayShift) {
            // No shift assigned - try to get default shift
            const allShifts = await fetchShiftDefinitions();
            const morning = allShifts.find((s: ShiftDefinition) => s.code === 'MORNING');
            return {
                shift: morning || null,
                isOffDay: false,
                dayOfWeek
            };
        }

        if (todayShift.isOffDay) {
            return {
                shift: null,
                isOffDay: true,
                dayOfWeek
            };
        }

        return {
            shift: todayShift.shift || null,
            isOffDay: false,
            dayOfWeek
        };
    } catch (error) {
        console.error('Error fetching staff shift:', error);
        return {
            shift: null,
            isOffDay: false,
            dayOfWeek
        };
    }
}

/**
 * Validate clock-in for a staff member
 * Returns validation result with late detection
 */
export async function validateClockIn(staffId: string): Promise<{
    allowed: boolean;
    isLate: boolean;
    isEarlyBlocked: boolean;
    isHoliday: boolean;
    isOffDay: boolean;
    lateMinutes: number;
    expectedClockIn: string | null;
    message?: string;
    shift: ShiftDefinition | null;
}> {
    const today = getBruneiToday();
    const currentTime = formatTime(getBruneiNow());

    // Check if today is a holiday
    const holidayCheck = await isHoliday(today);

    // Get staff shift for today
    const { shift, isOffDay, dayOfWeek } = await getStaffShiftForToday(staffId);

    // If holiday, allow clock-in without late check
    if (holidayCheck) {
        return {
            allowed: true,
            isLate: false,
            isEarlyBlocked: false,
            isHoliday: true,
            isOffDay: false,
            lateMinutes: 0,
            expectedClockIn: shift?.startTime || null,
            shift
        };
    }

    // If off day
    if (isOffDay) {
        return {
            allowed: true,
            isLate: false,
            isEarlyBlocked: false,
            isHoliday: false,
            isOffDay: true,
            lateMinutes: 0,
            expectedClockIn: null,
            shift: null,
            message: 'Hari ini hari cuti anda'
        };
    }

    // If no shift assigned, allow without late check
    if (!shift) {
        return {
            allowed: true,
            isLate: false,
            isEarlyBlocked: false,
            isHoliday: false,
            isOffDay: false,
            lateMinutes: 0,
            expectedClockIn: null,
            shift: null
        };
    }

    // Get attendance settings
    const settings = await getAttendanceSettings();

    // Check clock-in status
    const status = getClockInStatus(
        shift.startTime,
        settings.earlyLimitMinutes,
        settings.graceMinutes
    );

    return {
        allowed: status.allowed,
        isLate: status.isLate,
        isEarlyBlocked: !status.allowed && status.isEarly,
        isHoliday: false,
        isOffDay: false,
        lateMinutes: status.isLate ? status.minutesDiff : 0,
        expectedClockIn: shift.startTime,
        message: status.message,
        shift
    };
}

/**
 * Calculate overtime for clock-out
 */
export async function calculateClockOutOvertime(
    staffId: string,
    clockOutTime: string
): Promise<{
    overtimeMinutes: number;
    expectedClockOut: string | null;
}> {
    const { shift } = await getStaffShiftForToday(staffId);

    if (!shift) {
        return {
            overtimeMinutes: 0,
            expectedClockOut: null
        };
    }

    const settings = await getAttendanceSettings();
    const otMinutes = calculateOvertimeMinutes(
        shift.endTime,
        clockOutTime,
        settings.otThresholdMinutes
    );

    return {
        overtimeMinutes: otMinutes,
        expectedClockOut: shift.endTime
    };
}

/**
 * Check if staff has exceeded monthly late limit
 */
export async function checkMonthlyLateLimit(
    staffId: string,
    currentMonthLateCoun: number
): Promise<{
    exceeded: boolean;
    limit: number;
    count: number;
}> {
    const settings = await getAttendanceSettings();

    return {
        exceeded: currentMonthLateCoun >= settings.maxLatePerMonth,
        limit: settings.maxLatePerMonth,
        count: currentMonthLateCoun
    };
}
