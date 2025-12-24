import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GoMamam Webhook Endpoint
 * 
 * This endpoint receives order notifications from GoMamam.
 * Since we don't have official API docs, this is designed to be flexible
 * and can handle various payload formats.
 * 
 * Expected payload (flexible structure):
 * {
 *   "order_id": "string",
 *   "customer": { "name": "string", "phone": "string" },
 *   "items": [{ "name": "string", "quantity": number, "price": number }],
 *   "total": number,
 *   "notes": "string" (optional)
 * }
 */

interface GoMamamOrderItem {
    id?: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
}

interface GoMamamPayload {
    order_id?: string;
    orderId?: string;
    id?: string;
    customer?: {
        name?: string;
        phone?: string;
    };
    customer_name?: string;
    customer_phone?: string;
    items?: GoMamamOrderItem[];
    total?: number;
    totalAmount?: number;
    amount?: number;
    notes?: string;
    special_instructions?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Get webhook secret from header (if GoMamam sends one)
        const signature = request.headers.get('x-webhook-signature') ||
            request.headers.get('x-gomamam-signature') ||
            request.headers.get('authorization');

        // Parse the payload
        const payload: GoMamamPayload = await request.json();

        console.log('[GoMamam Webhook] Received payload:', JSON.stringify(payload, null, 2));

        // Normalize the payload (handle different field naming conventions)
        const orderId = payload.order_id || payload.orderId || payload.id || `GM-${Date.now()}`;
        const customerName = payload.customer?.name || payload.customer_name || 'GoMamam Customer';
        const customerPhone = payload.customer?.phone || payload.customer_phone || '';
        const items = payload.items || [];
        const totalAmount = payload.total || payload.totalAmount || payload.amount ||
            items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const notes = payload.notes || payload.special_instructions || '';

        // Create delivery order in the database
        const deliveryOrder = {
            id: orderId,
            platform: 'GoMamam',
            customer_name: customerName,
            customer_phone: customerPhone,
            items: items.map(item => ({
                id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                category: 'GoMamam',
                selectedModifiers: [],
                itemTotal: item.price * item.quantity,
                isAvailable: true,
                modifierGroupIds: []
            })),
            total_amount: totalAmount,
            status: 'new',
            notes: notes,
            created_at: new Date().toISOString(),
        };

        // Try to insert into Supabase if configured
        if (supabaseUrl && supabaseServiceKey) {
            try {
                const supabase = createClient(supabaseUrl, supabaseServiceKey);

                const { error } = await supabase
                    .from('delivery_orders')
                    .insert({
                        id: deliveryOrder.id,
                        platform: deliveryOrder.platform,
                        customer_name: deliveryOrder.customer_name,
                        customer_phone: deliveryOrder.customer_phone,
                        items: deliveryOrder.items,
                        total_amount: deliveryOrder.total_amount,
                        status: deliveryOrder.status,
                        notes: deliveryOrder.notes,
                        created_at: deliveryOrder.created_at,
                    });

                if (error) {
                    console.error('[GoMamam Webhook] Supabase insert error:', error);
                    // Don't fail the webhook, log and continue
                } else {
                    console.log('[GoMamam Webhook] Order saved to Supabase:', orderId);
                }
            } catch (dbError) {
                console.error('[GoMamam Webhook] Database error:', dbError);
            }
        }

        // Return success response
        return NextResponse.json({
            success: true,
            message: 'Order received successfully',
            order_id: orderId,
            received_at: new Date().toISOString(),
        }, { status: 200 });

    } catch (error) {
        console.error('[GoMamam Webhook] Error processing webhook:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to process webhook',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

// Handle GET requests (for webhook URL verification if GoMamam supports it)
export async function GET(request: NextRequest) {
    // Some webhook systems send a verification GET request
    const challenge = request.nextUrl.searchParams.get('challenge') ||
        request.nextUrl.searchParams.get('hub.challenge');

    if (challenge) {
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({
        status: 'ok',
        message: 'GoMamam webhook endpoint is active',
        timestamp: new Date().toISOString(),
    });
}
