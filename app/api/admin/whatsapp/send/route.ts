import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const res = await fetch('https://abangbob-whatsapp-gateway-production.up.railway.app/send-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('WhatsApp Send Proxy Error:', error);
        return NextResponse.json(
            { error: 'Failed to forward message to WhatsApp service' },
            { status: 500 }
        );
    }
}
