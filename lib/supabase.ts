import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// Types
// ============================================

export interface Market {
    id: string;
    question: string;
    icon: string;
    end_time: string;
    status: 'active' | 'resolved';
    outcome: 'YES' | 'NO' | null;
    total_yes: number;
    total_no: number;
    verify_type: 'price' | 'economy' | 'company';
    verify_data: {
        asset?: string;
        operator: '>' | '<';
        value: number;
    };
    created_at: string;
}

export interface Bet {
    id: string;
    user_id: string;
    market_id: string;
    direction: 'YES' | 'NO';
    amount: number;
    timestamp: string;
    claimed: boolean;
}

export interface UserProfile {
    id: string;
    email: string;
    dao_coins: number;
    created_at: string;
}

// ============================================
// Market Operations
// ============================================

export async function getActiveMarkets(): Promise<Market[]> {
    const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('status', 'active')
        .order('end_time', { ascending: true });

    if (error) {
        console.error('Error fetching markets:', error);
        return [];
    }
    return data || [];
}

export async function getMarketById(id: string): Promise<Market | null> {
    const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

export async function createMarket(market: Omit<Market, 'id' | 'created_at' | 'status' | 'outcome' | 'total_yes' | 'total_no'>): Promise<Market | null> {
    const { data, error } = await supabase
        .from('markets')
        .insert({
            ...market,
            status: 'active',
            outcome: null,
            total_yes: 0,
            total_no: 0,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating market:', error);
        return null;
    }
    return data;
}

export async function resolveMarket(id: string, outcome: 'YES' | 'NO'): Promise<boolean> {
    const { error } = await supabase
        .from('markets')
        .update({ status: 'resolved', outcome })
        .eq('id', id);

    return !error;
}

export async function getExpiredUnresolvedMarkets(): Promise<Market[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('status', 'active')
        .lt('end_time', now);

    if (error) return [];
    return data || [];
}

// ============================================
// Bet Operations
// ============================================

export async function placeBet(userId: string, marketId: string, direction: 'YES' | 'NO', amount: number): Promise<boolean> {
    // Insert bet
    const { error: betError } = await supabase
        .from('bets')
        .insert({
            user_id: userId,
            market_id: marketId,
            direction,
            amount,
            claimed: false,
        });

    if (betError) return false;

    // Update market totals
    const column = direction === 'YES' ? 'total_yes' : 'total_no';
    const { error: updateError } = await supabase.rpc('increment_market_total', {
        market_id: marketId,
        column_name: column,
        amount: amount
    });

    return !updateError;
}

export async function getUserBets(userId: string): Promise<Bet[]> {
    const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

    if (error) return [];
    return data || [];
}

export async function getMarketBets(marketId: string): Promise<Bet[]> {
    const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('market_id', marketId);

    if (error) return [];
    return data || [];
}

// ============================================
// User Operations
// ============================================

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data;
}

export async function updateUserCoins(userId: string, amount: number): Promise<boolean> {
    const { error } = await supabase.rpc('add_user_coins', {
        user_id: userId,
        amount: amount
    });

    return !error;
}

// ============================================
// Time Utilities (Beijing Time UTC+8)
// ============================================

export function toBeijingTime(date: Date): string {
    return new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(date);
}

export function getBeijingMidnight(): Date {
    const now = new Date();
    // Convert to Beijing time, set to midnight
    const beijing = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    beijing.setHours(0, 0, 0, 0);
    // Convert back to UTC for storage
    return new Date(beijing.getTime() - (8 * 60 * 60 * 1000));
}
