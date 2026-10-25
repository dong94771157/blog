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
  downloadName?: string;
}

export default function UserMenu() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [account, setAccount] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          <div className="bg-gradient-to-r from-pink-500 via-pink-400 to-purple-400 px-6 pt-6 pb-8 relative overflow-hidden">
            {/* 樱花装饰 */}
            <svg className="absolute -top-3 -right-3 w-24 h-24 text-white/10" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 15c8 0 12 6 12 12s-4 8-12 8-12-2-12-8 4-12 12-12zm0 50c8 0 12 6 12 12s-4 8-12 8-12-2-12-8 4-12 12-12zM15 50c0-8 6-12 12-12s8 4 8 12-2 12-8 12-12-4-12-12zm50 0c0-8 6-12 12-12s8 4 8 12-2 12-8 12-12-4-12-12z" />
            </svg>
            <svg className="absolute bottom-2 -left-4 w-16 h-16 text-white/10 rotate-45" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="40" />
            </svg>
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-3 right-4 w-7 h-7 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center text-lg leading-none transition-colors z-10"
            >
              ×
            </button>
            <div className="flex items-center gap-3 relative z-[1]">
              <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-2xl shadow-inner">
                {authMode === "login" ? "🌸" : "✨"}
              </div>
              <div>
                <h3 className="font-bold text-xl text-white drop-shadow-sm">
                  {authMode === "login" ? "欢迎回来" : "加入我们"}
                </h3>
                <p className="text-white/75 text-xs mt-0.5">
                  {authMode === "login" ? "登录账号继续阅读之旅" : "注册账号解锁全部功能"}
                </p>
              </div>
            </div>
          </div>

          {/* 登录/注册 Tab */}
          <div className="flex border-b border-pink-100">
            {(["login", "register"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setAuthMode(mode);
                  setError("");
                }}
                className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                  authMode === mode
                    ? "text-pink-600"
                    : "text-gray-400 hover:text-pink-400"
                }`}
              >
                {mode === "login" ? "登录" : "注册"}
                {authMode === mode && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                )}
              </button>
            ))}
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-pink-200 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-pink-50/30 placeholder:text-pink-200 transition-all"
                  placeholder="输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-300 hover:text-pink-500 text-sm transition-colors"
                  title={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
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

          {/* 底部提示 */}
          <div className="px-6 pb-6 -mt-2">
            <div className="text-center text-xs text-pink-400 bg-pink-50/60 rounded-xl py-2.5 leading-relaxed">
              ✿ 注册即可购买付费文章、下载与余额充值 ✿
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 购买记录弹窗
  if (showPurchases) {
    return (
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => setShowPurchases(false)}
      >
        <div
          className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl shadow-pink-200/50 border border-pink-100 max-h-[75vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-pink-500 via-pink-400 to-purple-400 px-6 py-4 flex items-center justify-between">
            <h3 className="font-bold text-white">🧾 我的购买</h3>
            <button
              onClick={() => setShowPurchases(false)}
              className="w-7 h-7 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center text-lg leading-none transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-5 overflow-y-auto flex-1">
            {purchases.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🌸</div>
                <p className="text-gray-400 text-sm">还没有购买记录</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {purchases.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-pink-50/50 rounded-xl px-3.5 py-2.5 border border-pink-100/60"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-700 truncate">
                        {p.downloadName ? (
                          <span>
                            <span className="text-amber-500 mr-1">💾</span>
                            {p.downloadName}
                          </span>
                        ) : (
                          <span>
                            <span className="text-pink-400 mr-1">📖</span>
                            {p.postTitle}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {p.downloadName && (
                          <span className="mr-1.5 text-gray-300 truncate">
                            《{p.postTitle}》
                          </span>
                        )}
                        {new Date(p.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                    <span className="text-pink-600 text-sm font-semibold whitespace-nowrap ml-2">
                      ¥{p.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        className="group flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all shadow-md shadow-pink-200 hover:shadow-pink-300 hover:scale-105 active:scale-95"
      >
        <span className="text-sm group-hover:rotate-12 transition-transform">🌸</span>
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
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 text-white flex items-center justify-center text-xs font-bold shadow-sm">
          {user.username.slice(0, 1).toUpperCase()}
        </div>
        <span className="text-xs text-gray-600 hidden sm:inline max-w-[80px] truncate">
          {user.username}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-pink-100 shadow-xl shadow-pink-100/50 overflow-hidden z-50">
          {/* 用户信息头 */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-3 border-b border-pink-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {user.username}
                </div>
                <div className="text-xs text-gray-400 truncate">{user.email}</div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between bg-white/70 rounded-lg px-2.5 py-1.5">
              <span className="text-xs text-gray-500">账户余额</span>
              <span className="text-sm font-bold text-pink-600">
                ¥{user.balance.toFixed(2)}
              </span>
            </div>
          </div>
          {/* 菜单项 */}
          <div className="py-1.5">
            <button
              onClick={() => {
                loadPurchases();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-colors"
            >
              <span>🧾</span> 我的购买
            </button>
            <button
              onClick={() => {
                setShowRecharge(true);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-pink-600 hover:bg-pink-50 font-medium transition-colors"
            >
              <span>💳</span> 余额充值
            </button>
          </div>
          <div className="border-t border-pink-50 py-1.5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <span>🚪</span> 退出登录
            </button>
          </div>
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