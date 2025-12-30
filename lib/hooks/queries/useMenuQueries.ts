import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { MenuItem, MenuCategory, ModifierGroup, ModifierOption } from '@/lib/types';

// Query Keys
export const menuKeys = {
    all: ['menu'] as const,
    items: () => [...menuKeys.all, 'items'] as const,
    categories: () => [...menuKeys.all, 'categories'] as const,
    modifierGroups: () => [...menuKeys.all, 'modifierGroups'] as const,
    modifierOptions: () => [...menuKeys.all, 'modifierOptions'] as const,
};

// Fetch Functions
async function fetchMenuItems(): Promise<MenuItem[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name'); // Default sort

    if (error) throw new Error(error.message);

    // Map Supabase response to MenuItem interface if needed
    // Assuming direct mapping for now based on types
    return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        cost: item.cost,
        image: item.image,
        description: item.description,
        ingredients: item.ingredients || [],
        isAvailable: item.is_available ?? item.isAvailable, // Handle both snake_case (DB) and camelCase (if JSON)
        modifierGroupIds: item.modifier_group_ids || item.modifierGroupIds || [],
    }));
}

async function fetchMenuCategories(): Promise<MenuCategory[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order');

    if (error) throw new Error(error.message);

    return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        color: item.color,
        sortOrder: item.sort_order ?? item.sortOrder,
        isActive: item.is_active ?? item.isActive,
        createdAt: item.created_at,
    }));
}

async function fetchModifierGroups(): Promise<ModifierGroup[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('modifier_groups')
        .select('*')
        .order('name');

    if (error) throw new Error(error.message);

    return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        isRequired: item.is_required ?? item.isRequired,
        allowMultiple: item.allow_multiple ?? item.allowMultiple,
        minSelection: item.min_selection ?? item.minSelection,
        maxSelection: item.max_selection ?? item.maxSelection,
    }));
}

async function fetchModifierOptions(): Promise<ModifierOption[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('modifier_options')
        .select('*')
        .order('name');

    if (error) throw new Error(error.message);

    return (data || []).map((item: any) => ({
        id: item.id,
        groupId: item.group_id ?? item.groupId,
        name: item.name,
        extraPrice: item.extra_price ?? item.extraPrice,
        isAvailable: item.is_available ?? item.isAvailable,
        ingredients: item.ingredients || [],
    }));
}

// Hooks
export function useMenuQuery() {
    return useQuery({
        queryKey: menuKeys.items(),
        queryFn: fetchMenuItems,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useMenuCategoriesQuery() {
    return useQuery({
        queryKey: menuKeys.categories(),
        queryFn: fetchMenuCategories,
        staleTime: 1000 * 60 * 60, // 1 hour (changes rarely)
    });
}

export function useModifierGroupsQuery() {
    return useQuery({
        queryKey: menuKeys.modifierGroups(),
        queryFn: fetchModifierGroups,
        staleTime: 1000 * 60 * 5,
    });
}

export function useModifierOptionsQuery() {
    return useQuery({
        queryKey: menuKeys.modifierOptions(),
        queryFn: fetchModifierOptions,
        staleTime: 1000 * 60 * 5,
    });
}
