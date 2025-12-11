import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

// Random icons for different topic categories
const TOPIC_ICONS: Record<string, string[]> = {
    price: ['📈', '📊', '💹', '🪙'],
    economy: ['💰', '🏦', '💴', '📉'],
    tech: ['⚡', '🚀', '💻', '🔋'],
    politics: ['🏛️', '🌏', '⚖️', '🗳️'],
    company: ['🏢', '📱', '🚗', '🎮'],
};

export interface PredictionMarket {
    question: string;
    deadline: string;
    dataSource: string;
    icon: string;
    verifyCondition: {
        type: 'price' | 'economy' | 'tech' | 'politics' | 'company';
        asset?: string;
        operator: '>' | '<' | '=';
        value: number;
    };
}

function getRandomIcon(type: string): string {
    const icons = TOPIC_ICONS[type] || TOPIC_ICONS.price;
    return icons[Math.floor(Math.random() * icons.length)];
}

export async function generatePredictionMarket(): Promise<PredictionMarket | null> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `你是一个专业的预测市场事件生成器。生成一个与华语地区（中国大陆、香港、台湾、新加坡）相关的可验证预测问题。

主题类别（随机选择一个）：
1. **price** - 加密货币/港股/A股价格 (BTC, ETH, 腾讯, 阿里巴巴, 比亚迪)
2. **economy** - 中国宏观经济数据 (GDP, CPI, PMI, 出口)
3. **tech** - 华人科技公司 (华为、小米、字节跳动产品发布)
4. **company** - 中概股财报/业绩 (阿里Q4收入, 腾讯游戏收入)

要求：
1. 问题必须可以通过公开数据验证
2. 截止日期在 7-30 天内
3. 用简洁的中文提问
4. 选择一个主题类别

仅返回有效 JSON，格式如下：
{
    "question": "腾讯2025年Q1财报收入会超过1500亿人民币吗？",
    "deadline": "YYYY-MM-DD",
    "dataSource": "公司财报",
    "type": "company",
    "verifyCondition": {
        "type": "company",
        "asset": "tencent",
        "operator": ">",
        "value": 150000000000
    }
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                ...parsed,
                icon: getRandomIcon(parsed.type || 'price')
            } as PredictionMarket;
        }
        return null;
    } catch (error) {
        console.error('Gemini API error:', error);
        return null;
    }
}
