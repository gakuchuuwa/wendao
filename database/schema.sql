-- 问DAO 数据库架构
-- 运行此 SQL 在 Supabase SQL Editor 中创建表

-- ============================================
-- 1. 用户配置表 (扩展 auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    dao_coins INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, dao_coins)
    VALUES (NEW.id, NEW.email, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. 市场表
-- ============================================
CREATE TABLE IF NOT EXISTS public.markets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    icon TEXT DEFAULT '🔮',
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    outcome TEXT CHECK (outcome IN ('YES', 'NO', NULL)),
    total_yes BIGINT DEFAULT 0,
    total_no BIGINT DEFAULT 0,
    verify_type TEXT CHECK (verify_type IN ('price', 'economy', 'company')),
    verify_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 下注表
-- ============================================
CREATE TABLE IF NOT EXISTS public.bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('YES', 'NO')),
    amount BIGINT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    claimed BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 4. RPC 函数: 增加市场总额
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_market_total(
    market_id UUID,
    column_name TEXT,
    amount BIGINT
)
RETURNS VOID AS $$
BEGIN
    IF column_name = 'total_yes' THEN
        UPDATE public.markets SET total_yes = total_yes + amount WHERE id = market_id;
    ELSIF column_name = 'total_no' THEN
        UPDATE public.markets SET total_no = total_no + amount WHERE id = market_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. RPC 函数: 增加用户道币
-- ============================================
CREATE OR REPLACE FUNCTION public.add_user_coins(
    user_id UUID,
    amount INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles SET dao_coins = dao_coins + amount WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 行级安全策略 (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

-- 用户只能读取自己的 profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 所有人可以读取市场
CREATE POLICY "Anyone can view markets" ON public.markets
    FOR SELECT USING (true);

-- 管理员可以管理市场 (通过 service role)
CREATE POLICY "Service role can manage markets" ON public.markets
    FOR ALL USING (auth.role() = 'service_role');

-- 用户可以查看自己的下注
CREATE POLICY "Users can view own bets" ON public.bets
    FOR SELECT USING (auth.uid() = user_id);

-- 用户可以下注
CREATE POLICY "Users can place bets" ON public.bets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. 索引优化
-- ============================================
CREATE INDEX IF NOT EXISTS idx_markets_status ON public.markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_end_time ON public.markets(end_time);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON public.bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_market_id ON public.bets(market_id);
