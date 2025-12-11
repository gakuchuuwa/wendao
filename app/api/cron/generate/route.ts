import { NextResponse } from 'next/server';
import { generatePredictionMarket } from '@/lib/gemini';
import { createMarket, toBeijingTime } from '@/lib/supabase';

// Vercel Cron Job: runs daily at 00:00 Beijing Time (16:00 UTC previous day)
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/generate", "schedule": "0 16 * * *" }] }

export async function GET(request: Request) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[CRON] Generating new market at ${toBeijingTime(new Date())} (Beijing Time)`);

        // Generate market via Gemini AI
        const generatedMarket = await generatePredictionMarket();

        if (!generatedMarket) {
            return NextResponse.json(
                { error: 'Failed to generate market from AI' },
                { status: 500 }
            );
        }

        // Calculate end time (7-14 days from now in Beijing time)
        const endDate = new Date(generatedMarket.deadline);

        // Save to database
        const savedMarket = await createMarket({
            question: generatedMarket.question,
            icon: generatedMarket.icon || '🔮',
            end_time: endDate.toISOString(),
            verify_type: generatedMarket.verifyCondition.type as 'price' | 'economy' | 'company',
            verify_data: {
                asset: generatedMarket.verifyCondition.asset,
                operator: generatedMarket.verifyCondition.operator as '>' | '<',
                value: generatedMarket.verifyCondition.value
            }
        });

        if (!savedMarket) {
            return NextResponse.json(
                { error: 'Failed to save market to database' },
                { status: 500 }
            );
        }

        console.log(`[CRON] Successfully created market: ${savedMarket.question}`);

        return NextResponse.json({
            success: true,
            market: savedMarket,
            generatedAt: toBeijingTime(new Date())
        });

    } catch (error) {
        console.error('[CRON] Generate market error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
