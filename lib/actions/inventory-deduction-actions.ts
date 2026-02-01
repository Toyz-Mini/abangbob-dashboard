'use server';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { toCamelCase } from '@/lib/supabase/operations';
import { RecipeIngredient } from '@/lib/types';
import { triggerNotification } from '@/lib/notifications/dispatcher';

// Type definition for inventory item from DB
interface InventoryItem {
    id: string;
    name: string;
    current_quantity: number;
    min_quantity: number;
    unit: string;
    cost: number;
    item_type?: string;
    [key: string]: any;
}

// Type definition for inventory log from DB
interface InventoryLogRecord {
    id: string;
    stock_item_id: string;
    stock_item_name: string;
    quantity: number;
    source: string;
    created_at: string;
    [key: string]: any;
}

// ============ INVENTORY DEDUCTION ACTIONS ============

/**
 * Deduct inventory for a completed order based on menu item recipes
 * Called when order status changes to 'completed'
 */
export async function deductInventoryForOrderAction(params: {
    orderId: string;
    orderNumber: string;
    items: Array<{
        menuItemId: string;
        name: string;
        quantity: number;
    }>;
    staffId?: string;
}) {
    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager', 'staff']);

    const { orderId, orderNumber, items, staffId } = params;
    const adminClient = getSupabaseAdmin();

    const deductionResults: Array<{
        menuItemName: string;
        ingredientsDeducted: Array<{
            stockItemId: string;
            stockItemName: string;
            quantity: number;
            unit: string;
            success: boolean;
            resultingStock?: number;
            warning?: string;
        }>;
    }> = [];

    // Process each order item
    for (const item of items) {
        // 1. Get recipe for menu item
        const { data: recipe, error: recipeError } = await adminClient
            .from('recipes')
            .select('*')
            .eq('menu_item_id', item.menuItemId)
            .eq('recipe_type', 'menu')
            .eq('is_active', true)
            .single();

        if (recipeError || !recipe) {
            // No recipe found for this item - skip (might be a simple item without recipe)
            console.log(`[deductInventory] No recipe found for ${item.name}, skipping deduction`);
            continue;
        }

        const recipeData = recipe as any;
        const ingredients = recipeData.ingredients || [];
        const itemDeductions: Array<{
            stockItemId: string;
            stockItemName: string;
            quantity: number;
            unit: string;
            success: boolean;
            resultingStock?: number;
            warning?: string;
        }> = [];

        // 2. Deduct each ingredient × order quantity
        for (const ingredient of ingredients as RecipeIngredient[]) {
            const totalQuantityNeeded = ingredient.quantity * item.quantity;

            try {
                // Get current stock
                const { data: currentStock, error: fetchError } = await adminClient
                    .from('inventory')
                    .select('current_quantity, name, min_quantity')
                    .eq('id', ingredient.stockItemId)
                    .single();

                const stockData = currentStock as InventoryItem | null;

                if (fetchError || !stockData) {
                    itemDeductions.push({
                        stockItemId: ingredient.stockItemId,
                        stockItemName: ingredient.stockItemName,
                        quantity: totalQuantityNeeded,
                        unit: ingredient.unit,
                        success: false,
                        warning: 'Stock item not found in inventory'
                    });
                    continue;
                }

                const previousQuantity = stockData.current_quantity || 0;
                const newQuantity = previousQuantity - totalQuantityNeeded;

                // Update inventory (allow negative - soft warning approach)
                const { error: updateError } = await (adminClient
                    .from('inventory') as any)
                    .update({
                        current_quantity: newQuantity,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', ingredient.stockItemId);

                if (updateError) {
                    itemDeductions.push({
                        stockItemId: ingredient.stockItemId,
                        stockItemName: ingredient.stockItemName,
                        quantity: totalQuantityNeeded,
                        unit: ingredient.unit,
                        success: false,
                        warning: `Update failed: ${updateError.message}`
                    });
                    continue;
                }

                // Log the deduction
                await adminClient
                    .from('inventory_logs')
                    .insert({
                        stock_item_id: ingredient.stockItemId,
                        stock_item_name: ingredient.stockItemName,
                        type: 'out',
                        quantity: -totalQuantityNeeded,
                        previous_quantity: previousQuantity,
                        new_quantity: newQuantity,
                        reason: `Order ${orderNumber}: ${item.quantity}x ${item.name}`,
                        source: 'order',
                        order_id: orderId,
                        order_number: orderNumber,
                        created_by: staffId
                    } as any);

                // Generate warning if stock is low or negative
                let warning: string | undefined;
                if (newQuantity < 0) {
                    warning = `NEGATIVE STOCK: ${newQuantity} ${ingredient.unit}`;
                    // Trigger Urgent Alert
                    triggerNotification('LOW_STOCK_ALERT', {
                        to: '60126764769', // Hardcoded Boss Phone
                        data: { itemName: ingredient.stockItemName, qty: newQuantity, unit: ingredient.unit }
                    });
                } else if (newQuantity <= (stockData.min_quantity || 0)) {
                    warning = `LOW STOCK: ${newQuantity} ${ingredient.unit} (min: ${stockData.min_quantity})`;
                    // Trigger Low Stock Alert
                    triggerNotification('LOW_STOCK_ALERT', {
                        to: '60126764769', // Hardcoded Boss Phone
                        data: { itemName: ingredient.stockItemName, qty: newQuantity, unit: ingredient.unit }
                    });
                }

                itemDeductions.push({
                    stockItemId: ingredient.stockItemId,
                    stockItemName: ingredient.stockItemName,
                    quantity: totalQuantityNeeded,
                    unit: ingredient.unit,
                    success: true,
                    resultingStock: newQuantity,
                    warning
                });

            } catch (err) {
                console.error(`[deductInventory] Error processing ${ingredient.stockItemName}:`, err);
                itemDeductions.push({
                    stockItemId: ingredient.stockItemId,
                    stockItemName: ingredient.stockItemName,
                    quantity: totalQuantityNeeded,
                    unit: ingredient.unit,
                    success: false,
                    warning: 'Unexpected error during deduction'
                });
            }
        }

        deductionResults.push({
            menuItemName: item.name,
            ingredientsDeducted: itemDeductions
        });
    }

    // Check for any warnings (low/negative stock)
    const warnings = deductionResults.flatMap(result =>
        result.ingredientsDeducted
            .filter(d => d.warning)
            .map(d => `${d.stockItemName}: ${d.warning}`)
    );

    return {
        success: true,
        orderId,
        orderNumber,
        deductionResults,
        hasWarnings: warnings.length > 0,
        warnings
    };
}

/**
 * Reverse inventory deductions for a voided/refunded order
 */
export async function reverseOrderDeductionsAction(params: {
    orderId: string;
    orderNumber: string;
    staffId?: string;
    reason: string;
}) {
    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager']);

    const { orderId, orderNumber, staffId, reason } = params;
    const adminClient = getSupabaseAdmin();

    // 1. Get all inventory logs for this order
    const { data: logs, error: logsError } = await adminClient
        .from('inventory_logs')
        .select('*')
        .eq('order_id', orderId)
        .eq('source', 'order');

    if (logsError) {
        throw new Error(`Failed to fetch order logs: ${logsError.message}`);
    }

    const logsData = (logs || []) as InventoryLogRecord[];

    if (logsData.length === 0) {
        return {
            success: true,
            message: 'No inventory deductions found for this order',
            reversedCount: 0
        };
    }

    // 2. Reverse each deduction
    let reversedCount = 0;
    for (const log of logsData) {
        const quantityToAdd = Math.abs(log.quantity); // Original was negative

        // Get current stock
        const { data: currentStock, error: fetchError } = await adminClient
            .from('inventory')
            .select('current_quantity')
            .eq('id', log.stock_item_id)
            .single();

        const stockData = currentStock as InventoryItem | null;

        if (fetchError || !stockData) {
            console.error(`[reverseDeductions] Stock item ${log.stock_item_id} not found`);
            continue;
        }

        const previousQuantity = stockData.current_quantity || 0;
        const newQuantity = previousQuantity + quantityToAdd;

        // Update inventory
        await (adminClient
            .from('inventory') as any)
            .update({
                current_quantity: newQuantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', log.stock_item_id);

        // Log the reversal
        await adminClient
            .from('inventory_logs')
            .insert({
                stock_item_id: log.stock_item_id,
                stock_item_name: log.stock_item_name,
                type: 'in',
                quantity: quantityToAdd,
                previous_quantity: previousQuantity,
                new_quantity: newQuantity,
                reason: `Reversal for ${orderNumber}: ${reason}`,
                source: 'adjustment',
                order_id: orderId,
                order_number: orderNumber,
                created_by: staffId
            } as any);

        reversedCount++;
    }

    return {
        success: true,
        message: `Reversed ${reversedCount} inventory deductions`,
        reversedCount
    };
}

/**
 * Get inventory movement summary for dashboard
 */
export async function getInventoryMovementSummaryAction(params?: {
    startDate?: string;
    endDate?: string;
}) {
    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager', 'staff']);

    const adminClient = getSupabaseAdmin();

    // Default to last 7 days
    const endDate = params?.endDate || new Date().toISOString().split('T')[0];
    const startDate = params?.startDate || (() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    })();

    // Get all logs in date range
    const { data: logs, error } = await adminClient
        .from('inventory_logs')
        .select('*')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch inventory logs: ${error.message}`);
    }

    const logsData = (logs || []) as InventoryLogRecord[];

    // Calculate summary
    const summary = {
        totalIn: 0,
        totalOut: 0,
        bySource: {
            manual: { in: 0, out: 0 },
            production: { in: 0, out: 0 },
            order: { in: 0, out: 0 },
            waste: { in: 0, out: 0 },
            restock: { in: 0, out: 0 },
            adjustment: { in: 0, out: 0 }
        },
        topUsedItems: [] as Array<{ name: string; quantity: number }>,
        dailyMovement: [] as Array<{ date: string; in: number; out: number }>
    };

    const itemUsage = new Map<string, number>();
    const dailyData = new Map<string, { in: number; out: number }>();

    for (const log of logsData) {
        const qty = log.quantity || 0;
        const source = (log.source || 'manual') as keyof typeof summary.bySource;
        const date = log.created_at?.split('T')[0] || '';

        if (qty > 0) {
            summary.totalIn += qty;
            if (summary.bySource[source]) {
                summary.bySource[source].in += qty;
            }
        } else {
            summary.totalOut += Math.abs(qty);
            if (summary.bySource[source]) {
                summary.bySource[source].out += Math.abs(qty);
            }
        }

        // Track item usage
        if (qty < 0) {
            const current = itemUsage.get(log.stock_item_name) || 0;
            itemUsage.set(log.stock_item_name, current + Math.abs(qty));
        }

        // Track daily movement
        if (!dailyData.has(date)) {
            dailyData.set(date, { in: 0, out: 0 });
        }
        const dayData = dailyData.get(date)!;
        if (qty > 0) {
            dayData.in += qty;
        } else {
            dayData.out += Math.abs(qty);
        }
    }

    // Sort and get top 10 used items
    summary.topUsedItems = Array.from(itemUsage.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, quantity]) => ({ name, quantity }));

    // Convert daily data to sorted array
    summary.dailyMovement = Array.from(dailyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => ({ date, ...data }));

    return summary;
}

/**
 * Get stock level overview for dashboard
 */
export async function getStockOverviewAction() {
    const { requireRole } = await import('@/lib/supabase/server-auth');
    await requireRole(['admin', 'manager', 'staff']);

    const adminClient = getSupabaseAdmin();

    // Get all inventory items
    const { data: items, error } = await adminClient
        .from('inventory')
        .select('*')
        .order('name');

    if (error) {
        throw new Error(`Failed to fetch inventory: ${error.message}`);
    }

    const itemsData = (items || []) as InventoryItem[];

    const overview = {
        totalItems: itemsData.length,
        totalValue: 0,
        byStatus: {
            healthy: 0,
            low: 0,
            out: 0,
            negative: 0
        },
        byType: {
            raw: 0,
            'semi-finished': 0,
            finished: 0
        },
        criticalItems: [] as Array<{
            id: string;
            name: string;
            currentQuantity: number;
            minQuantity: number;
            unit: string;
            status: string;
        }>
    };

    for (const item of itemsData) {
        // Calculate total value
        overview.totalValue += (item.current_quantity || 0) * (item.cost || 0);

        // Count by type
        const itemType = (item.item_type || 'raw') as keyof typeof overview.byType;
        if (overview.byType[itemType] !== undefined) {
            overview.byType[itemType]++;
        }

        // Determine status
        let status: string;
        if (item.current_quantity < 0) {
            status = 'negative';
            overview.byStatus.negative++;
        } else if (item.current_quantity === 0) {
            status = 'out';
            overview.byStatus.out++;
        } else if (item.current_quantity <= (item.min_quantity || 0)) {
            status = 'low';
            overview.byStatus.low++;
        } else {
            status = 'healthy';
            overview.byStatus.healthy++;
        }

        // Add to critical items if not healthy
        if (status !== 'healthy') {
            overview.criticalItems.push({
                id: item.id,
                name: item.name,
                currentQuantity: item.current_quantity,
                minQuantity: item.min_quantity,
                unit: item.unit,
                status
            });
        }
    }

    // Sort critical items by severity
    overview.criticalItems.sort((a, b) => {
        const priority = { negative: 0, out: 1, low: 2 };
        return (priority[a.status as keyof typeof priority] || 3) -
            (priority[b.status as keyof typeof priority] || 3);
    });

    return overview;
}
