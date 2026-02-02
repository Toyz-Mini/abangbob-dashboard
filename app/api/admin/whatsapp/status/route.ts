import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch('https://abangbob-whatsapp-gateway-production.up.railway.app/status', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`External API responded with ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('WhatsApp Proxy Error:', error);
        return NextResponse.json(
            { status: 'close', error: String(error) }, // Fallback to 'close' state on error
            { status: 500 }
        );
    }
}
