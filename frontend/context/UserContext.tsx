"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface GuestBet {
    marketId: string;
    direction: "YES" | "NO";
    amount: number;
    timestamp: number;
}

interface UserContextType {
    isGuest: boolean;
    daoCoins: number;
    guestBets: GuestBet[];
    mockMarket: { id: string, endTime: number, resolved: boolean, outcome: number, hasClaimed: boolean };
    shareToEarn: () => void;
    placeGuestBet: (marketId: string, direction: "YES" | "NO", amount: number) => boolean;
    adminResolveMarket: (outcome: 1 | 2) => void;
    claimMockWinnings: () => void;
    resetMockMarket: () => void;
    loginAsGuest: () => void;
    logoutGuest: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [isGuest, setIsGuest] = useState(false);
    const [daoCoins, setDaoCoins] = useState(0);
    const [guestBets, setGuestBets] = useState<GuestBet[]>([]);

    // Mock Market State (Single Market #0 for demo)
    const [mockMarket, setMockMarket] = useState({
        id: "0",
        endTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        resolved: false,
        outcome: 0, // 0=pending, 1=YES, 2=NO
        hasClaimed: false
    });

    // Init from local storage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storedCoins = localStorage.getItem("wendao_coins");
        const storedBets = localStorage.getItem("wendao_bets");
        const storedIsGuest = localStorage.getItem("wendao_is_guest");
        const storedMockMarket = localStorage.getItem("wendao_mock_market");

        if (storedCoins) setDaoCoins(parseInt(storedCoins));
        if (storedBets) setGuestBets(JSON.parse(storedBets));
        if (storedIsGuest === "true") setIsGuest(true);
        if (storedMockMarket) setMockMarket(JSON.parse(storedMockMarket));
    }, []);

    // Persist changes
    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem("wendao_coins", daoCoins.toString());
        localStorage.setItem("wendao_bets", JSON.stringify(guestBets));
        localStorage.setItem("wendao_is_guest", isGuest.toString());
        localStorage.setItem("wendao_mock_market", JSON.stringify(mockMarket));
    }, [daoCoins, guestBets, isGuest, mockMarket]);

    const shareToEarn = () => {
        if (typeof window === 'undefined') return;

        // Check daily share limit (max 5 per day)
        const today = new Date().toDateString();
        const shareData = localStorage.getItem('wendao_share_data');
        let todayShares = 0;

        if (shareData) {
            const parsed = JSON.parse(shareData);
            if (parsed.date === today) {
                todayShares = parsed.count;
            }
        }

        const DAILY_LIMIT = 5;
        if (todayShares >= DAILY_LIMIT) {
            alert(`❌ 今日分享已达上限 (${DAILY_LIMIT}次)\n明天再来吧！`);
            return;
        }

        // Generate a shareable link
        const shareUrl = window.location.href || 'https://wendao.xyz';

        // Copy to clipboard
        navigator.clipboard.writeText(`🔮 问DAO - 预测市场\n\n我在问DAO下注了！来一起玩吧：\n${shareUrl}`);

        // Update share count
        localStorage.setItem('wendao_share_data', JSON.stringify({ date: today, count: todayShares + 1 }));

        const reward = 1;
        setDaoCoins(prev => prev + reward);

        const remaining = DAILY_LIMIT - todayShares - 1;
        alert(`🎉 分享成功！获得 ${reward} 道币\n📋 链接已复制\n今日剩余 ${remaining} 次分享机会`);
    };

    const placeGuestBet = (marketId: string, direction: "YES" | "NO", amount: number) => {
        if (amount > daoCoins) {
            alert("道币不足！");
            return false;
        }
        if (amount <= 0) {
            alert("请输入有效金额");
            return false;
        }

        setDaoCoins(prev => prev - amount);
        setGuestBets(prev => [...prev, {
            marketId,
            direction,
            amount,
            timestamp: Date.now()
        }]);
        return true;
    };

    const adminResolveMarket = (outcome: 1 | 2) => {
        setMockMarket(prev => ({ ...prev, resolved: true, outcome }));
    };

    const claimMockWinnings = () => {
        // Calculate winnings
        const userBet = guestBets.find(bet => bet.marketId === "0");
        if (!userBet || mockMarket.hasClaimed) return;

        const isWinner = (mockMarket.outcome === 1 && userBet.direction === "YES") ||
            (mockMarket.outcome === 2 && userBet.direction === "NO");

        if (isWinner) {
            const INITIAL_YES = 1000;
            const INITIAL_NO = 1000;
            const guestTotalYes = guestBets.filter(b => b.marketId === "0" && b.direction === "YES").reduce((a, c) => a + c.amount, INITIAL_YES);
            const guestTotalNo = guestBets.filter(b => b.marketId === "0" && b.direction === "NO").reduce((a, c) => a + c.amount, INITIAL_NO);
            const guestRewardPool = guestTotalYes + guestTotalNo;

            const winningPool = mockMarket.outcome === 1 ? guestTotalYes : guestTotalNo;
            const share = userBet.amount / winningPool;
            const winnings = Math.floor(share * guestRewardPool);

            setDaoCoins(prev => prev + winnings);
            setMockMarket(prev => ({ ...prev, hasClaimed: true }));
            alert(`🎉 恭喜！获得 ${winnings} 道币！`);
        }
    };

    const resetMockMarket = () => {
        setMockMarket({
            id: "0",
            endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
            resolved: false,
            outcome: 0,
            hasClaimed: false
        });
        setGuestBets([]);
        alert("市场已重置");
    };

    const loginAsGuest = () => {
        setIsGuest(true);
        setDaoCoins(100); // Starting bonus
        alert("🎉 欢迎！您获得了 100 道币作为新人奖励！");
    };

    const logoutGuest = () => {
        setIsGuest(false);
        setDaoCoins(0);
        setGuestBets([]);
    };

    return (
        <UserContext.Provider value={{
            isGuest,
            daoCoins,
            guestBets,
            mockMarket,
            shareToEarn,
            placeGuestBet,
            adminResolveMarket,
            claimMockWinnings,
            resetMockMarket,
            loginAsGuest,
            logoutGuest
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within UserProvider");
    }
    return context;
}
