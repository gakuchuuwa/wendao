// CoinGecko API for price verification (no API key needed for basic endpoints)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface PriceData {
    price: number;
    timestamp: number;
}

export async function getCryptoPrice(coinId: string): Promise<PriceData | null> {
    try {
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd`
        );
        const data = await response.json();

        if (data[coinId]) {
            return {
                price: data[coinId].usd,
                timestamp: Date.now()
            };
        }
        return null;
    } catch (error) {
        console.error('CoinGecko API error:', error);
        return null;
    }
}

export async function verifyPriceCondition(
    coinId: string,
    operator: '>' | '<' | '=',
    targetValue: number
): Promise<{ result: boolean; actualPrice: number } | null> {
    const priceData = await getCryptoPrice(coinId);
    if (!priceData) return null;

    let result = false;
    switch (operator) {
        case '>':
            result = priceData.price > targetValue;
            break;
        case '<':
            result = priceData.price < targetValue;
            break;
        case '=':
            result = Math.abs(priceData.price - targetValue) < 0.01;
            break;
    }

    return { result, actualPrice: priceData.price };
}
