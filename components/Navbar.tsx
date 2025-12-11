"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";
import Image from "next/image";

export default function Navbar() {
    const { isGuest, daoCoins, shareToEarn, logout, user, isAuthenticated } = useUser();

    return (
        <nav className="bg-[#2C5F4F] text-white shadow-md">
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
                    <span className="text-2xl font-bold text-white tracking-wider">
                        问DAO
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    {isGuest ? (
                        <>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                                <span className="text-white font-bold">🪙 {daoCoins}</span>
                                <span className="text-xs text-white/70">道币</span>
                            </div>
                            <button
                                onClick={shareToEarn}
                                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
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
                            className="px-6 py-2 bg-white text-[#2C5F4F] rounded-lg font-bold hover:bg-gray-100 transition"
                        >
                            登录 / 注册
                        </a>
                    )}
                </div>
            </div>
        </nav>
    );
}
