import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateClockIn } from './attendance-utils';
import * as timezoneUtils from './timezone-utils';
import * as supabaseOperations from './supabase/operations';

// Mock dependencies
vi.mock('./supabase/operations', () => ({
    getSystemSetting: vi.fn(),
    isHoliday: vi.fn(),
    fetchStaffShifts: vi.fn(),
    fetchShiftDefinitions: vi.fn(),
}));

// We don't mock timezone-utils fully, but we might spy on it or trust it since we tested it separately.
// However, validateClockIn calls specific timezone utils.
// To make tests deterministic, we might need to mock getBruneiNow/Today if validateClockIn uses them directly.
// Looking at validateClockIn, it uses getBruneiToday() and getBruneiNow().
// We should mock timezone-utils to control time.

// We mock timezone-utils to control time-dependent functions
vi.mock('./timezone-utils', async (importOriginal) => {
    const actual = await importOriginal<typeof timezoneUtils>();
    return {
        ...actual,
        getBruneiToday: vi.fn(),
        getBruneiNow: vi.fn(),
        getBruneiDayOfWeek: vi.fn(),
        getClockInStatus: vi.fn(), // Mock this to avoid internal dependency issues
    };
});

describe('Attendance Utils', () => {
    describe('validateClockIn', () => {
        const mockStaffId = 'user-123';
        const mockShift = {
            id: '1',
            name: 'Morning',
            startTime: '09:00',
            endTime: '18:00',
            code: 'MORNING'
        };

        beforeEach(() => {
            vi.clearAllMocks();

            // Default mocks
            vi.mocked(supabaseOperations.getSystemSetting).mockImplementation(async (key) => {
                if (key === 'late_threshold_minutes') return '15';
                if (key === 'early_clock_in_limit_minutes') return '30';
                return '0';
            });

            vi.mocked(supabaseOperations.isHoliday).mockResolvedValue(false);

            vi.mocked(supabaseOperations.fetchStaffShifts).mockResolvedValue([
                { dayOfWeek: 1, shift: mockShift, isOffDay: false } // Monday
            ]);

            // Mock time to Monday Morning 08:50 (On time)
            (timezoneUtils.getBruneiToday as unknown as vi.Mock).mockReturnValue('2024-01-01'); // Monday
            (timezoneUtils.getBruneiDayOfWeek as unknown as vi.Mock).mockReturnValue(1); // Monday

            const mockNow = new Date('2024-01-01T08:50:00');
            (timezoneUtils.getBruneiNow as unknown as vi.Mock).mockReturnValue(mockNow);

            // Mock getClockInStatus to return safe default (on time)
            (timezoneUtils.getClockInStatus as unknown as vi.Mock).mockReturnValue({
                allowed: true,
                isEarly: false,
                isLate: false,
                minutesDiff: 0
            });
        });

        it('should allow clock-in when on time', async () => {
            const result = await validateClockIn(mockStaffId);

            expect(result.allowed).toBe(true);
            expect(result.isLate).toBe(false);
            expect(result.shift?.code).toBe('MORNING');
        });

        it('should mark as late when after grace period', async () => {
            // 09:16 (16 mins late, grace is 15)
            // 09:16 (16 mins late, grace is 15)
            const mockNow = new Date('2024-01-01T09:16:00');
            (timezoneUtils.getBruneiNow as unknown as vi.Mock).mockReturnValue(mockNow);
            (timezoneUtils.getClockInStatus as unknown as vi.Mock).mockReturnValue({
                allowed: true,
                isEarly: false,
                isLate: true,
                minutesDiff: 16,
                message: 'Anda lewat 16 minit.'
            });

            const result = await validateClockIn(mockStaffId);

            expect(result.allowed).toBe(true);
            expect(result.isLate).toBe(true);
            expect(result.lateMinutes).toBe(16);
        });

        it('should block if too early', async () => {
            // 08:29 (31 mins early, limit is 30)
            // 08:29 (31 mins early, limit is 30)
            const mockNow = new Date('2024-01-01T08:29:00');
            (timezoneUtils.getBruneiNow as unknown as vi.Mock).mockReturnValue(mockNow);
            (timezoneUtils.getClockInStatus as unknown as vi.Mock).mockReturnValue({
                allowed: false,
                isEarly: true,
                isLate: false,
                minutesDiff: 31
            });

            const result = await validateClockIn(mockStaffId);

            expect(result.allowed).toBe(false);
            expect(result.isEarlyBlocked).toBe(true);
        });

        it('should allow if holiday', async () => {
            vi.mocked(supabaseOperations.isHoliday).mockResolvedValue(true);

            const result = await validateClockIn(mockStaffId);

            expect(result.allowed).toBe(true);
            expect(result.isHoliday).toBe(true);
            expect(result.isLate).toBe(false);
        });

        it('should detect off day', async () => {
            vi.mocked(supabaseOperations.fetchStaffShifts).mockResolvedValue([
                { dayOfWeek: 1, shift: null, isOffDay: true }
            ]);

            const result = await validateClockIn(mockStaffId);

            expect(result.isOffDay).toBe(true);
            expect(result.message).toContain('cuti');
        });
    });
});
