import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    timeToMinutes,
    minutesToTime,
    getClockInStatus,
    calculateOvertimeMinutes,
    formatMinutesAsTime,
    getTimeDifferenceMinutes
} from './timezone-utils';

describe('Timezone Utils', () => {
    describe('timeToMinutes', () => {
        it('should convert HH:mm to minutes correctly', () => {
            expect(timeToMinutes('00:00')).toBe(0);
            expect(timeToMinutes('01:00')).toBe(60);
            expect(timeToMinutes('01:30')).toBe(90);
            expect(timeToMinutes('23:59')).toBe(1439);
        });
    });

    describe('minutesToTime', () => {
        it('should convert minutes to HH:mm correctly', () => {
            expect(minutesToTime(0)).toBe('00:00');
            expect(minutesToTime(60)).toBe('01:00');
            expect(minutesToTime(90)).toBe('01:30');
            expect(minutesToTime(1439)).toBe('23:59');
        });
    });

    describe('getTimeDifferenceMinutes', () => {
        it('should calculate difference correctly', () => {
            expect(getTimeDifferenceMinutes('09:00', '09:00')).toBe(0);
            expect(getTimeDifferenceMinutes('09:00', '09:15')).toBe(15);
            expect(getTimeDifferenceMinutes('09:00', '08:45')).toBe(-15);
        });
    });

    describe('getClockInStatus', () => {
        const shiftStart = '09:00';
        const earlyLimit = 30; // 08:30 earliest
        const gracePeriod = 15; // 09:15 latest for on-time

        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should block clock-in if too early', () => {
            // Mock time to 08:29 (31 mins early)
            const mockDate = new Date('2024-01-01T08:29:00+08:00');
            vi.setSystemTime(mockDate);

            const status = getClockInStatus(shiftStart, earlyLimit, gracePeriod);
            expect(status.allowed).toBe(false);
            expect(status.isEarly).toBe(true);
            expect(status.minutesDiff).toBe(31);
        });

        it('should allow clock-in if within early limit', () => {
            // Mock time to 08:31 (29 mins early)
            const mockDate = new Date('2024-01-01T08:31:00+08:00');
            vi.setSystemTime(mockDate);

            const status = getClockInStatus(shiftStart, earlyLimit, gracePeriod);
            expect(status.allowed).toBe(true);
            expect(status.isEarly).toBe(true);
            expect(status.isLate).toBe(false);
        });

        it('should allow clock-in exactly on time', () => {
            const mockDate = new Date('2024-01-01T09:00:00+08:00');
            vi.setSystemTime(mockDate);

            const status = getClockInStatus(shiftStart, earlyLimit, gracePeriod);
            expect(status.allowed).toBe(true);
            expect(status.minutesDiff).toBe(0);
        });

        it('should allow clock-in if within grace period', () => {
            // Mock time to 09:15 (15 mins late)
            const mockDate = new Date('2024-01-01T09:15:00+08:00');
            vi.setSystemTime(mockDate);

            const status = getClockInStatus(shiftStart, earlyLimit, gracePeriod);
            expect(status.allowed).toBe(true);
            expect(status.isLate).toBe(false); // Grace period means not counted as late usually? 
            // Wait, looking at code: if (diff > gracePeriodMinutes) -> Late.
            // So <= gracePeriodMinutes is NOT late.
            expect(status.isLate).toBe(false);
        });

        it('should mark as late if after grace period', () => {
            // Mock time to 09:16 (16 mins late)
            const mockDate = new Date('2024-01-01T09:16:00+08:00');
            vi.setSystemTime(mockDate);

            const status = getClockInStatus(shiftStart, earlyLimit, gracePeriod);
            expect(status.allowed).toBe(true);
            expect(status.isLate).toBe(true);
            expect(status.minutesDiff).toBe(16);
        });
    });

    describe('calculateOvertimeMinutes', () => {
        const shiftEnd = '18:00';
        const otThreshold = 30;

        it('should return 0 if clocked out before shift end', () => {
            expect(calculateOvertimeMinutes(shiftEnd, '17:59', otThreshold)).toBe(0);
        });

        it('should return 0 if clocked out exactly at shift end', () => {
            expect(calculateOvertimeMinutes(shiftEnd, '18:00', otThreshold)).toBe(0);
        });

        it('should return 0 if OT is within threshold', () => {
            // 18:30 is exactly threshold
            expect(calculateOvertimeMinutes(shiftEnd, '18:30', otThreshold)).toBe(0);
        });

        it('should return diff if OT exceeds threshold', () => {
            // 18:31 is > threshold
            expect(calculateOvertimeMinutes(shiftEnd, '18:31', otThreshold)).toBe(31);
        });
    });

    describe('formatMinutesAsTime', () => {
        it('should format minutes correctly', () => {
            expect(formatMinutesAsTime(30)).toBe('30 minit');
            expect(formatMinutesAsTime(60)).toBe('1 jam');
            expect(formatMinutesAsTime(90)).toBe('1 jam 30 minit');
        });
    });
});
