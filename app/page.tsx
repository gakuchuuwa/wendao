"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import MarketCard from "@/components/MarketCard";
import BetModal from "@/components/BetModal";
import { useUser } from "@/context/UserContext";

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<{ id: string, direction: "YES" | "NO" } | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { isGuest, isAuthenticated, isLoading, daoCoins, guestBets, mockMarket, adminResolveMarket, claimMockWinnings, resetMockMarket } = useUser();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !isGuest && !isAuthenticated) {
      router.push("/auth");
    }
  }, [isLoading, isGuest, isAuthenticated, router]);

  // Check for admin mode from URL parameter (?admin=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsAdminMode(params.get('admin') === 'true');
    }
  }, []);

  // Dynamic Guest Mode Data
  // Large initial pool for scalability (10,000+ users)
  const INITIAL_YES = 1000;
  const INITIAL_NO = 1000;

  const guestTotalYes = guestBets
    .filter(bet => bet.marketId === "0" && bet.direction === "YES")
    .reduce((acc, curr) => acc + curr.amount, INITIAL_YES);

  const guestTotalNo = guestBets
    .filter(bet => bet.marketId === "0" && bet.direction === "NO")
    .reduce((acc, curr) => acc + curr.amount, INITIAL_NO);

  const guestRewardPool = guestTotalYes + guestTotalNo;

  // Calculate odds for display
  const guestYesPercent = ((guestTotalYes / guestRewardPool) * 100).toFixed(2);
  const guestNoPercent = ((guestTotalNo / guestRewardPool) * 100).toFixed(2);

  // Market data for display
  const marketData = {
    id: "0",
    question: mockMarket.resolved ? "比特币在2025年底会突破15万美金吗？" : "比特币在2025年底会突破15万美金吗？",
    endTime: mockMarket.endTime,
    totalYes: guestTotalYes,
    totalNo: guestTotalNo,
    rewardPool: guestRewardPool,
    resolved: mockMarket.resolved,
    outcome: mockMarket.outcome,
  };

  // Handle betting
  const handleBet = (marketId: string, direction: "YES" | "NO") => {
    setSelectedMarket({ id: marketId, direction });
    setIsModalOpen(true);
  };

  // User's bet on market 0
  const userBetOnMarket0 = guestBets.find(bet => bet.marketId === "0");
  const hasBetOnMarket0 = !!userBetOnMarket0;
  const userBetDirection = userBetOnMarket0?.direction;
  const userBetAmount = userBetOnMarket0?.amount || 0;

  // Calculate potential winnings
  const calculateWinnings = () => {
    if (!userBetOnMarket0 || !mockMarket.resolved) return 0;
    const isWinner = (mockMarket.outcome === 1 && userBetDirection === "YES") ||
      (mockMarket.outcome === 2 && userBetDirection === "NO");
    if (!isWinner) return 0;

    const winningPool = mockMarket.outcome === 1 ? guestTotalYes : guestTotalNo;
    const share = userBetAmount / winningPool;
    return Math.floor(share * guestRewardPool);
  };

  const potentialWinnings = calculateWinnings();

  // Format timestamp to readable deadline
  const formatDeadline = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 mt-8">

        {/* Admin Tools - Only visible with ?admin=true in URL */}
        {isAdminMode && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between text-sm">
            <span className="text-red-700 font-medium">🔧 管理员模式 | 池: Yes {guestTotalYes} / No {guestTotalNo}</span>
            <div className="flex items-center gap-2">
              {!mockMarket.resolved ? (
                <>
                  <button onClick={() => adminResolveMarket(1)} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700">
                    裁决 YES
                  </button>
                  <button onClick={() => adminResolveMarket(2)} className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700">
                    裁决 NO
                  </button>
                </>
              ) : (
                <span className="text-green-700 font-bold">✅ 已裁决: {mockMarket.outcome === 1 ? "YES" : "NO"}</span>
              )}
              <button onClick={resetMockMarket} className="px-3 py-1 bg-gray-600 text-white rounded text-xs font-bold hover:bg-gray-700">
                重置
              </button>
            </div>
          </div>
        )}

        {/* Header - 中国风标题 */}
        <div className="mb-8 text-center">
          <div className="inline-block mb-4">
            <span className="text-[#d4af37] text-4xl">◆</span>
          </div>
          <h1 className="text-4xl font-bold text-[#0d5c4c] mb-3" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            问DAO · 热门事件
          </h1>
          <p className="text-[#0d5c4c]/60 text-base" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            智慧预测，共创未来
          </p>
        </div>

        {/* Market Cards Grid - 4列布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Main Market Card */}
          <MarketCard
            id={marketData.id}
            question={marketData.question}
            totalYes={marketData.totalYes}
            totalNo={marketData.totalNo}
            onBet={handleBet}
            isResolved={marketData.resolved}
            outcome={marketData.outcome === 1 ? "YES" : marketData.outcome === 2 ? "NO" : undefined}
            endTime={marketData.endTime}
            icon="₿"
          />

          {/* Additional Mock Markets */}
          <MarketCard
            id="1"
            question="以太坊在2026年Q1会突破 $5,000 吗？"
            totalYes={580}
            totalNo={420}
            onBet={handleBet}
            endTime={Date.now() + 109 * 24 * 60 * 60 * 1000}
            icon="⟠"
          />

          <MarketCard
            id="2"
            question="Solana 生态 TVL 在 2025年底会超越 BSC 吗？"
            totalYes={400}
            totalNo={700}
            onBet={handleBet}
            endTime={Date.now() + 20 * 24 * 60 * 60 * 1000}
            icon="☀️"
          />

          <MarketCard
            id="3"
            question="美联储2025年会降息超过3次吗？"
            totalYes={800}
            totalNo={700}
            onBet={handleBet}
            endTime={Date.now() + 20 * 24 * 60 * 60 * 1000}
            icon="🏦"
          />

          <MarketCard
            id="4"
            question="特斯拉股价在2025年底会超过 $500 吗？"
            totalYes={450}
            totalNo={550}
            onBet={handleBet}
            endTime={Date.now() + 20 * 24 * 60 * 60 * 1000}
            icon="🚗"
          />

          <MarketCard
            id="5"
            question="中国GDP增速2025年会超过5%吗？"
            totalYes={600}
            totalNo={506}
            onBet={handleBet}
            endTime={Date.now() + 50 * 24 * 60 * 60 * 1000}
            icon="🇨🇳"
          />
        </div>

        {/* My Bets Section */}
        {isGuest && hasBetOnMarket0 && (
          <div className="mt-8 p-5 bg-white rounded-xl shadow-lg border-2 border-[#0d5c4c]/20">
            <h2 className="text-lg font-bold text-[#0d5c4c] mb-3">📊 我的下注</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">
                  下注 <span className={`font-bold ${userBetDirection === "YES" ? "text-green-600" : "text-red-600"}`}>
                    {userBetDirection}
                  </span> | {userBetAmount} 道币
                </p>
                {mockMarket.resolved && (
                  <p className={`mt-1 font-bold ${potentialWinnings > 0 ? "text-green-600" : "text-red-600"}`}>
                    {potentialWinnings > 0 ? `🎉 赢得 ${potentialWinnings} 道币！` : "😢 未中奖"}
                  </p>
                )}
              </div>
              {mockMarket.resolved && potentialWinnings > 0 && !mockMarket.hasClaimed && (
                <button
                  onClick={claimMockWinnings}
                  className="px-6 py-2 bg-[#d4af37] text-[#0d5c4c] rounded-lg font-bold hover:bg-[#e5c048] transition shadow-lg"
                >
                  领取奖励
                </button>
              )}
              {mockMarket.hasClaimed && (
                <span className="text-green-600 font-bold">✅ 已领取</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bet Modal */}
      <BetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        marketId={selectedMarket?.id || "0"}
        direction={selectedMarket?.direction || "YES"}
      />
    </main>
  );
}
