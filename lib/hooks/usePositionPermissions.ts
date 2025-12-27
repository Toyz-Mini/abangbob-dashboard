'use client';

import { useMemo, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/contexts/AuthContext';
import { StaffPermissions, StaffPosition } from '@/lib/types';

// Default permissions for when no position is assigned
const DEFAULT_PERMISSIONS: StaffPermissions = {
    canApproveLeave: false,
    canApproveClaims: false,
    canViewReports: false,
    canManageStaff: false,
    canAccessPOS: true,
    canGiveDiscount: false,
    maxDiscountPercent: 0,
    canVoidTransaction: false,
    canAccessInventory: false,
    canAccessFinance: false,
    canAccessKDS: false,
    canManageMenu: false,
};

// Admin gets all permissions
const ADMIN_PERMISSIONS: StaffPermissions = {
    canApproveLeave: true,
    canApproveClaims: true,
    canViewReports: true,
    canManageStaff: true,
    canAccessPOS: true,
    canGiveDiscount: true,
    maxDiscountPercent: 100,
    canVoidTransaction: true,
    canAccessInventory: true,
    canAccessFinance: true,
    canAccessKDS: true,
    canManageMenu: true,
};

interface UsePositionPermissionsReturn {
    // Current user's permissions
    permissions: StaffPermissions;
    position: StaffPosition | null;

    // Permission checkers
    can: (permission: keyof Omit<StaffPermissions, 'maxDiscountPercent'>) => boolean;
    canGiveDiscountUpTo: (percent: number) => boolean;

    // Available positions
    positions: StaffPosition[];
    getPositionsForRole: (role: 'Manager' | 'Staff') => StaffPosition[];
    getPositionById: (id: string) => StaffPosition | undefined;
    getPositionByName: (name: string) => StaffPosition | undefined;

    // Check permissions for a specific staff member
    getPermissionsForStaff: (staffId: string) => StaffPermissions;
}

export function usePositionPermissions(): UsePositionPermissionsReturn {
    const { positions, staff } = useStore();
    const { currentStaff, user } = useAuth();

    // Get current user's position and permissions
    const { position, permissions } = useMemo(() => {
        // If user role is Admin (from auth context), give full permissions
        if (user?.role === 'Admin') {
            return { position: null, permissions: ADMIN_PERMISSIONS };
        }

        // Find the current staff member in the store
        const staffMember = staff.find(s =>
            s.id === currentStaff?.id ||
            s.email === currentStaff?.email ||
            s.email === user?.email
        );

        if (!staffMember) {
            return { position: null, permissions: DEFAULT_PERMISSIONS };
        }

        // Try to find position by ID first
        let foundPosition: StaffPosition | undefined;

        if (staffMember.positionId) {
            foundPosition = positions.find(p => p.id === staffMember.positionId);
        }

        // Fallback: find by position name
        if (!foundPosition && staffMember.position) {
            foundPosition = positions.find(p => p.name === staffMember.position);
        }

        if (foundPosition) {
            return {
                position: foundPosition,
                permissions: foundPosition.permissions || DEFAULT_PERMISSIONS
            };
        }

        // Check if staff has inline permissions
        if (staffMember.permissions) {
            return {
                position: null,
                permissions: staffMember.permissions
            };
        }

        return { position: null, permissions: DEFAULT_PERMISSIONS };
    }, [currentStaff, user, staff, positions]);

    // Permission checker
    const can = useCallback((permission: keyof Omit<StaffPermissions, 'maxDiscountPercent'>): boolean => {
        return permissions[permission] === true;
    }, [permissions]);

    // Discount permission checker
    const canGiveDiscountUpTo = useCallback((percent: number): boolean => {
        if (!permissions.canGiveDiscount) return false;
        return permissions.maxDiscountPercent >= percent;
    }, [permissions]);

    // Get positions for a role
    const getPositionsForRole = useCallback((role: 'Manager' | 'Staff'): StaffPosition[] => {
        return positions.filter(p => p.role === role && p.isActive);
    }, [positions]);

    // Get position by ID
    const getPositionById = useCallback((id: string): StaffPosition | undefined => {
        return positions.find(p => p.id === id);
    }, [positions]);

    // Get position by name
    const getPositionByName = useCallback((name: string): StaffPosition | undefined => {
        return positions.find(p => p.name === name);
    }, [positions]);

    // Get permissions for any staff member
    const getPermissionsForStaff = useCallback((staffId: string): StaffPermissions => {
        const staffMember = staff.find(s => s.id === staffId);

        if (!staffMember) return DEFAULT_PERMISSIONS;

        // Find position by ID
        let foundPosition: StaffPosition | undefined;

        if (staffMember.positionId) {
            foundPosition = positions.find(p => p.id === staffMember.positionId);
        }

        // Fallback: find by position name
        if (!foundPosition && staffMember.position) {
            foundPosition = positions.find(p => p.name === staffMember.position);
        }

        if (foundPosition) {
            return foundPosition.permissions || DEFAULT_PERMISSIONS;
        }

        // Check inline permissions
        if (staffMember.permissions) {
            return staffMember.permissions;
        }

        return DEFAULT_PERMISSIONS;
    }, [staff, positions]);

    return {
        permissions,
        position,
        can,
        canGiveDiscountUpTo,
        positions,
        getPositionsForRole,
        getPositionById,
        getPositionByName,
        getPermissionsForStaff,
    };
}

// Export helper type for components
export type PermissionKey = keyof Omit<StaffPermissions, 'maxDiscountPercent'>;
