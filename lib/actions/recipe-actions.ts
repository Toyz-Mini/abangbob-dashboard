'use server';

import { getServerSession } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';

// ============ RECIPE ACTIONS ============

export async function insertRecipeAction(recipe: any) {
    const session = await getServerSession();
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedRecipe = toSnakeCase(recipe);

    const { data, error } = await adminClient
        .from('recipes')
        // @ts-ignore
        .insert(snakeCasedRecipe)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function updateRecipeAction(id: string, updates: any) {
    const session = await getServerSession();
    if (!session) throw new Error('Unauthorized');

    const adminClient = getSupabaseAdmin();
    const snakeCasedUpdates = toSnakeCase(updates);

    const { data, error } = await adminClient
        .from('recipes')
        // @ts-ignore
        .update(snakeCasedUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}
