'use client';

/**
 * Timezone utilities for Brunei (UTC+8)
 * All attendance calculations use Brunei local time
 */

// Brunei Darussalam timezone
export const BRUNEI_TIMEZONE = 'Asia/Brunei';
const BRUNEI_OFFSET_HOURS = 8;

/**
 * Get current time in Brunei timezone
 */
export function getBruneiNow(): Date {
    const now = new Date();
    // Create a date with Brunei offset
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * BRUNEI_OFFSET_HOURS));
}

/**
 * Get today's date in YYYY-MM-DD format for Brunei timezone
 */
export function getBruneiToday(): string {
    const now = getBruneiNow();
    return formatDate(now);
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format time to HH:mm
 */
export function formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Format to ISO string but in Brunei timezone
 */
export function toBruneiISOString(date: Date): string {
    return `${formatDate(date)}T${formatTime(date)}:00+08:00`;
}

/**
 * Get current day of week (0=Sunday, 6=Saturday)
 */
export function getBruneiDayOfWeek(): number {
    return getBruneiNow().getDay();
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to HH:mm format
 */
export function minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Get current time in Brunei as minutes since midnight
 */
export function getBruneiCurrentMinutes(): number {
    const now = getBruneiNow();
    return now.getHours() * 60 + now.getMinutes();
}

/**
 * Calculate difference in minutes between two times
 * Positive = clockIn is after expected (late)
 * Negative = clockIn is before expected (early)
 */
export function getTimeDifferenceMinutes(expectedTime: string, actualTime: string): number {
    const expectedMinutes = timeToMinutes(expectedTime);
    const actualMinutes = timeToMinutes(actualTime);
    return actualMinutes - expectedMinutes;
}

/**
 * Check if current time is within allowed clock-in window
 * @param shiftStart - Shift start time in HH:mm format
 * @param earlyLimitMinutes - How many minutes early allowed
 * @param gracePeriodMinutes - Grace period for being late
 */
export function getClockInStatus(
    shiftStart: string,
    earlyLimitMinutes: number = 30,
    gracePeriodMinutes: number = 15
): {
    allowed: boolean;
    isEarly: boolean;
    isLate: boolean;
    minutesDiff: number;
    message?: string;
} {
    const currentMinutes = getBruneiCurrentMinutes();
    const shiftMinutes = timeToMinutes(shiftStart);
    const diff = currentMinutes - shiftMinutes;

    // Too early check
    if (diff < -earlyLimitMinutes) {
        return {
            allowed: false,
            isEarly: true,
            isLate: false,
            minutesDiff: Math.abs(diff),
            message: `Anda cuba clock in ${Math.abs(diff)} minit awal. Sila tunggu sampai ${minutesToTime(shiftMinutes - earlyLimitMinutes)}.`
        };
    }

    // Late check (after grace period)
    if (diff > gracePeriodMinutes) {
        return {
            allowed: true,
            isEarly: false,
            isLate: true,
            minutesDiff: diff,
            message: `Anda lewat ${diff} minit.`
        };
    }

    // On time (within grace period or early but allowed)
    return {
        allowed: true,
        isEarly: diff < 0,
        isLate: false,
        minutesDiff: diff
    };
}

/**
 * Calculate overtime minutes
 * @param shiftEnd - Shift end time in HH:mm format
 * @param clockOutTime - Actual clock out time in HH:mm format
 * @param otThresholdMinutes - Minimum minutes after shift to count as OT
 */
export function calculateOvertimeMinutes(
    shiftEnd: string,
    clockOutTime: string,
    otThresholdMinutes: number = 30
): number {
    const shiftEndMinutes = timeToMinutes(shiftEnd);
    const clockOutMinutes = timeToMinutes(clockOutTime);
    const diff = clockOutMinutes - shiftEndMinutes;

    if (diff > otThresholdMinutes) {
        return diff;
    }

    return 0;
}

/**
 * Format minutes as hours and minutes string
 */
export function formatMinutesAsTime(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} minit`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
        return `${hours} jam`;
    }
    return `${hours} jam ${mins} minit`;
}

/**
 * Get day name in Malay
 */
export function getDayNameMalay(dayOfWeek: number): string {
    const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
    return days[dayOfWeek] || '';
}

/**
 * Get day name in English
 */
export function getDayNameEnglish(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || '';
}
