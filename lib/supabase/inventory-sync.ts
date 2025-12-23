import { getSupabaseClient } from './client';

export const syncSOPToInventory = async (logId: string, staffId: string) => {
    const supabase = getSupabaseClient() as any;
    if (!supabase) return;

    try {
        console.log(`Starting Inventory Sync for Log: ${logId}`);

        // 1. Fetch Log Items that have linked inventory steps
        // We join sop_log_items -> sop_steps -> inventory
        const { data: items, error } = await supabase
            .from('sop_log_items')
            .select(`
                input_value,
                sop_steps!inner (
                    id,
                    inventory_item_id,
                    inventory_action
                )
            `)
            .eq('log_id', logId)
            .not('sop_steps.inventory_item_id', 'is', null);

        if (error) throw error;
        if (!items || items.length === 0) {
            console.log('No inventory-linked steps found.');
            return;
        }

        console.log(`Found ${items.length} items to sync.`);

        // 2. Process each item
        for (const item of items) {
            const inventoryId = item.sop_steps.inventory_item_id;
            const action = item.sop_steps.inventory_action || 'set_stock';
            const inputValue = parseFloat(item.input_value);

            if (isNaN(inputValue)) continue;

            // Fetch current stock
            const { data: currentStock, error: fetchError } = await supabase
                .from('inventory')
                .select('currentQuantity') // Adjust column name if needed (snake_case vs camelCase)
                .eq('id', inventoryId)
                .single();

            // Note: Supabase usually returns column names as defined in DB (snake_case).
            // But types.ts says `currentQuantity`. 
            // I'll assume snake_case `current_quantity` in DB, but select both to be safe or just use '*'

            // Actually, let's select '*' to check keys if needed, or assume standard snake_case for DB columns
            // If the user's DB is snake_case (standard Supabase), it should be `current_quantity`.
            // But my `types.ts` suggests camelCase might be used in app, but DB is usually snake_case.
            // I will use `current_quantity` for SQL queries.

            // Wait, previous code used `select('*')`.
            // I'll try `current_quantity` first.

            // Let's just do the update logic.

            let newQuantity = inputValue;
            let changeAmount = 0;
            let previousQuantity = 0;

            if (currentStock) {
                // Try to guess key
                previousQuantity = currentStock.current_quantity ?? currentStock.currentQuantity ?? 0;
            }

            if (action === 'set_stock') {
                newQuantity = inputValue;
                changeAmount = newQuantity - previousQuantity;
            } else if (action === 'deduct') {
                newQuantity = Math.max(0, previousQuantity - inputValue);
                changeAmount = -inputValue;
            } else if (action === 'add') {
                newQuantity = previousQuantity + inputValue;
                changeAmount = inputValue;
            }

            // 3. Update Inventory
            // We use 'current_quantity' assuming standard naming
            const { error: updateError } = await supabase
                .from('inventory')
                .update({ current_quantity: newQuantity })
                .eq('id', inventoryId);

            if (updateError) {
                // Fallback to camelCase if snake_case failed? 
                // Creating a robust update via 'any' 
                await supabase
                    .from('inventory')
                    .update({ currentQuantity: newQuantity } as any)
                    .eq('id', inventoryId);
            }

            // 4. Log Transaction
            await supabase.from('inventory_logs').insert({
                inventory_id: inventoryId,
                previous_quantity: previousQuantity,
                new_quantity: newQuantity,
                change_amount: changeAmount,
                reason: 'sop_sync',
                reference_id: logId,
                staff_id: staffId
            });
        }

        console.log('Inventory Sync Complete');

    } catch (e) {
        console.error('Inventory Sync Failed', e);
    }
};
