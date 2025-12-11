"use client";

import { useState, useEffect } from "react";

interface MarketCardProps {
    id: string;
    question: string;
    totalYes: number;
    totalNo: number;
    onBet: (id: string, direction: "YES" | "NO") => void;
    isResolved?: boolean;
    outcome?: "YES" | "NO" | null;
    endTime?: number;
    icon?: string;
}

export default function MarketCard({ id, question, totalYes, totalNo, onBet, isResolved, outcome, endTime, icon = "🔮" }: MarketCardProps) {
    const yes = totalYes;
    const no = totalNo;
    const total = yes + no;
    const yesPercent = total > 0 ? ((yes / total) * 100).toFixed(1) : "50";
    const noPercent = total > 0 ? ((no / total) * 100).toFixed(1) : "50";

    // Countdown state
    const [countdown, setCountdown] = useState("");
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!endTime) return;

        const updateCountdown = () => {
            const now = Date.now();
            const targetTime = endTime;
            const diff = targetTime - now;

            if (diff <= 0) {
                setCountdown("已截止");
                setIsExpired(true);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setCountdown(`${days}天 ${hours}时 ${minutes}分`);
            } else if (hours > 0) {
                setCountdown(`${hours}时 ${minutes}分 ${seconds}秒`);
            } else {
                setCountdown(`${minutes}分 ${seconds}秒`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [endTime]);

    const formatDeadline = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="relative bg-gradient-to-br from-[#faf8f5] to-[#f0ebe0] border border-[#d4af37]/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-[#d4af37]/60 flex flex-col min-h-[320px] group overflow-hidden">

            {/* 装饰性角标 - 简约东方风 */}
            <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute top-2 right-2 text-[#d4af37]/20 text-4xl transform rotate-12">
                    ◇
                </div>
            </div>

            {/* 装饰性边框 */}
            <div className="absolute inset-[6px] border border-[#0d5c4c]/10 rounded-xl pointer-events-none" />

            {/* Header with icon and question */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-[#0d5c4c] to-[#0a4a3c] rounded-xl shadow-lg text-2xl">
                    {icon}
                </div>
                <h3 className="text-[#0d5c4c] font-bold text-lg leading-snug flex-1" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                    {question}
                </h3>
            </div>

            {/* Resolved Status Badge */}
            {isResolved && outcome && (
                <div className={`mb-4 px-4 py-2 rounded-xl text-sm font-bold text-center border ${outcome === "YES"
                    ? "bg-[#0d5c4c]/10 text-[#0d5c4c] border-[#0d5c4c]/30"
                    : "bg-red-50 text-red-700 border-red-200"
                    }`}>
                    已结束: {outcome === "YES" ? "✅ 是" : "❌ 否"}
                </div>
            )}

            {/* Countdown Section */}
            <div className="flex-1 flex flex-col justify-center bg-gradient-to-r from-[#0d5c4c]/10 via-[#0d5c4c]/5 to-[#d4af37]/10 rounded-xl p-4 mb-4 border border-[#0d5c4c]/10">
                {endTime && (
                    <div className="text-center space-y-2">
                        <p className="text-sm text-[#0d5c4c]">
                            📅 {formatDeadline(endTime)}
                        </p>
                        <p className={`text-lg font-bold ${isExpired ? "text-red-600" : "text-[#d4af37]"}`}>
                            {isExpired ? "⏰ 已结束" : `⏳ ${countdown}`}
                        </p>
                    </div>
                )}
            </div>

            {/* Betting Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => onBet(id, "YES")}
                    disabled={isExpired || isResolved}
                    className="flex-1 py-3 rounded-xl text-base font-bold transition-all duration-200 bg-gradient-to-r from-[#0d5c4c] to-[#1a7f6a] text-white hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                    ✅ 是 <span className="text-white/80 ml-1">{yesPercent}%</span>
                </button>
                <button
                    onClick={() => onBet(id, "NO")}
                    disabled={isExpired || isResolved}
                    className="flex-1 py-3 rounded-xl text-base font-bold transition-all duration-200 bg-gradient-to-r from-[#8b4513] to-[#a0522d] text-white hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                    ❌ 否 <span className="text-white/80 ml-1">{noPercent}%</span>
                </button>
            </div>
        </div>
    );
}
