import { getSupabaseClient } from './client';
import * as attendanceActions from '../actions/attendance-actions';

// =====================================================
// TYPES
// =====================================================

export interface AllowedLocation {
    id: string;
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
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
    // Explicitly cast to number to avoid string concatenation or NaN issues from DB values
    const lat1Num = Number(lat1);
    const lon1Num = Number(lon1);
    const lat2Num = Number(lat2);
    const lon2Num = Number(lon2);

    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1Num * Math.PI) / 180;
    const φ2 = (lat2Num * Math.PI) / 180;
    const Δφ = ((lat2Num - lat1Num) * Math.PI) / 180;
    const Δλ = ((lon2Num - lon1Num) * Math.PI) / 180;

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
    try {
        const result = await attendanceActions.getAllowedLocationsAction();
        return result;
    } catch (error: any) {
        console.error('Error fetching allowed locations:', error);
        return { success: false, data: null, error: error.message };
    }
}

export async function addAllowedLocation(location: Omit<AllowedLocation, 'id' | 'created_at' | 'updated_at'>) {
    console.log('addAllowedLocation called with:', location);
    console.log('addAllowedLocation called with:', location);
    try {
        const result = await attendanceActions.addAllowedLocationAction(location);
        return result;
    } catch (error: any) {
        console.error('Error adding location:', error);
        return { success: false, data: null, error: error.message };
    }
}

export async function updateAllowedLocation(id: string, updates: Partial<AllowedLocation>) {
    try {
        const result = await attendanceActions.updateAllowedLocationAction(id, updates);
        return result;
    } catch (error: any) {
        console.error('Error updating location:', error);
        return { success: false, data: null, error: error.message };
    }
}

