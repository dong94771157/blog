"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
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

export default function UserMenu({ variant = "light" }: { variant?: "light" | "dark" }) {
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
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Portal 需要 DOM 就绪，仅在客户端渲染
  useEffect(() => setMounted(true), []);

  // ESC 键关闭全屏登录页
  useEffect(() => {
    if (!showAuth) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowAuth(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showAuth]);

  // 打开登录页时锁定背景滚动
  useEffect(() => {
    if (!showAuth) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showAuth]);

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

  // 登录/注册全屏页（二次元 × 赛博朋克 分栏）
  if (showAuth) {
    const strength = (() => {
      if (authMode !== "register" || !password) return 0;
      let s = 0;
      if (password.length >= 6) s++;
      if (password.length >= 10) s++;
      if (/[A-Za-z]/.test(password) && /\d/.test(password)) s++;
      if (/[^A-Za-z0-9]/.test(password)) s++;
      return s; // 0-4
    })();
    const strengthMeta = [
      { label: "", color: "bg-cyan-900/40", text: "" },
      { label: "弱", color: "bg-red-500", text: "text-red-400" },
      { label: "一般", color: "bg-amber-500", text: "text-amber-400" },
      { label: "良好", color: "bg-cyan-400", text: "text-cyan-300" },
      { label: "极强", color: "bg-emerald-400", text: "text-emerald-300" },
    ][strength];

    return mounted
      ? createPortal(
      <div className="fixed inset-0 z-50 bg-[#060a13] flex overflow-y-auto py-8 px-4 animate-[fadeIn_0.25s_ease-out]">
        {/* 背景网格 + 光晕 + 扫描线 */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(244,114,182,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(244,114,182,0.5) 1px, transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        />
        <div className="pointer-events-none fixed -top-32 left-1/4 w-[520px] h-[520px] rounded-full bg-pink-500/15 blur-[130px] animate-pulse-glow" />
        <div className="pointer-events-none fixed -bottom-24 right-8 w-[420px] h-[420px] rounded-full bg-cyan-500/12 blur-[120px] animate-pulse-glow" />
        <div className="scanline" />

        {/* 樱花飘落 */}
        {[...Array(9)].map((_, i) => (
          <span
            key={i}
            className="sakura-petal"
            style={{
              left: `${(i * 11 + 4) % 96}%`,
              width: `${8 + (i % 3) * 3}px`,
              height: `${8 + (i % 3) * 3}px`,
              animationDuration: `${9 + (i % 5) * 2.5}s`,
              animationDelay: `${i * 1.7}s`,
              opacity: 0.5,
            }}
          />
        ))}

        {/* 分栏卡片 */}
        <div className="relative w-full max-w-4xl m-auto flex rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(244,114,182,0.14)] border border-pink-500/25 backdrop-blur-xl animate-fade-up">
          {/* 左侧品牌区（md+ 显示，二次元粉紫） */}
          <div className="hidden md:flex w-[42%] flex-col justify-between relative overflow-hidden bg-gradient-to-br from-pink-600/90 via-fuchsia-600/85 to-purple-700/90 p-8">
            {/* 品牌区装饰 */}
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            />
            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/15 blur-2xl animate-pulse-glow" />
            <div className="absolute bottom-8 -left-8 w-32 h-32 rounded-full bg-cyan-300/25 blur-xl animate-pulse-glow" />
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="sakura-petal"
                style={{
                  left: `${15 + i * 18}%`,
                  width: `${9 + (i % 2) * 4}px`,
                  height: `${9 + (i % 2) * 4}px`,
                  animationDuration: `${8 + i * 2}s`,
                  animationDelay: `${i * 2.2}s`,
                }}
              />
            ))}

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-[11px] text-pink-50 font-mono tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                ONLINE · 欢迎光临
              </div>
              <h2 className="mt-5 text-3xl font-extrabold text-white leading-snug drop-shadow-lg">
                二次元的
                <br />
                <span className="text-cyan-200 neon-text-pink">科技基地 ✿</span>
              </h2>
              <p className="mt-3 text-pink-100/85 text-sm leading-relaxed">
                登录后解锁付费文章、资源下载与余额充值，和一个次元最懂你的博主一起冲浪。
              </p>
            </div>

            <ul className="relative space-y-2.5 font-mono text-[12px] text-pink-50/90">
              {[
                "✔ 付费文章解锁与下载",
                "✔ 余额充值 · 一键支付",
                "✔ 购买记录云同步",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-cyan-200" />
                  {t}
                </li>
              ))}
            </ul>

            <div className="relative font-mono text-[10px] text-white/50 tracking-widest">
              // powered with ♡ &amp; neon
            </div>
          </div>

          {/* 右侧表单区 */}
          <div className="flex-1 bg-[#0b1120]/95 min-w-0">
            {/* 终端标题栏 */}
            <div className="flex items-center gap-2 bg-[#0d1526] border-b border-cyan-500/15 px-4 py-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
              <span className="ml-3 font-mono text-xs text-cyan-300/80 tracking-wide">
                {authMode === "login" ? "user-login.sh" : "user-register.sh"}
              </span>
              <button
                onClick={() => setShowAuth(false)}
                className="ml-auto text-cyan-600/70 hover:text-cyan-300 text-lg leading-none transition-colors"
                title="关闭"
              >
                ×
              </button>
            </div>

            <div className="px-7 py-6">
              {/* 移动端小标题 */}
              <div className="md:hidden flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-xl shadow-lg shadow-pink-500/30">
                  {authMode === "login" ? "⚡" : "🚀"}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-cyan-100 tracking-wide">
                    {authMode === "login" ? "欢迎回来" : "创建账号"}
                  </h1>
                  <p className="font-mono text-[10px] text-cyan-500/70">
                    {authMode === "login"
                      ? "// 登录以继续阅读之旅"
                      : "// 注册解锁付费内容与资源下载"}
                  </p>
                </div>
              </div>

              {/* Tab 切换 */}
              <div className="flex bg-[#070b14] border border-cyan-500/15 rounded-xl p-1 gap-1 mb-6">
                {(["login", "register"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setAuthMode(mode);
                      setError("");
                      setPassword("");
                      setShowPassword(false);
                    }}
                    className={`relative flex-1 py-2 text-xs font-mono tracking-wider rounded-lg transition-all ${
                      authMode === mode
                        ? "bg-gradient-to-r from-pink-500/25 to-cyan-500/25 text-cyan-200 border border-pink-400/40 shadow-[0_0_14px_rgba(244,114,182,0.2)]"
                        : "text-cyan-700/60 hover:text-cyan-400 border border-transparent"
                    }`}
                  >
                    {mode === "login" ? "◆ 登录" : "◆ 注册"}
                  </button>
                ))}
              </div>

              {/* 表单 */}
              <form onSubmit={handleAuth} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg px-3 py-2.5 flex items-center gap-2 font-mono">
                    <span>[!]</span> {error}
                  </div>
                )}
                <div>
                  <label className="block font-mono text-[11px] text-cyan-400/90 mb-1.5 tracking-wider">
                    {'>'} {authMode === "login" ? "ACCOUNT" : "USERNAME"}
                  </label>
                  <input
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full bg-[#070b14] border border-cyan-500/25 rounded-lg px-3.5 py-2.5 text-sm text-cyan-100 font-mono placeholder:text-cyan-800/60 focus:outline-none focus:border-pink-400/60 focus:ring-1 focus:ring-pink-400/30 transition-all"
                    placeholder={authMode === "login" ? "用户名或邮箱" : "设置用户名"}
                    required
                  />
                </div>
                {authMode === "register" && (
                  <div>
                    <label className="block font-mono text-[11px] text-cyan-400/90 mb-1.5 tracking-wider">
                      {'>'} EMAIL
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#070b14] border border-cyan-500/25 rounded-lg px-3.5 py-2.5 text-sm text-cyan-100 font-mono placeholder:text-cyan-800/60 focus:outline-none focus:border-pink-400/60 focus:ring-1 focus:ring-pink-400/30 transition-all"
                      placeholder="输入邮箱地址"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block font-mono text-[11px] text-cyan-400/90 mb-1.5 tracking-wider">
                    {'>'} PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#070b14] border border-cyan-500/25 rounded-lg px-3.5 py-2.5 pr-11 text-sm text-cyan-100 font-mono placeholder:text-cyan-800/60 focus:outline-none focus:border-pink-400/60 focus:ring-1 focus:ring-pink-400/30 transition-all"
                      placeholder="输入密码"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-600/70 hover:text-cyan-300 text-sm transition-colors"
                      title={showPassword ? "隐藏密码" : "显示密码"}
                    >
                      {showPassword ? "◉" : "○"}
                    </button>
                  </div>
                  {/* 注册态密码强度条 */}
                  {authMode === "register" && password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4].map((lv) => (
                          <span
                            key={lv}
                            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                              strength >= lv ? strengthMeta.color : "bg-cyan-900/40"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`font-mono text-[10px] ${strengthMeta.text}`}>
                        {strengthMeta.label}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-cyan-500 bg-[length:200%_100%] text-white font-bold rounded-lg py-3 text-sm tracking-widest hover:bg-right disabled:opacity-50 transition-all duration-500 shadow-[0_0_24px_rgba(244,114,182,0.3)] font-mono"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      PROCESSING...
                    </span>
                  ) : authMode === "login" ? (
                    "▶ LOGIN"
                  ) : (
                    "▶ REGISTER"
                  )}
                </button>
              </form>

              {/* 底部 */}
              <div className="mt-5 text-center font-mono text-[10px] text-cyan-800/70">
                // 注册即可购买付费文章、下载资源与余额充值
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
      : null;
  }

  // 购买记录弹窗
  if (showPurchases) {
    return mounted
      ? createPortal(
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
      </div>,
      document.body
    )
      : null;
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
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${
          variant === "dark" ? "hover:bg-white/15" : "hover:bg-pink-50"
        }`}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 text-white flex items-center justify-center text-xs font-bold shadow-sm">
          {user.username.slice(0, 1).toUpperCase()}
        </div>
        <span
          className={`text-xs hidden sm:inline max-w-[80px] truncate ${
            variant === "dark" ? "text-white/80" : "text-gray-600"
          }`}
        >
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