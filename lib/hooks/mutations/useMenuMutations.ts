import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { MenuItem, MenuCategory, ModifierGroup, ModifierOption } from '@/lib/types';
import toast from 'react-hot-toast';
import { menuKeys } from '../queries/useMenuQueries';

// ==================== MENU ITEMS ====================

export function useAddMenuItemMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newItem: Omit<MenuItem, 'id'>) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            const { data, error } = await supabase
                .from('menu_items')
                .insert({
                    name: newItem.name,
                    category: newItem.category,
                    price: newItem.price,
                    cost: newItem.cost,
                    image: newItem.image,
                    description: newItem.description,
                    ingredients: newItem.ingredients,
                    is_available: newItem.isAvailable,
                    modifier_group_ids: newItem.modifierGroupIds,
                })
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.items() });
            toast.success('Menu item added successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to add menu item: ${error.message}`);
        },
    });
}

export function useUpdateMenuItemMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<MenuItem> }) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            // Map camelCase updates to snake_case for DB
            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.category !== undefined) dbUpdates.category = updates.category;
            if (updates.price !== undefined) dbUpdates.price = updates.price;
            if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
            if (updates.image !== undefined) dbUpdates.image = updates.image;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.ingredients !== undefined) dbUpdates.ingredients = updates.ingredients;
            if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;
            if (updates.modifierGroupIds !== undefined) dbUpdates.modifier_group_ids = updates.modifierGroupIds;

            const { data, error } = await supabase
                .from('menu_items')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.items() });
            toast.success('Menu item updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update menu item: ${error.message}`);
        },
    });
}

export function useDeleteMenuItemMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            const { error } = await supabase
                .from('menu_items')
                .delete()
                .eq('id', id);

            if (error) throw new Error(error.message);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.items() });
            toast.success('Menu item deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete menu item: ${error.message}`);
        },
    });
}

// ==================== CATEGORIES ====================

export function useAddMenuCategoryMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newCategory: Omit<MenuCategory, 'id' | 'createdAt'>) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            const { data, error } = await supabase
                .from('menu_categories')
                .insert({
                    name: newCategory.name,
                    description: newCategory.description,
                    color: newCategory.color,
                    sort_order: newCategory.sortOrder,
                    is_active: newCategory.isActive,
                })
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
            toast.success('Category added successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to add category: ${error.message}`);
        },
    });
}

export function useUpdateMenuCategoryMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<MenuCategory> }) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.color !== undefined) dbUpdates.color = updates.color;
            if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
            if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

            const { data, error } = await supabase
                .from('menu_categories')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
            toast.success('Category updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update category: ${error.message}`);
        },
    });
}

export function useDeleteMenuCategoryMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            const { error } = await supabase
                .from('menu_categories')
                .delete()
                .eq('id', id);

            if (error) throw new Error(error.message);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
            toast.success('Category deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete category: ${error.message}`);
        },
    });
}

// ==================== MODIFIER GROUPS ====================

export function useAddModifierGroupMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newGroup: Omit<ModifierGroup, 'id'>) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            const { data, error } = await supabase
                .from('modifier_groups')
                .insert({
                    name: newGroup.name,
                    is_required: newGroup.isRequired,
                    allow_multiple: newGroup.allowMultiple,
                    min_selection: newGroup.minSelection,
                    max_selection: newGroup.maxSelection,
                })
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.modifierGroups() });
            toast.success('Modifier group added successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to add modifier group: ${error.message}`);
        },
    });
}

export function useUpdateModifierGroupMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<ModifierGroup> }) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.isRequired !== undefined) dbUpdates.is_required = updates.isRequired;
            if (updates.allowMultiple !== undefined) dbUpdates.allow_multiple = updates.allowMultiple;
            if (updates.minSelection !== undefined) dbUpdates.min_selection = updates.minSelection;
            if (updates.maxSelection !== undefined) dbUpdates.max_selection = updates.maxSelection;

            const { data, error } = await supabase
                .from('modifier_groups')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.modifierGroups() });
            toast.success('Modifier group updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update modifier group: ${error.message}`);
        },
    });
}

export function useDeleteModifierGroupMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            const { error } = await supabase
                .from('modifier_groups')
                .delete()
                .eq('id', id);

            if (error) throw new Error(error.message);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.modifierGroups() });
            toast.success('Modifier group deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete modifier group: ${error.message}`);
        },
    });
}

// ==================== MODIFIER OPTIONS ====================

export function useAddModifierOptionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newOption: Omit<ModifierOption, 'id'>) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            const { data, error } = await supabase
                .from('modifier_options')
                .insert({
                    group_id: newOption.groupId,
                    name: newOption.name,
                    extra_price: newOption.extraPrice,
                    is_available: newOption.isAvailable,
                    ingredients: newOption.ingredients,
                })
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.modifierOptions() });
            toast.success('Modifier option added successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to add modifier option: ${error.message}`);
        },
    });
}

export function useUpdateModifierOptionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<ModifierOption> }) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            const dbUpdates: any = {};
            if (updates.groupId !== undefined) dbUpdates.group_id = updates.groupId;
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.extraPrice !== undefined) dbUpdates.extra_price = updates.extraPrice;
            if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;
            if (updates.ingredients !== undefined) dbUpdates.ingredients = updates.ingredients;

            const { data, error } = await supabase
                .from('modifier_options')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.modifierOptions() });
            toast.success('Modifier option updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update modifier option: ${error.message}`);
        },
    });
}

export function useDeleteModifierOptionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');

            const { error } = await supabase
                .from('modifier_options')
                .delete()
                .eq('id', id);

            if (error) throw new Error(error.message);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuKeys.modifierOptions() });
            toast.success('Modifier option deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete modifier option: ${error.message}`);
        },
    });
}
