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
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg transition-shadow flex flex-col min-h-[280px]">

            {/* Header with icon and question */}
            <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">{icon}</span>
                <h3 className="text-[#1A1A1A] font-bold text-base leading-snug flex-1">
                    {question}
                </h3>
            </div>

            {/* Resolved Status Badge */}
            {isResolved && outcome && (
                <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-bold text-center ${outcome === "YES"
                    ? "bg-[#2C5F4F]/10 text-[#2C5F4F]"
                    : "bg-[#C44536]/10 text-[#C44536]"
                    }`}>
                    已结束: {outcome === "YES" ? "✅ 是" : "❌ 否"}
                </div>
            )}

            {/* Countdown Section */}
            <div className="flex-1 flex flex-col justify-center bg-gray-50 rounded-lg p-4 mb-4">
                {endTime && (
                    <div className="text-center space-y-1">
                        <p className="text-sm text-gray-600">
                            📅 {formatDeadline(endTime)}
                        </p>
                        <p className={`text-lg font-bold ${isExpired ? "text-red-600" : "text-[#0d5c4c]"}`}>
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
                    className="flex-1 py-3 rounded-lg font-bold bg-[#2C5F4F] text-white hover:bg-[#1E4238] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ✅ 是 {yesPercent}%
                </button>
                <button
                    onClick={() => onBet(id, "NO")}
                    disabled={isExpired || isResolved}
                    className="flex-1 py-3 rounded-lg font-bold bg-[#C44536] text-white hover:bg-[#A33A2D] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ❌ 否 {noPercent}%
                </button>
            </div>
        </div>
    );
}
