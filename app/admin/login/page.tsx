"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "登录失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        {/* Logo 标题 */}
        <div className="text-center mb-8">
          <div className="inline-block w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-pink-200">
            ✿
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            后台管理
          </h1>
          <p className="text-pink-400 text-sm mt-2">欢迎回来，请登录继续</p>
        </div>

        {/* 登录卡片 */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-3xl p-8 space-y-5 shadow-xl shadow-pink-100"
        >
          {error && (
            <div className="bg-red-50 text-red-500 text-sm px-4 py-2.5 rounded-xl border border-red-100">
              ⚠️ {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-pink-600 mb-1.5">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-pink-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-white/70 placeholder:text-pink-200 transition-all"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-pink-600 mb-1.5">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-pink-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-white/70 placeholder:text-pink-200 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl py-3 font-semibold hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 transition-all shadow-lg shadow-pink-200 hover:shadow-pink-300"
          >
            {loading ? "登录中..." : "登录 ✨"}
          </button>
        </form>

        <p className="text-center text-xs text-pink-300 mt-6">
          ✿ 二次元博客管理系统 ✿
        </p>
      </div>
    </div>
  );
}