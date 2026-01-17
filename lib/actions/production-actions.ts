'use server';
// @ts-nocheck - Supabase types need to be regenerated for this project

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { toSnakeCase, toCamelCase } from '@/lib/supabase/operations';
import { Recipe, RecipeIngredient, ProductionLog } from '@/lib/types';

// ============ PRODUCTION ACTIONS ============

/**
 * Get all production recipes (recipes used to create semi-finished goods)
 */
export async function getProductionRecipesAction() {
    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager', 'staff']);

    const adminClient = getSupabaseAdmin();

    const { data, error } = await adminClient
        .from('recipes')
        .select('*')
        .eq('recipe_type', 'production')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('[getProductionRecipesAction] Error:', error);
        throw new Error(`Database Error: ${error.message}`);
    }

    return toCamelCase(data || []) as Recipe[];
}

/**
 * Calculate production capacity based on current stock levels
 */
export async function calculateProductionCapacityAction(recipeId: string) {
    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager', 'staff']);

    const adminClient = getSupabaseAdmin();

    // 1. Get recipe with ingredients
    const { data: recipe, error: recipeError } = await adminClient
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

    if (recipeError || !recipe) {
        throw new Error('Recipe not found');
    }

    const recipeData = recipe as any;
    const ingredients = recipeData.ingredients || [];

    if (ingredients.length === 0) {
        return { maxBatches: 0, limitingIngredient: null, ingredientStatus: [] };
    }

    // 2. Get current stock for all ingredients
    const stockItemIds = ingredients.map((ing: RecipeIngredient) => ing.stockItemId);

    const { data: stockItems, error: stockError } = await adminClient
        .from('inventory')
        .select('id, name, current_quantity, unit')
        .in('id', stockItemIds);

    if (stockError) {
        throw new Error(`Failed to fetch stock: ${stockError.message}`);
    }

    // 3. Calculate max batches possible
    const stockMap = new Map(stockItems?.map(item => [item.id, item]) || []);

    let maxBatches = Infinity;
    let limitingIngredient: string | null = null;
    const ingredientStatus: Array<{
        stockItemId: string;
        stockItemName: string;
        requiredPerBatch: number;
        currentStock: number;
        unit: string;
        maxBatches: number;
        isLimiting: boolean;
    }> = [];

    for (const ingredient of ingredients as RecipeIngredient[]) {
        const stock = stockMap.get(ingredient.stockItemId);
        const currentStock = stock?.current_quantity || 0;
        const batchesPossible = ingredient.quantity > 0
            ? Math.floor(currentStock / ingredient.quantity)
            : Infinity;

        const isLimiting = batchesPossible < maxBatches;
        if (isLimiting) {
            maxBatches = batchesPossible;
            limitingIngredient = ingredient.stockItemName;
        }

        ingredientStatus.push({
            stockItemId: ingredient.stockItemId,
            stockItemName: ingredient.stockItemName,
            requiredPerBatch: ingredient.quantity,
            currentStock,
            unit: ingredient.unit,
            maxBatches: batchesPossible,
            isLimiting: false // Will update after loop
        });
    }

    // Mark the limiting ingredient
    ingredientStatus.forEach(ing => {
        if (ing.stockItemName === limitingIngredient) {
            ing.isLimiting = true;
        }
    });

    return {
        maxBatches: maxBatches === Infinity ? 0 : maxBatches,
        limitingIngredient,
        ingredientStatus
    };
}

/**
 * Execute production - deduct ingredients and add output
 */
