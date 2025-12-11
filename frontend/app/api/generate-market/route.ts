import { NextResponse } from 'next/server';
import { generatePredictionMarket } from '@/lib/gemini';

export async function POST() {
    try {
        const market = await generatePredictionMarket();

        if (!market) {
            return NextResponse.json(
                { error: 'Failed to generate market' },
                { status: 500 }
            );
        }

        return NextResponse.json({ market });
    } catch (error) {
        console.error('Generate market error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
