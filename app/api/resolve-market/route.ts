import { NextResponse } from 'next/server';
import { verifyPriceCondition } from '@/lib/oracle';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { coinId, operator, targetValue } = body;

        if (!coinId || !operator || !targetValue) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const verification = await verifyPriceCondition(coinId, operator, targetValue);

        if (!verification) {
            return NextResponse.json(
                { error: 'Failed to verify price' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            resolved: true,
            outcome: verification.result ? 'YES' : 'NO',
            actualPrice: verification.actualPrice,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Resolve market error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
