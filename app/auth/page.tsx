"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    // Check if already logged in
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push("/");
            }
        };
        checkUser();
    }, [router]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage("✅ 登录成功！正在跳转...");
                setTimeout(() => router.push("/"), 1500);
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage("✅ 注册成功！请检查邮箱确认链接。");
            }
        } catch (error: any) {
            setMessage(`❌ 错误: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            if (error) throw error;
        } catch (error: any) {
            setMessage(`❌ Google登录失败: ${error.message}`);
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#0d5c4c] via-[#0a4a3c] to-[#1a1a1a] flex items-center justify-center p-4">
            <div className="bg-[#faf8f5] rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-[#d4af37]/30">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-2">☯️</div>
                    <h1 className="text-3xl font-bold text-[#0d5c4c]">
                        问DAO
                    </h1>
                    <p className="text-[#0d5c4c]/70 mt-2">天机预测 · 顺势而为</p>
                </div>

                {/* Tab Switch */}
                <div className="flex mb-6 bg-[#0d5c4c]/10 rounded-lg p-1">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2 rounded-lg transition font-medium ${isLogin ? 'bg-[#0d5c4c] text-white shadow' : 'text-[#0d5c4c]'
                            }`}
                    >
                        登录
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2 rounded-lg transition font-medium ${!isLogin ? 'bg-[#0d5c4c] text-white shadow' : 'text-[#0d5c4c]'
                            }`}
                    >
                        注册
                    </button>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#0d5c4c] mb-1">
                            📧 邮箱
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-[#0d5c4c]/20 rounded-lg focus:ring-2 focus:ring-[#0d5c4c] focus:border-transparent outline-none text-gray-900 bg-white"
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0d5c4c] mb-1">
                            🔐 密码
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 border border-[#0d5c4c]/20 rounded-lg focus:ring-2 focus:ring-[#0d5c4c] focus:border-transparent outline-none text-gray-900 bg-white"
                            placeholder="至少6位"
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-[#0d5c4c] to-[#1a7f6a] text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#0d5c4c]/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-[#faf8f5] text-[#0d5c4c]/60">或</span>
                    </div>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        使用 Google 登录
                    </button>

                    <button
                        disabled
                        className="w-full py-3 bg-[#07C160] text-white font-medium rounded-lg opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088v-.001a9.7 9.7 0 00-.406-.033zm-1.834 2.391c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.857 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z" />
                        </svg>
                        微信登录 (即将推出)
                    </button>
                </div>

                {/* Bonus Notice */}
                {!isLogin && (
                    <div className="mt-4 p-3 bg-[#d4af37]/10 rounded-lg text-sm text-[#0d5c4c] border border-[#d4af37]/30">
                        🎁 注册即送 <strong>100 道币</strong>，可用于预测下注！
                    </div>
                )}
            </div>
        </main>
    );
}
