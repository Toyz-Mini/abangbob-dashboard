'use server';

import { auth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

export async function fetchStaffAction() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
        .from('staff')
        .select('*')
        .order('name');

    if (error) throw new Error(error.message);

    // Merge extended_data logic (copied from operations.ts)
    return (data || []).map(staff => {
        const camelCased = toCamelCase(staff);
        if (camelCased.extendedData) {
            return {
                ...camelCased,
                ...camelCased.extendedData,
                extendedData: undefined,
            };
        }
        return camelCased;
    });
}

export async function insertStaffAction(staff: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();

    // Replicate logic from operations.ts
    const baseFields = {
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        status: staff.status,
        pin: staff.pin,
        hourly_rate: staff.hourlyRate,
        ic_number: staff.icNumber,
        employment_type: staff.employmentType,
        join_date: staff.joinDate,
        profile_photo_url: staff.profilePhotoUrl,
        outlet_id: staff.outletId,
        date_of_birth: staff.dateOfBirth,
        gender: staff.gender,
        marital_status: staff.maritalStatus,
        address: staff.address,
        nationality: staff.nationality,
        religion: staff.religion,
        position: staff.position,
        department: staff.department,
        bank_details: staff.bankDetails,
        emergency_contact: staff.emergencyContact,
    };

    const extendedFields = {
        employeeNumber: staff.employeeNumber,
        contractEndDate: staff.contractEndDate,
        probationEndDate: staff.probationEndDate,
        reportingTo: staff.reportingTo,
        workLocation: staff.workLocation,
        salaryType: staff.salaryType,
        baseSalary: staff.baseSalary,
        dailyRate: staff.dailyRate,
        overtimeRate: staff.overtimeRate,
        allowances: staff.allowances,
        fixedDeductions: staff.fixedDeductions,
        paymentFrequency: staff.paymentFrequency,
        statutoryContributions: staff.statutoryContributions,
        leaveEntitlement: staff.leaveEntitlement,
        accessLevel: staff.accessLevel,
        permissions: staff.permissions,
        schedulePreferences: staff.schedulePreferences,
        documents: staff.documents,
        skills: staff.skills,
        certifications: staff.certifications,
        uniformSize: staff.uniformSize,
        shoeSize: staff.shoeSize,
        dietaryRestrictions: staff.dietaryRestrictions,
        medicalConditions: staff.medicalConditions,
        bloodType: staff.bloodType,
        notes: staff.notes,
        performanceBadges: staff.performanceBadges,
        terminationDate: staff.terminationDate,
        terminationReason: staff.terminationReason,
    };

    const { data, error } = await adminClient
        .from('staff')
        // @ts-ignore
        .insert({
            ...baseFields,
            extended_data: extendedFields,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    const result = toCamelCase(data);
    if (result.extendedData) {
        return {
            ...result,
            ...result.extendedData,
            extendedData: undefined,
        };
    }
    return result;
}

export async function updateStaffAction(id: string, updates: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();

    const baseFields: any = {};
    const extendedFields: any = {};

    const baseFieldsList = [
        'name', 'email', 'phone', 'role', 'status', 'pin', 'hourlyRate',
        'icNumber', 'employmentType', 'joinDate', 'profilePhotoUrl', 'outletId',
        'dateOfBirth', 'gender', 'maritalStatus', 'address', 'nationality', 'religion',
        'position', 'department', 'bankDetails', 'emergencyContact'
    ];

    for (const [key, value] of Object.entries(updates)) {
        if (baseFieldsList.includes(key)) {
            baseFields[key] = value;
        } else {
            extendedFields[key] = value;
        }
    }

    let finalUpdate: any = toSnakeCase(baseFields);

    if (Object.keys(extendedFields).length > 0) {
        const { data: currentData } = await adminClient
            .from('staff')
            .select('extended_data')
            .eq('id', id)
            .single();

        const currentExtendedData = (currentData as any)?.extended_data || {};

        finalUpdate.extended_data = {
            ...currentExtendedData,
            ...extendedFields,
        };
    }

    const { data, error } = await adminClient
        .from('staff')
        .update(finalUpdate as any)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);

    const result = toCamelCase(data);
    if (result.extendedData) {
        return {
            ...result,
            ...result.extendedData,
            extendedData: undefined,
        };
    }
    return result;
}

export async function deleteStaffAction(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient
        .from('staff')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}
// ============ STAFF POSITIONS ============

export async function fetchStaffPositionsAction() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    // Return empty if unauthorized, similar to other fetchers? 
    // Or throw? Given the UI shows empty state, empty array is safer for now, 
    // but ideally we want to see them if we are staff.
    if (!session) return [];

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
        .from('staff_positions')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error fetching staff positions:', error);
        throw new Error(error.message);
    }

    return toCamelCase(data || []);
}

export async function insertStaffPositionAction(position: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCased = toSnakeCase(position);

    const { data, error } = await adminClient
        .from('staff_positions')
        // @ts-ignore
        .insert(snakeCased)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function updateStaffPositionAction(id: string, updates: any) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCased = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('staff_positions')
        // @ts-ignore
        .update(snakeCased)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function deleteStaffPositionAction(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient
        .from('staff_positions')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}
