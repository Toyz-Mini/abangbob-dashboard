import { getSupabaseClient } from './client';

// =====================================================
// TYPES
// =====================================================

export interface AllowedLocation {
    id: string;
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    radius_meters: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AttendanceRecord {
    id: string;
    staff_id: string;
    clock_in: string;
    clock_out: string | null;
    date: string;
    location_verified: boolean;
    location_id: string | null;
    actual_latitude: number | null;
    actual_longitude: number | null;
    distance_meters: number | null;
    selfie_url: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ClockInData {
    staff_id: string;
    latitude: number;
    longitude: number;
    selfie_file: File | Blob;
}

// =====================================================
// DISTANCE CALCULATION (Haversine Formula)
// =====================================================

export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// =====================================================
// LOCATION MANAGEMENT
// =====================================================

export async function getAllowedLocations() {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase not configured', data: null };

    const { data, error } = await (supabase as any)
        .from('allowed_locations')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching allowed locations:', error);
        return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
}

export async function addAllowedLocation(location: Omit<AllowedLocation, 'id' | 'created_at' | 'updated_at'>) {
    console.log('addAllowedLocation called with:', location);
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase not configured', data: null };

    console.log('Sending insert request to Supabase...');
    const { data, error } = await (supabase as any)
        .from('allowed_locations')
        .insert([location])
        .select()
        .single();

    console.log('Supabase response:', { data, error });

    if (error) {
        console.error('Error adding location:', error);
        return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
}

export async function updateAllowedLocation(id: string, updates: Partial<AllowedLocation>) {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase not configured', data: null };

    const { data, error } = await (supabase as any)
        .from('allowed_locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating location:', error);
        return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
}

export async function deleteAllowedLocation(id: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    const { error } = await (supabase as any)
        .from('allowed_locations')
        .update({ is_active: false })
        .eq('id', id);

    if (error) {
        console.error('Error deleting location:', error);
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}

// =====================================================
// LOCATION VERIFICATION
// =====================================================

export async function verifyLocation(latitude: number, longitude: number) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return {
            verified: false,
            nearest_location: null,
            distance: null,
            error: 'Supabase not configured',
        };
    }

    const { data: locations, error } = await (supabase as any)
        .from('allowed_locations')
        .select('*')
        .eq('is_active', true);

    if (error || !locations) {
        return {
            verified: false,
            nearest_location: null,
            distance: null,
            error: error?.message || 'No locations found',
        };
    }

    let nearest_location: AllowedLocation | null = null;
    let min_distance = Infinity;

    for (const location of locations) {
        const distance = calculateDistance(
            latitude,
            longitude,
            location.latitude,
            location.longitude
        );

        if (distance < min_distance) {
            min_distance = distance;
            nearest_location = location;
        }
    }

    const verified = nearest_location ? min_distance <= nearest_location.radius_meters : false;

    return {
        verified,
        nearest_location,
        distance: min_distance,
        error: null,
    };
}

// =====================================================
// PHOTO UPLOAD
// =====================================================

export async function uploadAttendancePhoto(staffId: string, file: File | Blob): Promise<{ path: string | null; error: string | null }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { path: null, error: 'Supabase not configured' };

    // Handle both File and Blob objects - Blob doesn't have a name property
    let fileExt = 'jpg'; // Default to jpg since webcam captures are usually jpeg
    if (file instanceof File && file.name) {
        fileExt = file.name.split('.').pop() || 'jpg';
    } else if (file.type) {
        // Fallback: extract extension from MIME type (e.g., 'image/jpeg' -> 'jpeg')
        const mimeExt = file.type.split('/').pop();
        if (mimeExt) {
            fileExt = mimeExt === 'jpeg' ? 'jpg' : mimeExt;
        }
    }
    const fileName = `${staffId}/${Date.now()}.${fileExt}`;

    const { data, error } = await (supabase as any).storage
        .from('attendance-photos')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error('Error uploading photo:', error);
        return { path: null, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = (supabase as any).storage
        .from('attendance-photos')
        .getPublicUrl(data.path);

    return { path: publicUrl, error: null };
}

// =====================================================
// ATTENDANCE OPERATIONS
// =====================================================

export async function clockIn(data: ClockInData) {
    try {
        // 1. Verify location
        const verification = await verifyLocation(data.latitude, data.longitude);

        if (!verification.verified) {
            return {
                success: false,
                error: `Anda berada ${Math.round(verification.distance || 0)}m dari lokasi terdekat. Sila berada dalam radius yang dibenarkan.`,
                data: null,
            };
        }

        // 2. Upload selfie
        const { path: selfie_url, error: uploadError } = await uploadAttendancePhoto(
            data.staff_id,
            data.selfie_file
        );

        if (uploadError) {
            return {
                success: false,
                error: 'Gagal upload foto. Sila cuba lagi.',
                data: null,
            };
        }

        // 3. Create attendance record
        const supabase = getSupabaseClient();
        if (!supabase) {
            return {
                success: false,
                error: 'Supabase not configured',
                data: null,
            };
        }

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

        const { data: record, error: insertError } = await (supabase as any)
            .from('attendance')
            .insert([attendance_data])
            .select()
            .single();

        if (insertError) {
            console.error('Error creating attendance record:', insertError);
            return {
                success: false,
                error: 'Gagal merekod kehadiran. Sila cuba lagi.',
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

export interface ClockOutData {
    attendance_id: string;
    latitude: number;
    longitude: number;
    selfie_file: File | Blob;
    staff_id: string; // Needed for photo path
}

export async function clockOut(data: ClockOutData) {
    try {
        // 1. Verify location
        const verification = await verifyLocation(data.latitude, data.longitude);

        if (!verification.verified) {
            return {
                success: false,
                error: `Anda berada ${Math.round(verification.distance || 0)}m dari lokasi terdekat. Sila berada dalam radius yang dibenarkan.`,
                data: null,
            };
        }

        // 2. Upload selfie
        const { path: selfie_url, error: uploadError } = await uploadAttendancePhoto(
            data.staff_id,
            data.selfie_file
        );

        if (uploadError) {
            return {
                success: false,
                error: 'Gagal upload foto. Sila cuba lagi.',
                data: null,
            };
        }

        // 3. Update attendance record
        const supabase = getSupabaseClient();
        if (!supabase) {
            return {
                success: false,
                error: 'Supabase not configured',
                data: null,
            };
        }

        // We'll append clock-out metadata to notes since we don't have dedicated columns yet
        // This ensures the data is preserved without requiring immediate schema migration
        const noteEntry = `[Clock Out Verified] Lat: ${data.latitude}, Lng: ${data.longitude}, Dist: ${Math.round(verification.distance || 0)}m, Selfie: ${selfie_url}`;

        // Fetch current notes first to append
        const { data: currentRecord, error: fetchError } = await (supabase as any)
            .from('attendance')
            .select('notes')
            .eq('id', data.attendance_id)
            .single();

        const currentNotes = currentRecord?.notes ? `${currentRecord.notes}\n` : '';

        const updates = {
            clock_out: new Date().toISOString(),
            notes: `${currentNotes}${noteEntry}`
        };

        const { data: record, error } = await (supabase as any)
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
// ATTENDANCE QUERIES
// =====================================================

export async function getTodayAttendance(staffId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase not configured', data: null };

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await (supabase as any)
        .from('attendance')
        .select(`
      *,
      location:allowed_locations(name, address)
    `)
        .eq('staff_id', staffId)
        .eq('date', today)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error fetching today attendance:', error);
        return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
}

export async function getAttendanceHistory(staffId: string, limit = 30) {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase not configured', data: null };

    const { data, error } = await (supabase as any)
        .from('attendance')
        .select(`
      *,
      location:allowed_locations(name, address)
    `)
        .eq('staff_id', staffId)
        .order('date', { ascending: false })
        .order('clock_in', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching attendance history:', error);
        return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
}

export async function getAllAttendance(startDate?: string, endDate?: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase not configured', data: null };

    let query = (supabase as any)
        .from('attendance')
        .select(`
      *,
      staff:staff(name, email),
      location:allowed_locations(name, address)
    `)
        .order('date', { ascending: false })
        .order('clock_in', { ascending: false });

    if (startDate) {
        query = query.gte('date', startDate);
    }

    if (endDate) {
        query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching all attendance:', error);
        return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
}