export async function deleteAllowedLocation(id: string) {
    try {
        const result = await attendanceActions.deleteAllowedLocationAction(id);
        return result;
    } catch (error: any) {
        console.error('Error deleting location:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// LOCATION VERIFICATION
// =====================================================

export async function verifyLocation(latitude: number, longitude: number) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        // If Supabase not configured, allow clock-in without location verification
        console.warn('[Location] Supabase not configured, bypassing location check');
        return {
            verified: true,
            nearest_location: null,
            distance: 0,
            error: null,
            bypass_reason: 'supabase_not_configured'
        };
    }

    const { data: locations, error } = await (supabase as any)
        .from('allowed_locations')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('[Location] Error fetching locations:', error);
        return {
            verified: false,
            nearest_location: null,
            distance: null,
            error: `Gagal mendapatkan senarai lokasi: ${error.message}`,
        };
    }

    // IMPORTANT: If no locations are configured, allow clock-in anywhere
    if (!locations || locations.length === 0) {
        console.warn('[Location] No allowed locations configured, bypassing location check');
        return {
            verified: true,
            nearest_location: null,
            distance: 0,
            error: null,
            bypass_reason: 'no_locations_configured'
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

    // DB returns snake_case for raw queries, but our interface might expect camelCase.
    // Check both or prefer the DB column name since we are querying directly.
    const radius = (nearest_location as any)?.radius_meters || nearest_location?.radiusMeters || 100; // Default 100m if not set
    const verified = nearest_location ? min_distance <= Number(radius) : false;

    console.log(`[Location] Verification: verified=${verified}, distance=${Math.round(min_distance)}m, radius=${radius}m, location=${nearest_location?.name}`);

    return {
        verified,
        nearest_location,
        distance: min_distance,
        error: verified ? null : `Anda berada ${Math.round(min_distance)}m dari ${nearest_location?.name || 'lokasi terdekat'}. Had: ${radius}m.`,
        debug: `Rad: ${radius} (${typeof radius}), Dist: ${min_distance}, Loc: ${nearest_location?.name}, Count: ${locations.length}`
    };
}

// =====================================================
// PHOTO UPLOAD
// =====================================================

export async function uploadAttendancePhoto(staffId: string, file: File | Blob): Promise<{ path: string | null; error: string | null }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { path: null, error: 'Supabase not configured' };

    try {
        // Get current auth user ID (more reliable for RLS)
        const { data: { user } } = await supabase.auth.getUser();
        const uploadUserId = user?.id || staffId; // Use auth ID if available, fallback to staffId

        console.log('[Photo Upload] Starting upload for user:', uploadUserId);
        console.log('[Photo Upload] File size:', file.size, 'bytes, type:', file.type);

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
        const fileName = `${uploadUserId}/${Date.now()}.${fileExt}`;
        console.log('[Photo Upload] Uploading to path:', fileName);

        // Upload with timeout wrapper for mobile reliability
        const uploadPromise = (supabase as any).storage
            .from('attendance-photos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });

        // 30 second timeout for mobile networks
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Upload timeout - slow network')), 30000)
        );

        const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

        if (error) {
            console.error('[Photo Upload] Storage error:', error);
            console.error('[Photo Upload] Error code:', error.statusCode, 'message:', error.message);
            // Return specific message for common errors
            if (error.message === 'The resource was not found') {
                return { path: null, error: `Bucket 'attendance-photos' belum diwujudkan.` };
            }
            return { path: null, error: `Upload gagal: ${error.message || 'Unknown error'}` };
        }

        // Get public URL
        const { data: { publicUrl } } = (supabase as any).storage
            .from('attendance-photos')
            .getPublicUrl(data.path);

        console.log('[Photo Upload] ✅ Success, URL:', publicUrl);
        return { path: publicUrl, error: null };
    } catch (err: any) {
        console.error('[Photo Upload] Exception:', err);
        // Provide more helpful error messages
        if (err.message?.includes('Load failed') || err.message?.includes('fetch')) {
            return { path: null, error: 'Sambungan rangkaian gagal. Cuba semula.' };
        }
        if (err.message?.includes('timeout')) {
            return { path: null, error: 'Rangkaian terlalu perlahan. Cuba semula.' };
        }
        return { path: null, error: err.message || 'Ralat tidak diketahui' };
    }
}

// =====================================================
// ATTENDANCE OPERATIONS
// =====================================================

export async function clockIn(data: ClockInData) {
    try {
        console.log('[ClockIn] Starting clock-in for staff:', data.staff_id);

        // 1. Verify location
        const verification = await verifyLocation(data.latitude, data.longitude);

        if (!verification.verified) {
            console.log('[ClockIn] Location verification failed:', verification.error);
            return {
                success: false,
                error: verification.error || `Lokasi tidak sah. Jarak: ${Math.round(verification.distance || 0)}m`,
                data: null,
            };
        }

        console.log('[ClockIn] Location verified:', verification.bypass_reason || verification.nearest_location?.name);

        // 2. Upload selfie (optional - allow clock-in without photo if upload fails)
        let selfie_url: string | null = null;
        const { path, error: uploadError } = await uploadAttendancePhoto(
            data.staff_id,
            data.selfie_file
        );

        if (uploadError) {
            console.warn('[ClockIn] Photo upload failed:', uploadError);
            // Continue without photo - don't block clock-in
            selfie_url = null;
        } else {
            selfie_url = path;
            console.log('[ClockIn] Photo uploaded:', selfie_url);
        }

        // 3. Create attendance record
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('[ClockIn] Supabase client not available');
            return {
                success: false,
                error: 'Supabase tidak dikonfigurasi',
                data: null,
            };
        }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString('en-GB', { hour12: false }); // HH:MM:SS format

        // Prepare location metadata for notes
        const locationMeta = verification.bypass_reason
            ? `[Bypass: ${verification.bypass_reason}]`
            : `[Location] ${verification.nearest_location?.name || 'Unknown'}, Dist: ${Math.round(verification.distance || 0)}m`;

        const attendance_data = {
            staff_id: data.staff_id,
            date: dateStr,
            clock_in_time: timeStr,
            clock_in_photo_url: selfie_url,
            outlet_id: verification.nearest_location?.id || null,
            notes: locationMeta,
        };

        console.log('[ClockIn] Inserting attendance record:', { ...attendance_data, clock_in_photo_url: selfie_url ? '(photo)' : null });

        const { data: record, error: insertError } = await (supabase as any)
            .from('attendance')
            .insert([attendance_data])
            .select()
            .single();

        if (insertError) {
            console.error('[ClockIn] Error creating attendance record:', insertError);
            return {
                success: false,
                error: `Gagal merekod kehadiran: ${insertError.message}`,
                data: null,
            };
        }

        console.log('[ClockIn] Success! Record ID:', record.id);

        return {
            success: true,
            data: record,
            error: null,
            location_name: verification.nearest_location?.name || 'Lokasi Bebas',
            photo_uploaded: !!selfie_url,
        };
    } catch (error: any) {
        console.error('[ClockIn] Unexpected error:', error);
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
        console.log('[ClockOut] Starting clock-out for attendance:', data.attendance_id);

        // 1. Verify location
        const verification = await verifyLocation(data.latitude, data.longitude);

        if (!verification.verified) {
            console.log('[ClockOut] Location verification failed:', verification.error);
            return {
                success: false,
                error: verification.error || `Lokasi tidak sah. Jarak: ${Math.round(verification.distance || 0)}m`,
                data: null,
            };
        }

        console.log('[ClockOut] Location verified:', verification.bypass_reason || verification.nearest_location?.name);

        // 2. Upload selfie (optional - allow clock-out without photo if upload fails)
        let selfie_url: string | null = null;
        const { path, error: uploadError } = await uploadAttendancePhoto(
            data.staff_id,
            data.selfie_file
        );

        if (uploadError) {
            console.warn('[ClockOut] Photo upload failed:', uploadError);
            // Continue without photo - don't block clock-out
            selfie_url = null;
        } else {
            selfie_url = path;
            console.log('[ClockOut] Photo uploaded:', selfie_url);
        }

        // 3. Update attendance record
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('[ClockOut] Supabase client not available');
            return {
                success: false,
                error: 'Supabase tidak dikonfigurasi',
                data: null,
            };
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });

        // Fetch current notes first to append
        const { data: currentRecord, error: fetchError } = await (supabase as any)
            .from('attendance')
            .select('notes')
            .eq('id', data.attendance_id)
            .single();

        if (fetchError) {
            console.warn('[ClockOut] Could not fetch current record:', fetchError);
        }

        const currentNotes = currentRecord?.notes ? `${currentRecord.notes}\n` : '';
        const noteEntry = verification.bypass_reason
            ? `[Clock Out] Time: ${timeStr} [Bypass: ${verification.bypass_reason}]`
            : `[Clock Out] Time: ${timeStr}, Location: ${verification.nearest_location?.name || 'Unknown'}`;

        const updates = {
            clock_out_time: timeStr,
            clock_out_photo_url: selfie_url,
            notes: `${currentNotes}${noteEntry}`
        };

        console.log('[ClockOut] Updating attendance record:', { ...updates, clock_out_photo_url: selfie_url ? '(photo)' : null });

        const { data: record, error } = await (supabase as any)
            .from('attendance')
            .update(updates)
            .eq('id', data.attendance_id)
            .select()
            .single();

        if (error) {
            console.error('[ClockOut] Error updating attendance record:', error);
            return { success: false, error: `Gagal clock out: ${error.message}`, data: null };
        }

        console.log('[ClockOut] Success! Record ID:', record.id);

        return {
            success: true,
            data: record,
            error: null,
            location_name: verification.nearest_location?.name || 'Lokasi Bebas',
            photo_uploaded: !!selfie_url,
        };

    } catch (error: any) {
        console.error('[ClockOut] Unexpected error:', error);
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
