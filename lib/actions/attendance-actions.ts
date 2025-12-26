'use server';

import { auth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import {
    AllowedLocation,
    ClockInData,
    ClockOutData,
    calculateDistance
} from '@/lib/supabase/attendance-sync';

// =====================================================
// SESSION VERIFICATION
// =====================================================

async function verifySession() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        throw new Error('Unauthorized: No active session found');
    }
    return session.user;
}

// =====================================================
// LOCATION MANAGEMENT ACTIONS
// =====================================================

export async function getAllowedLocationsAction() {
    try {
        await verifySession();
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin
            .from('allowed_locations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error('[Action] Get Locations Error:', error);
        return { success: false, error: error.message };
    }
}

export async function addAllowedLocationAction(location: Omit<AllowedLocation, 'id' | 'created_at' | 'updated_at'>) {
    try {
        await verifySession();
        const supabaseAdmin = getSupabaseAdmin();

        // @ts-ignore - Supabase types are strict
        const { data, error } = await supabaseAdmin
            .from('allowed_locations')
            .insert([location])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error('[Action] Add Location Error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateAllowedLocationAction(id: string, updates: Partial<AllowedLocation>) {
    try {
        await verifySession();
        const supabaseAdmin = getSupabaseAdmin();

        const { data, error } = await supabaseAdmin
            .from('allowed_locations')
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error('[Action] Update Location Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteAllowedLocationAction(id: string) {
    try {
        await verifySession();
        const supabaseAdmin = getSupabaseAdmin();

        const { error } = await supabaseAdmin
            .from('allowed_locations')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
    } catch (error: any) {
        console.error('[Action] Delete Location Error:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// LOCATION VERIFICATION (Server-side)
// =====================================================

async function verifyLocationServer(latitude: number, longitude: number) {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: locations, error } = await supabaseAdmin
        .from('allowed_locations')
        .select('*')
        .eq('is_active', true);

    if (error || !locations || locations.length === 0) {
        return { verified: false, distance: null, nearest_location: null };
    }

    let nearestLocation: AllowedLocation | null = null;
    let nearestDistance = Infinity;

    for (const loc of locations) {
        const distance = calculateDistance(
            latitude,
            longitude,
            Number(loc.latitude),
            Number(loc.longitude)
        );

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestLocation = loc as AllowedLocation;
        }
    }

    const isWithinRadius = nearestLocation
        ? nearestDistance <= nearestLocation.radius_meters
        : false;

    return {
        verified: isWithinRadius,
        distance: nearestDistance,
        nearest_location: nearestLocation,
    };
}

// =====================================================
// PHOTO UPLOAD (Server-side)
// =====================================================

async function uploadPhotoServer(staffId: string, fileBase64: string, fileName: string) {
    const supabaseAdmin = getSupabaseAdmin();

    // Decode base64 to buffer
    const base64Data = fileBase64.split(',')[1] || fileBase64;
    const buffer = Buffer.from(base64Data, 'base64');

    const timestamp = Date.now();
    const path = `attendance/${staffId}/${timestamp}_${fileName}`;

    const { error } = await supabaseAdmin.storage
        .from('attendance-photos')
        .upload(path, buffer, {
            contentType: 'image/jpeg',
            upsert: false,
        });

    if (error) {
        console.error('Upload error:', error);
        return { path: null, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
        .from('attendance-photos')
        .getPublicUrl(path);

    return { path: urlData.publicUrl, error: null };
}

// =====================================================
// CLOCK IN/OUT ACTIONS
// =====================================================

export async function clockInAction(data: {
    staff_id: string;
    latitude: number;
    longitude: number;
    selfie_base64: string;
    selfie_filename: string;
}) {
    try {
        await verifySession();
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Verify location
        const verification = await verifyLocationServer(data.latitude, data.longitude);

        if (!verification.verified) {
            return {
                success: false,
                error: `Anda berada ${Math.round(verification.distance || 0)}m dari lokasi terdekat. Sila berada dalam radius yang dibenarkan.`,
                data: null,
            };
        }

        // 2. Upload selfie
        const { path: selfie_url, error: uploadError } = await uploadPhotoServer(
            data.staff_id,
            data.selfie_base64,
            data.selfie_filename
        );

        if (uploadError) {
            return {
                success: false,
                error: 'Gagal upload foto: ' + uploadError,
                data: null,
            };
        }

        // 3. Create attendance record
        const attendance_data = {
            staff_id: data.staff_id,
            clock_in: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            location_verified: true,
            location_id: verification.nearest_location?.id || null,
            actual_latitude: data.latitude,
            actual_longitude: data.longitude,
            distance_meters: verification.distance,
            selfie_url,
        };

        const { data: record, error: insertError } = await supabaseAdmin
            .from('attendance')
            .insert([attendance_data])
            .select()
            .single();

        if (insertError) {
            console.error('Error creating attendance record:', insertError);
            return {
                success: false,
                error: 'Gagal merekod kehadiran: ' + insertError.message,
                data: null,
            };
        }

        return {
            success: true,
            data: record,
            error: null,
            location_name: verification.nearest_location?.name,
        };
    } catch (error: any) {
        console.error('Clock-in error:', error);
        return {
            success: false,
            error: error.message || 'Ralat tidak dijangka',
            data: null,
        };
    }
}

export async function clockOutAction(data: {
    attendance_id: string;
    staff_id: string;
    latitude: number;
    longitude: number;
    selfie_base64: string;
    selfie_filename: string;
}) {
    try {
        await verifySession();
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Verify location
        const verification = await verifyLocationServer(data.latitude, data.longitude);

        if (!verification.verified) {
            return {
                success: false,
                error: `Anda berada ${Math.round(verification.distance || 0)}m dari lokasi terdekat. Sila berada dalam radius yang dibenarkan.`,
                data: null,
            };
        }

        // 2. Upload selfie
        const { path: selfie_url, error: uploadError } = await uploadPhotoServer(
            data.staff_id,
            data.selfie_base64,
            data.selfie_filename
        );

        if (uploadError) {
            return {
                success: false,
                error: 'Gagal upload foto: ' + uploadError,
                data: null,
            };
        }

        // 3. Fetch current notes to append
        const { data: currentRecord } = await supabaseAdmin
            .from('attendance')
            .select('notes')
            .eq('id', data.attendance_id)
            .single();

        const noteEntry = `[Clock Out Verified] Lat: ${data.latitude}, Lng: ${data.longitude}, Dist: ${Math.round(verification.distance || 0)}m, Selfie: ${selfie_url}`;
        const currentNotes = currentRecord?.notes ? `${currentRecord.notes}\n` : '';

        // 4. Update attendance record
        const updates = {
            clock_out: new Date().toISOString(),
            notes: `${currentNotes}${noteEntry}`
        };

        const { data: record, error } = await supabaseAdmin
            .from('attendance')
            .update(updates)
            .eq('id', data.attendance_id)
            .select()
            .single();

        if (error) {
            console.error('Error clocking out:', error);
            return { success: false, error: error.message, data: null };
        }

        return { success: true, data: record, error: null };
    } catch (error: any) {
        console.error('Clock-out error:', error);
        return {
            success: false,
            error: error.message || 'Ralat tidak dijangka',
            data: null,
        };
    }
}

// =====================================================
// ATTENDANCE QUERY ACTIONS
// =====================================================

export async function getTodayAttendanceAction(staffId: string) {
    try {
        await verifySession();
        const supabaseAdmin = getSupabaseAdmin();

        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabaseAdmin
            .from('attendance')
            .select('*')
            .eq('staff_id', staffId)
            .eq('date', today)
            .order('clock_in', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(error.message);
        }

        return { success: true, data: data || null };
    } catch (error: any) {
        console.error('[Action] Get Today Attendance Error:', error);
        return { success: false, error: error.message, data: null };
    }
}

export async function getAttendanceHistoryAction(staffId: string, limit = 30) {
    try {
        await verifySession();
        const supabaseAdmin = getSupabaseAdmin();

        const { data, error } = await supabaseAdmin
            .from('attendance')
            .select('*')
            .eq('staff_id', staffId)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error('[Action] Get Attendance History Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllAttendanceAction(startDate?: string, endDate?: string) {
    try {
        await verifySession();
        const supabaseAdmin = getSupabaseAdmin();

        let query = supabaseAdmin
            .from('attendance')
            .select('*')
            .order('date', { ascending: false });

        if (startDate) {
            query = query.gte('date', startDate);
        }
        if (endDate) {
            query = query.lte('date', endDate);
        }

        const { data, error } = await query;

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error('[Action] Get All Attendance Error:', error);
        return { success: false, error: error.message };
    }
}
