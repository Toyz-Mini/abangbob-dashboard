import { z } from 'zod';

export const clockInSchema = z.object({
    staff_id: z.string().uuid({ message: "ID Staff tidak sah" }),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    selfie_base64: z.string().min(1, "Foto selfie diperlukan"),
    selfie_filename: z.string().min(1, "Nama fail selfie diperlukan"),
    late_reason_code: z.string().optional(),
    late_reason_note: z.string().optional(),
});

export const clockOutSchema = z.object({
    attendance_id: z.string().uuid({ message: "ID Kehadiran tidak sah" }),
    staff_id: z.string().uuid({ message: "ID Staff tidak sah" }),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    selfie_base64: z.string().min(1, "Foto selfie diperlukan"),
    selfie_filename: z.string().min(1, "Nama fail selfie diperlukan"),
});

export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
