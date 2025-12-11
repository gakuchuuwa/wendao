# 问DAO (WenDAO) 技术白皮书与维护手册

**版本**: 4.0.3
**日期**: 2025-12-11
**作者**: 首席区块链架构师 (Antigravity)

---

## 1. 项目概述 (Project Overview)

"问DAO" 是一个基于 Polygon 区块链的去中心化预测市场 (Decentralized Prediction Market)。
采用简化版的 **彩池制 (Parimutuel Betting)** 模式，融合 **东方美学设计** 和 **全自动化运营**。

### 核心特性
- **全自动出题**: Gemini AI 每日生成华语地区新闻预测
- **全自动裁决**: CoinGecko 数据自动验证加密货币价格
- **全自动分配**: 裁决后自动计算并分配奖金
- **统一时间标准**: 北京时间 (UTC+8)

### 道币经济 (Dao Coin)
- **图标**: 阴阳太极图 (Yin-Yang)
- **获取**: 分享得币 (每日上限 5 次)
- **用途**: 参与预测下注

---

## 2. 系统架构 (Architecture)

```mermaid
graph TD
    A[用户] --> B[Next.js 前端]
    B --> C[Supabase 数据库]
    B --> D[Polygon 智能合约]
    
    E[Vercel Cron] --> F[/api/cron/generate]
    F --> G[Gemini AI]
    G --> C
    
    E --> H[/api/cron/resolve] 
    H --> I[CoinGecko API]
    I --> C
```

### 技术栈
| 层级 | 技术 | 版本 | 说明 |
| :--- | :--- | :--- | :--- |
| **Frontend** | `Next.js` | 16  | React 框架 |
| **Database** | `Supabase` | PostgreSQL | 用户/市场/下注存储 |
| **Styling** | `Tailwind CSS` | 4.x | 东方美学主题 |
| **AI** | `Gemini` | Pro | 自动出题 |
| **Oracle** | `CoinGecko` | Free | 价格数据 |
| **Contract** | `Solidity` | 0.8.20 | 智能合约 |

---

## 3. 时间标准

> ⚠️ **重要**: 全站统一使用 **北京时间 (UTC+8)**

| 场景 | 时区 | 说明 |
|------|------|------|
| 前端显示 | Beijing | 用户看到的所有时间 |
| 数据库存储 | UTC | PostgreSQL TIMESTAMPTZ |
| Cron 任务 | UTC | 16:00 UTC = 00:00 Beijing |

---

## 4. 自动化系统

### 4.1 自动出题
- **触发时间**: 每日 00:00 北京时间
- **API 端点**: `/api/cron/generate`
- **流程**: Gemini → 生成问题 → 存入 Supabase

### 4.2 自动裁决
- **触发时间**: 每 5 分钟
- **API 端点**: `/api/cron/resolve`
- **流程**: 查找过期市场 → CoinGecko 验证 → 更新结果

### 4.3 自动分配
- **触发时间**: 裁决后立即
- **流程**: 计算赢家份额 → 更新用户余额

---

## 5. 数据库设计

### 5.1 表结构
```sql
-- 用户配置
profiles (id, email, dao_coins, created_at)

-- 预测市场
markets (id, question, icon, end_time, status, outcome, total_yes, total_no, verify_type, verify_data, created_at)

-- 下注记录
bets (id, user_id, market_id, direction, amount, timestamp, claimed)
```

### 5.2 初始化
在 Supabase SQL Editor 中运行 `/database/schema.sql`

---

## 6. 快速启动

### 6.1 环境变量 (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
CRON_SECRET=your_cron_secret
```

### 6.2 启动前端
```bash
cd frontend
npm run dev
```

### 6.3 部署 (Vercel)
1. 连接 GitHub 仓库
2. 设置环境变量
3. 部署后 Cron 自动生效

---

## 7. 目录结构

```bash
wendao/
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cron/
│   │   │   │   ├── generate/route.ts  # 自动出题
│   │   │   │   └── resolve/route.ts   # 自动裁决
│   │   │   ├── generate-market/       # 手动出题
│   │   │   └── resolve-market/        # 手动裁决
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── supabase.ts  # 数据库操作
│   │   ├── gemini.ts    # AI 出题
│   │   └── oracle.ts    # 价格数据
│   ├── components/
│   ├── public/
│   │   └── dao-coin.png # 阴阳图标
│   └── vercel.json      # Cron 配置
├── database/
│   └── schema.sql       # 数据库架构
└── contracts/
    └── WenDAOMarket.sol
```

---

## 8. 常见问题

### Q: Cron 任务没有执行？
- 确保 `CRON_SECRET` 环境变量已设置
- 仅在 Vercel 正式部署后生效 (本地开发不支持)

### Q: 市场没有自动裁决？
- 检查 `verify_type` 是否为 `price`
- 确认 CoinGecko 资产 ID 正确

### Q: 道币余额没有增加？
- 检查 Supabase RPC 函数 `add_user_coins` 是否存在
- 确认 RLS 策略允许更新
