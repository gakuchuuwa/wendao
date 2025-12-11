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
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-[#faf8f5] border-2 border-[#0d5c4c]/20 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:border-[#d4af37]/40 flex flex-col h-[240px]">
            {/* Header with icon and question */}
            <div className="flex items-start gap-3 h-[56px]">
                <span className="text-2xl">{icon}</span>
                <h3 className="text-[#0d5c4c] font-bold text-sm leading-tight line-clamp-2">
                    {question}
                </h3>
            </div>

            {/* Resolved Status Badge */}
            {isResolved && outcome && (
                <div className={`mt-2 px-3 py-1 rounded-lg text-xs font-bold text-center ${outcome === "YES" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    已结束: {outcome === "YES" ? "✅ 是" : "❌ 否"}
                </div>
            )}

            {/* Countdown Section */}
            <div className="h-[68px] flex flex-col justify-center mt-2 bg-[#0d5c4c]/[0.15] rounded-lg p-2">
                {endTime && (
                    <>
                        <p className="text-[10px] text-[#0d5c4c]/70 text-center">
                            截止: {formatDeadline(endTime)}
                        </p>
                        <p className={`text-sm font-bold text-center truncate ${isExpired ? "text-red-600" : "text-[#0d5c4c]"}`}>
                            {isExpired ? "⏰ 已截止" : `⏳ ${countdown}`}
                        </p>
                    </>
                )}
            </div>

            {/* Betting Buttons */}
            <div className="flex gap-2 mt-auto">
                <button
                    onClick={() => onBet(id, "YES")}
                    disabled={isExpired || isResolved}
                    className="flex-1 py-2 rounded-lg text-sm font-bold transition bg-green-500/20 text-green-700 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ✅ 是 {yesPercent}%
                </button>
                <button
                    onClick={() => onBet(id, "NO")}
                    disabled={isExpired || isResolved}
                    className="flex-1 py-2 rounded-lg text-sm font-bold transition bg-red-500/20 text-red-700 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ❌ 否 {noPercent}%
                </button>
            </div>
        </div>
    );
}
