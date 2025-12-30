import { describe, it, expect } from 'vitest';
import { clockInSchema, clockOutSchema } from './attendance';

describe('Attendance Validator', () => {
    describe('clockInSchema', () => {
        it('should validate correct data', () => {
            const validData = {
                staff_id: '123e4567-e89b-12d3-a456-426614174000', // UUID
                latitude: 4.885,
                longitude: 114.93,
                selfie_base64: 'data:image/jpeg;base64,...',
                selfie_filename: 'selfie.jpg'
            };
            const result = clockInSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should fail with invalid UUID', () => {
            const invalidData = {
                staff_id: 'invalid-id',
                latitude: 4.885,
                longitude: 114.93,
                selfie_base64: 'base64',
                selfie_filename: 'selfie.jpg'
            };
            const result = clockInSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('ID Staff tidak sah');
            }
        });

        it('should fail with out of range coordinates', () => {
            const invalidData = {
                staff_id: '123e4567-e89b-12d3-a456-426614174000',
                latitude: 100, // Invalid lat
                longitude: 114.93,
                selfie_base64: 'base64',
                selfie_filename: 'selfie.jpg'
            };
            const result = clockInSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('clockOutSchema', () => {
        it('should validate valid data', () => {
            const validData = {
                attendance_id: '123e4567-e89b-12d3-a456-426614174000',
                staff_id: '123e4567-e89b-12d3-a456-426614174000',
                latitude: 4.885,
                longitude: 114.93,
                selfie_base64: 'base64',
                selfie_filename: 'selfie.jpg'
            };
            const result = clockOutSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });
});