export async function executeProductionAction(params: {
    recipeId: string;
    batchQuantity: number;
    notes?: string;
    staffId?: string;
    staffName?: string;
}) {
    const { requireRole } = await import('@/lib/supabase/server-auth');
    const { session } = await requireRole(['admin', 'manager', 'staff']);

    const { recipeId, batchQuantity, notes, staffId, staffName } = params;

    if (batchQuantity <= 0) {
        throw new Error('Batch quantity must be greater than 0');
    }

    const adminClient = getSupabaseAdmin();

    // 1. Get recipe
    const { data: recipe, error: recipeError } = await adminClient
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

    if (recipeError || !recipe) {
        throw new Error('Recipe not found');
    }

    const ingredients = recipe.ingredients || [];
    const outputQuantity = (recipe.output_quantity || 1) * batchQuantity;

    // 2. Calculate total ingredients needed
    const ingredientsToDeduct: Array<{
        stockItemId: string;
        stockItemName: string;
        quantity: number;
        unit: string;
        costPerUnit: number;
        totalCost: number;
    }> = [];

    let totalBatchCost = 0;

    for (const ingredient of (ingredients as unknown as RecipeIngredient[])) {
        const quantityNeeded = ingredient.quantity * batchQuantity;
        const cost = ingredient.costPerUnit * quantityNeeded;
        totalBatchCost += cost;

        ingredientsToDeduct.push({
            stockItemId: ingredient.stockItemId,
            stockItemName: ingredient.stockItemName,
            quantity: quantityNeeded,
            unit: ingredient.unit,
            costPerUnit: ingredient.costPerUnit,
            totalCost: cost
        });
    }

    // 3. Create production log first
    const { data: productionLog, error: logError } = await adminClient
        .from('production_logs')
        .insert({
            menu_item_name: recipe.name,
            recipe_id: recipeId,
            recipe_name: recipe.name,
            quantity_produced: outputQuantity,
            waste_amount: 0,
            ingredients_deducted: ingredientsToDeduct,
            output_inventory_id: recipe.output_inventory_id,
            output_quantity: outputQuantity,
            batch_cost: totalBatchCost,
            staff_id: staffId,
            staff_name: staffName,
            status: 'completed',
            notes: notes || null
        })
        .select()
        .single();

    if (logError) {
        throw new Error(`Failed to create production log: ${logError.message}`);
    }

    // 4. Deduct ingredients from inventory
    for (const ingredient of ingredientsToDeduct) {
        // Get current stock
        const { data: currentStock, error: fetchError } = await adminClient
            .from('inventory')
            .select('current_quantity, name')
            .eq('id', ingredient.stockItemId)
            .single();

        if (fetchError) {
            console.error(`Failed to fetch stock for ${ingredient.stockItemName}:`, fetchError);
            continue;
        }

        const previousQuantity = currentStock?.current_quantity || 0;
        const newQuantity = previousQuantity - ingredient.quantity;

        // Update inventory
        await adminClient
            .from('inventory')
            .update({
                current_quantity: newQuantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', ingredient.stockItemId);

        // Log the deduction
        await adminClient
            .from('inventory_logs')
            .insert({
                stock_item_id: ingredient.stockItemId,
                stock_item_name: ingredient.stockItemName,
                type: 'out',
                quantity: -ingredient.quantity,
                previous_quantity: previousQuantity,
                new_quantity: newQuantity,
                reason: `Production: ${recipe.name} (${batchQuantity} batch)`,
                source: 'production',
                production_log_id: productionLog.id,
                created_by: staffId
            });
    }

    // 5. Add output to inventory (if output_inventory_id exists)
    if (recipe.output_inventory_id) {
        const { data: outputStock, error: outputFetchError } = await adminClient
            .from('inventory')
            .select('current_quantity, name')
            .eq('id', recipe.output_inventory_id)
            .single();

        if (!outputFetchError && outputStock) {
            const previousQuantity = outputStock.current_quantity || 0;
            const newQuantity = previousQuantity + outputQuantity;

            // Update output inventory
            await adminClient
                .from('inventory')
                .update({
                    current_quantity: newQuantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', recipe.output_inventory_id);

            // Log the addition
            await adminClient
                .from('inventory_logs')
                .insert({
                    stock_item_id: recipe.output_inventory_id,
                    stock_item_name: outputStock.name,
                    type: 'in',
                    quantity: outputQuantity,
                    previous_quantity: previousQuantity,
                    new_quantity: newQuantity,
                    reason: `Production output: ${recipe.name} (${batchQuantity} batch)`,
                    source: 'production',
                    production_log_id: productionLog.id,
                    created_by: staffId
                });
        }
    }

    return {
        success: true,
        productionLog: toCamelCase(productionLog) as ProductionLog,
        ingredientsDeducted: ingredientsToDeduct,
        outputQuantity,
        totalCost: totalBatchCost
    };
}

/**
 * Get production logs with filtering
 */
export async function getProductionLogsAction(params?: {
    startDate?: string;
    endDate?: string;
    recipeId?: string;
    limit?: number;
}) {
    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager', 'staff']);

    const adminClient = getSupabaseAdmin();

    let query = adminClient
        .from('production_logs')
        .select('*')
        .order('created_at', { ascending: false });

    if (params?.startDate) {
        query = query.gte('date', params.startDate);
    }
    if (params?.endDate) {
        query = query.lte('date', params.endDate);
    }
    if (params?.recipeId) {
        query = query.eq('recipe_id', params.recipeId);
    }
    if (params?.limit) {
        query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Failed to fetch production logs: ${error.message}`);
    }

    return toCamelCase(data || []) as ProductionLog[];
}

/**
 * Get stock alerts
 */
export async function getStockAlertsAction(params?: {
    acknowledged?: boolean;
    alertType?: string;
}) {
    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager', 'staff']);

    const adminClient = getSupabaseAdmin();

    let query = adminClient
        .from('stock_alerts')
        .select('*')
        .order('created_at', { ascending: false });

    if (params?.acknowledged !== undefined) {
        query = query.eq('is_acknowledged', params.acknowledged);
    }
    if (params?.alertType) {
        query = query.eq('alert_type', params.alertType);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Failed to fetch stock alerts: ${error.message}`);
    }

    return toCamelCase(data || []);
}

/**
 * Acknowledge a stock alert
 */
export async function acknowledgeStockAlertAction(alertId: string, staffId: string) {
    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager']);

    const adminClient = getSupabaseAdmin();

    const { data, error } = await adminClient
        .from('stock_alerts')
        .update({
            is_acknowledged: true,
            acknowledged_by: staffId,
            acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }

    return toCamelCase(data);
}
