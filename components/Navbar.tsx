"use client";
// v5.0.0 - Social Login Update

import Link from "next/link";
import { useUser } from "@/context/UserContext";
import Image from "next/image";

export default function Navbar() {
    const { isGuest, daoCoins, shareToEarn, logout, user, isAuthenticated } = useUser();

    return (
        <nav className="bg-[#0d5c4c] text-white shadow-lg border-b-2 border-[#d4af37]/30">
            <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-10 h-10">
                        <Image
                            src="/dao-coin.png"
                            alt="问DAO"
                            width={40}
                            height={40}
                            className="group-hover:rotate-180 transition-transform duration-700"
                        />
                    </div>
                    <span className="text-2xl font-bold text-[#d4af37] tracking-wider">
                        问DAO
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    {isGuest ? (
                        <>
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#d4af37]/20 rounded-lg border border-[#d4af37]/40">
                                <span className="text-[#d4af37] font-bold">☯️ {daoCoins}</span>
                                <span className="text-xs text-[#d4af37]/80">道币</span>
                            </div>
                            <button
                                onClick={shareToEarn}
                                className="px-4 py-2 bg-[#d4af37]/10 text-[#d4af37] rounded-lg hover:bg-[#d4af37]/20 transition border border-[#d4af37]/30 font-medium"
                            >
                                🔗 分享得币
                            </button>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-white/70 hover:text-white transition"
                            >
                                退出
                            </button>
                        </>
                    ) : (
                        <a
                            href="/auth"
                            className="px-6 py-2 bg-[#d4af37] text-[#0d5c4c] rounded-lg font-bold hover:bg-[#e5c048] transition shadow-lg"
                        >
                            登录 / 注册
                        </a>
                    )}
                </div>
            </div>
        </nav>
    );
}
