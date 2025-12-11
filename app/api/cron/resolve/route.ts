import { NextResponse } from 'next/server';
import { getExpiredUnresolvedMarkets, resolveMarket, getMarketBets, updateUserCoins, toBeijingTime } from '@/lib/supabase';
import { verifyPriceCondition } from '@/lib/oracle';

// Vercel Cron Job: runs every 5 minutes to check for markets needing resolution
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/resolve", "schedule": "*/5 * * * *" }] }

export async function GET(request: Request) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[CRON] Checking for expired markets at ${toBeijingTime(new Date())} (Beijing Time)`);

        // Get all expired but unresolved markets
        const expiredMarkets = await getExpiredUnresolvedMarkets();

        if (expiredMarkets.length === 0) {
            return NextResponse.json({ message: 'No markets to resolve', count: 0 });
        }

        const results = [];

        for (const market of expiredMarkets) {
            try {
                // Only auto-resolve price type markets (CoinGecko)
                if (market.verify_type === 'price' && market.verify_data?.asset) {
                    const verification = await verifyPriceCondition(
                        market.verify_data.asset,
                        market.verify_data.operator,
                        market.verify_data.value
                    );

                    if (verification) {
                        const outcome = verification.result ? 'YES' : 'NO';

                        // Update market status
                        await resolveMarket(market.id, outcome);

                        // Distribute rewards to winners
                        await distributeRewards(market.id, outcome, market.total_yes, market.total_no);

                        results.push({
                            marketId: market.id,
                            question: market.question,
                            outcome,
                            actualPrice: verification.actualPrice
                        });

                        console.log(`[CRON] Resolved market ${market.id}: ${outcome} (price: ${verification.actualPrice})`);
                    }
                } else {
                    // Non-price markets require manual resolution
                    console.log(`[CRON] Market ${market.id} requires manual resolution (type: ${market.verify_type})`);
                }
            } catch (marketError) {
                console.error(`[CRON] Error resolving market ${market.id}:`, marketError);
            }
        }

        return NextResponse.json({
            success: true,
            resolved: results.length,
            results,
            checkedAt: toBeijingTime(new Date())
        });

    } catch (error) {
        console.error('[CRON] Resolve markets error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Distribute rewards to winning bettors
async function distributeRewards(
    marketId: string,
    outcome: 'YES' | 'NO',
    totalYes: number,
    totalNo: number
): Promise<void> {
    const totalPool = totalYes + totalNo;
    if (totalPool === 0) return;

    // Get all bets for this market
    const bets = await getMarketBets(marketId);
    const winningBets = bets.filter(bet => bet.direction === outcome);

    const winningPool = outcome === 'YES' ? totalYes : totalNo;
    if (winningPool === 0) return;

    // Calculate and distribute each winner's share
    for (const bet of winningBets) {
        const share = (bet.amount / winningPool) * totalPool;
        await updateUserCoins(bet.user_id, Math.floor(share));
        console.log(`[CRON] Distributed ${Math.floor(share)} coins to user ${bet.user_id}`);
    }
}
