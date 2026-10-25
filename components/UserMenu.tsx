"use client";

import { useEffect, useState, useRef } from "react";
import RechargeModal from "./RechargeModal";

interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar: string;
  balance: number;
}

interface Purchase {
  id: string;
  postTitle: string;
  amount: number;
  createdAt: number;
}

export default function UserMenu() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [account, setAccount] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showPurchases, setShowPurchases] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body =
        authMode === "login"
          ? { account, password }
          : { username: account, email, password };
      const res = await fetch(`/api/user/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setShowAuth(false);
        setAccount("");
        setEmail("");
        setPassword("");
      } else {
        setError(data.error || "操作失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/user/logout", { method: "POST" });
    setUser(null);
    setOpen(false);
  }

  async function loadPurchases() {
    const res = await fetch("/api/user/me");
    const data = await res.json();
    if (data.purchases) setPurchases(data.purchases);
    setShowPurchases(true);
  }

  async function refreshUser() {
    const res = await fetch("/api/user/me");
    const data = await res.json();
    if (data.user) setUser(data.user);
  }

  // 登录/注册弹窗
  if (showAuth) {
    return (
      <div
        className="fixed inset-0 bg-gradient-to-br from-pink-200/40 to-purple-200/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => setShowAuth(false)}
      >
        <div
          className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl shadow-pink-200/50 border border-pink-100 animate-[fadeIn_0.2s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 顶部装饰 */}
          <div className="bg-gradient-to-r from-pink-500 via-pink-400 to-purple-400 px-6 pt-6 pb-8 relative">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-3 right-4 w-7 h-7 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center text-lg leading-none transition-colors"
            >
              ×
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-2xl">
                {authMode === "login" ? "🌸" : "✨"}
              </div>
              <div>
                <h3 className="font-bold text-xl text-white">
                  {authMode === "login" ? "欢迎回来" : "加入我们"}
                </h3>
                <p className="text-white/70 text-xs mt-0.5">
                  {authMode === "login" ? "登录账号继续阅读之旅" : "注册账号解锁全部功能"}
                </p>
              </div>
            </div>
          </div>

          {/* 表单 */}
          <form onSubmit={handleAuth} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 text-sm px-4 py-2.5 rounded-xl border border-red-100 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-pink-500 mb-1.5">
                {authMode === "login" ? "用户名或邮箱" : "用户名"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300 text-sm">
                  {authMode === "login" ? "👤" : "🏷️"}
                </span>
                <input
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full border border-pink-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-pink-50/30 placeholder:text-pink-200 transition-all"
                  placeholder={authMode === "login" ? "输入用户名或邮箱" : "设置用户名"}
                  required
                />
              </div>
            </div>
            {authMode === "register" && (
              <div>
                <label className="block text-xs font-medium text-pink-500 mb-1.5">
                  邮箱
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300 text-sm">
                    ✉️
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-pink-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-pink-50/30 placeholder:text-pink-200 transition-all"
                    placeholder="输入邮箱地址"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-pink-500 mb-1.5">
                密码
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300 text-sm">
                  🔒
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-pink-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-pink-50/30 placeholder:text-pink-200 transition-all"
                  placeholder="输入密码"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 transition-all shadow-lg shadow-pink-200 hover:shadow-pink-300"
            >
              {loading ? "处理中..." : authMode === "login" ? "登录 ✨" : "注册 ✨"}
            </button>
          </form>

          {/* 底部切换 */}
          <div className="px-6 pb-6 -mt-2">
            <div className="text-center text-sm text-gray-400 bg-pink-50/50 rounded-xl py-3">
              {authMode === "login" ? "还没有账号？" : "已有账号？"}
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setError("");
                }}
                className="text-pink-500 hover:text-pink-700 font-medium ml-1 underline underline-offset-2"
              >
                {authMode === "login" ? "去注册" : "去登录"}
              </button>
            </div>
            <p className="text-center text-xs text-pink-300 mt-3">
              ✿ 注册即可购买付费文章与余额充值 ✿
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 购买记录弹窗
  if (showPurchases) {
    return (
      <div
        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
        onClick={() => setShowPurchases(false)}
      >
        <div
          className="bg-white rounded-2xl p-6 w-full max-w-sm border-2 border-pink-100 max-h-[70vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">我的购买</h3>
            <button onClick={() => setShowPurchases(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>
          {purchases.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">还没有购买记录</p>
          ) : (
            <div className="space-y-3">
              {purchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-pink-50/50 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{p.postTitle}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString("zh-CN")}
                    </div>
                  </div>
                  <span className="text-pink-600 text-sm font-medium">¥{p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 未登录
  if (!user) {
    return (
      <button
        onClick={() => {
          setAuthMode("login");
          setShowAuth(true);
        }}
        className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-pink-500 to-purple-400 text-white hover:opacity-90 transition-opacity"
      >
        登录 / 注册
      </button>
    );
  }

  // 已登录
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-pink-50 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold">
          {user.username.slice(0, 1).toUpperCase()}
        </div>
        <span className="text-xs text-gray-600 hidden sm:inline">{user.username}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-pink-100 shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-pink-50">
            <div className="text-sm font-medium text-gray-800">{user.username}</div>
            <div className="text-xs text-gray-400">{user.email}</div>
            <div className="text-xs text-pink-600 mt-1">余额：¥{user.balance.toFixed(2)}</div>
          </div>
          <button
            onClick={() => {
              loadPurchases();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-pink-50"
          >
            我的购买
          </button>
          <button
            onClick={() => {
              setShowRecharge(true);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-pink-600 hover:bg-pink-50 font-medium"
          >
            💳 余额充值
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50"
          >
            退出登录
          </button>
        </div>
      )}

      <RechargeModal
        open={showRecharge}
        onClose={() => setShowRecharge(false)}
        onSuccess={refreshUser}
      />
    </div>
  );
}