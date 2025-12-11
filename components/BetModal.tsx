"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";

interface BetModalProps {
    isOpen: boolean;
    onClose: () => void;
    marketId: string;
    direction: "YES" | "NO";
}

export default function BetModal({ isOpen, onClose, marketId, direction }: BetModalProps) {
    const [amount, setAmount] = useState("");
    const { placeGuestBet, daoCoins } = useUser();
    const [success, setSuccess] = useState(false);

    const handleBet = async () => {
        if (!amount) return;

        const success = placeGuestBet(marketId, direction, parseFloat(amount));
        if (success) {
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setAmount("");
            }, 1500);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200 border-2 border-[#0d5c4c]/20">
                <h2 className="text-xl font-bold mb-4 flex justify-between text-[#0d5c4c]">
                    <span>下注 {direction === "YES" ? "✅ 是" : "❌ 否"}</span>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">道币数量</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0d5c4c] focus:border-[#0d5c4c] outline-none transition text-gray-900 placeholder-gray-400"
                            placeholder="输入数量"
                        />
                    </div>

                    <button
                        onClick={handleBet}
                        disabled={!amount || parseFloat(amount) > daoCoins}
                        className="w-full bg-gradient-to-r from-[#0d5c4c] to-[#1a7f6a] hover:opacity-90 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                    >
                        确认下注
                    </button>

                    {success && <p className="text-sm text-green-600 text-center font-bold">🎉 下注成功！</p>}
                    <p className="text-xs text-gray-400 text-center mt-2">当前余额: {daoCoins} 道币</p>
                </div>
            </div>
        </div>
    );
}
