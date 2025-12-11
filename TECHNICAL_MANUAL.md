# 问DAO (WenDAO) 技术白皮书与维护手册

**版本**: 6.0.0
**日期**: 2025-12-12
**作者**: 首席区块链架构师 (Antigravity)

---

## 1. 项目概述 (Project Overview)

"问DAO" 是一个基于 Polygon 区块链的去中心化预测市场 (Decentralized Prediction Market)。
采用简化版的 **彩池制 (Parimutuel Betting)** 模式，融合 **简约东方美学设计** 和 **全自动化运营**。

### 核心特性
- **全自动出题**: Gemini AI 每日生成华语地区新闻预测
- **全自动裁决**: CoinGecko 数据自动验证加密货币价格
- **全自动分配**: 裁决后自动计算并分配奖金
- **统一时间标准**: 北京时间 (UTC+8)
- **邮箱登录**: Supabase Auth 集成

### 设计风格
- **配色方案**: 简约东方美学
  - 墨玉绿 #2C5F4F (主色)
  - 朱砂红 #C44536 (辅色)
  - 象牙白 #F8F6F3 (背景)
  - 水墨黑 #1A1A1A (文字)
- **布局**: 4列宽屏响应式

---

## 2. 系统架构 (Architecture)

```mermaid
graph TD
    A[用户] --> B[Next.js 前端]
    B --> C[Supabase 数据库]
    B --> D[Supabase Auth]
    B --> E[Polygon 智能合约]
    
    F[Vercel Cron] --> G[/api/cron/generate]
    G --> H[Gemini AI]
    H --> C
    
    F --> I[/api/cron/resolve] 
    I --> J[CoinGecko API]
    J --> C
```

### 技术栈
| 层级 | 技术 | 版本 | 说明 |
| :--- | :--- | :--- | :--- |
| **Frontend** | `Next.js` | 16  | React 框架 |
| **Auth** | `Supabase Auth` | - | 邮箱/Google登录 |
| **Database** | `Supabase` | PostgreSQL | 用户/市场/下注存储 |
| **Styling** | `Tailwind CSS` | 4.x | 简约东方主题 |
| **AI** | `Gemini` | Pro | 自动出题 |
| **Oracle** | `CoinGecko` | Free | 价格数据 |
| **Contract** | `Solidity` | 0.8.20 | 智能合约 |

---

## 3. 认证系统

### 3.1 登录方式
- **邮箱/密码**: 已启用
- **Google OAuth**: 按钮已添加，需配置
- **微信登录**: 占位（即将推出）

### 3.2 Supabase 配置
1. 进入 Supabase Dashboard → Authentication → Providers
2. Email: 已关闭邮箱确认（开发阶段）
3. Google: 需添加 Client ID/Secret

---

## 4. 时间标准

> ⚠️ **重要**: 全站统一使用 **北京时间 (UTC+8)**

| 场景 | 时区 | 说明 |
|------|------|------|
| 前端显示 | Beijing | 用户看到的所有时间 |
| 数据库存储 | UTC | PostgreSQL TIMESTAMPTZ |
| Cron 任务 | UTC | 16:00 UTC = 00:00 Beijing |

---

## 5. 自动化系统

### 5.1 自动出题
- **触发时间**: 每日 00:00 北京时间
- **API 端点**: `/api/cron/generate`
- **流程**: Gemini → 生成问题 → 存入 Supabase

### 5.2 自动裁决
- **触发时间**: 每日运行
- **API 端点**: `/api/cron/resolve`
- **流程**: 查找过期市场 → CoinGecko 验证 → 更新结果

---

## 6. 数据库设计

### 6.1 表结构
```sql
-- 用户配置
profiles (id, email, dao_coins, created_at)

-- 预测市场
markets (id, question, icon, end_time, status, outcome, total_yes, total_no, verify_type, verify_data, created_at)

-- 下注记录
bets (id, user_id, market_id, direction, amount, timestamp, claimed)
```

### 6.2 初始化
在 Supabase SQL Editor 中运行 `/database/schema.sql`

---

## 7. 快速启动

### 7.1 环境变量 (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
CRON_SECRET=your_cron_secret
```

### 7.2 启动步骤
```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 访问
http://localhost:3000
```

### 7.3 部署 (Vercel)
1. 连接 GitHub 仓库
2. Root Directory: 保持为空（根目录）
3. 设置环境变量
4. 部署后 Cron 自动生效

---

## 8. 目录结构

```bash
wendao/
├── app/
│   ├── api/
│   │   └── cron/
│   │       ├── generate/route.ts  # 自动出题
│   │       └── resolve/route.ts   # 自动裁决
│   ├── auth/
│   │   ├── page.tsx               # 登录页
│   │   └── callback/route.ts      # OAuth回调
│   ├── page.tsx                   # 首页
│   └── globals.css                # 全局样式
├── components/
│   ├── Navbar.tsx
│   ├── MarketCard.tsx
│   └── BetModal.tsx
├── context/
│   └── UserContext.tsx            # 用户状态管理
├── lib/
│   ├── supabase.ts                # 数据库操作
│   ├── gemini.ts                  # AI 出题
│   └── oracle.ts                  # 价格数据
├── public/
│   └── dao-coin.png               # 阴阳图标
├── database/
│   └── schema.sql                 # 数据库架构
├── contracts/
│   └── WenDAOMarket.sol
└── vercel.json                    # Cron 配置
```

---

## 9. 常见问题

### Q: 登录失败 "Email not confirmed"？
- 进入 Supabase → Authentication → Providers → Email
- 关闭 "Confirm email" 选项

### Q: Google 登录不工作？
- 需在 Supabase Dashboard 配置 Google OAuth
- 添加 Client ID 和 Client Secret

### Q: Cron 任务没有执行？
- 确保 `CRON_SECRET` 环境变量已设置
- 仅在 Vercel 正式部署后生效

### Q: 市场没有自动裁决？
- 检查 `verify_type` 是否为 `price`
- 确认 CoinGecko 资产 ID 正确
