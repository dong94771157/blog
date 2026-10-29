"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{
    title: string;
    logo: string;
    welcomeText: string;
  }>({ title: "ADMIN CONSOLE", logo: "", welcomeText: "" });
  const [bootLog, setBootLog] = useState<string[]>([]);

  // 启动日志动画
  useEffect(() => {
    const lines = [
      "[OK]  初始化安全沙箱 .............. done",
      "[OK]  加载 AES-256 加密模块 ....... done",
      "[OK]  建立密钥交换通道 ............ done",
      "[OK]  防火墙规则自检 .............. done",
      "[..]  等待管理员身份认证 ...",
    ];
    let i = 0;
    const t = setInterval(() => {
      if (i < lines.length) {
        setBootLog((prev) => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(t);
      }
    }, 320);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/admin/info")
      .then((r) => r.json())
      .then((d) => {
        if (d.title)
          setAdminInfo({
            title: d.title,
            logo: d.logo || "",
            welcomeText: d.welcomeText || "",
          });
      })
      .catch(() => {});
  }, []);

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

  const terminal = "font-mono text-sm";

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#070b12] flex items-center justify-center py-10 px-4">
      {/* 背景：网格 + 光晕 + 扫描线 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.35) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <div className="pointer-events-none absolute -top-40 left-1/3 w-[560px] h-[560px] rounded-full bg-cyan-500/12 blur-[120px] animate-pulse-glow" />
      <div className="pointer-events-none absolute bottom-0 right-10 w-[380px] h-[380px] rounded-full bg-pink-500/10 blur-[110px] animate-pulse-glow" />
      <div className="scanline" />

      {/* HUD 四角括号 */}
      {[
        "top-5 left-5 border-t-2 border-l-2",
        "top-5 right-5 border-t-2 border-r-2",
        "bottom-5 left-5 border-b-2 border-l-2",
        "bottom-5 right-5 border-b-2 border-r-2",
      ].map((cls) => (
        <span
          key={cls}
          className={`pointer-events-none absolute w-10 h-10 border-cyan-400/40 ${cls}`}
        />
      ))}

      {/* 左上角状态条 */}
      <div className="pointer-events-none absolute top-6 left-20 font-mono text-[10px] text-cyan-500/60 tracking-widest hidden sm:block">
        SECURE SHELL · TLS 1.3 · NODE-01
      </div>
      <div className="pointer-events-none absolute top-6 right-20 flex items-center gap-1.5 font-mono text-[10px] text-emerald-400/70 tracking-widest hidden sm:flex">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> SYSTEM ONLINE
      </div>

      <div className="relative w-full max-w-lg animate-fade-up">
        {/* 窗口标题栏 */}
        <div className="flex items-center gap-2 bg-[#0c1220] border border-cyan-500/25 rounded-t-xl px-4 py-2.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-400/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
          <span className={`ml-3 text-cyan-300/80 ${terminal} tracking-wide text-xs`}>
            {adminInfo.title || "ADMIN"} · secure-terminal
          </span>
        </div>

        {/* 主体 */}
        <div className="neon-border rounded-b-xl shadow-[0_0_60px_rgba(34,211,238,0.10)]">
          {/* 品牌区 */}
          <div className="px-6 pt-7 pb-5 flex items-center gap-4 border-b border-cyan-500/10">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-[0_0_16px_rgba(34,211,238,0.2)]">
              {adminInfo.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={adminInfo.logo} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-cyan-400 text-xl font-bold animate-glitch">&gt;_</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-cyan-100 tracking-wide neon-text-cyan animate-glitch">
                {adminInfo.title || "ADMIN CONSOLE"}
              </h1>
              <p className={`text-cyan-500/70 text-xs ${terminal} mt-0.5`}>
                // {adminInfo.welcomeText || "身份验证 · 仅限授权访问"}
              </p>
            </div>
          </div>

          {/* 启动日志 */}
          <div className="px-6 py-3 bg-[#05080e]/90 border-b border-cyan-500/10">
            <div className={`text-[11px] text-emerald-400/80 ${terminal} space-y-0.5 h-[70px] overflow-hidden`}>
              {bootLog.map((line, i) => (
                <div key={i} className="opacity-90">
                  {line}
                  {i === bootLog.length - 1 && <span className="animate-pulse">▊</span>}
                </div>
              ))}
            </div>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg px-3 py-2.5 flex items-center gap-2 font-mono animate-glitch">
                <span>[!]</span> {error}
              </div>
            )}

            <div>
              <label className={`block text-cyan-400/90 mb-1.5 text-xs tracking-wider ${terminal}`}>
                &gt; USERNAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#070b12] border border-cyan-500/25 rounded-lg px-3.5 py-2.5 text-sm text-cyan-100 font-mono placeholder:text-cyan-700/50 focus:outline-none focus:border-pink-400/60 focus:ring-1 focus:ring-pink-400/30 transition-all"
                placeholder="admin"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className={`block text-cyan-400/90 mb-1.5 text-xs tracking-wider ${terminal}`}>
                &gt; PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#070b12] border border-cyan-500/25 rounded-lg px-3.5 py-2.5 pr-11 text-sm text-cyan-100 font-mono placeholder:text-cyan-700/50 focus:outline-none focus:border-pink-400/60 focus:ring-1 focus:ring-pink-400/30 transition-all"
                  placeholder="********"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500/70 hover:text-cyan-300 text-sm transition-colors"
                  title={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? "◉" : "○"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-pink-500 bg-[length:200%_100%] text-white font-bold rounded-lg py-3 text-sm tracking-widest hover:bg-right disabled:opacity-50 transition-all duration-500 shadow-[0_0_24px_rgba(34,211,238,0.3)] font-mono"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 font-mono">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AUTHENTICATING...
                </span>
              ) : (
                "▶ 进入控制台"
              )}
            </button>
          </form>

          {/* 底部 */}
          <div className={`px-6 pb-6 text-center text-[11px] text-cyan-700/60 ${terminal}`}>
            ✿ 管理控制台 · 仅供站长使用 · TLS 1.3 ✿
          </div>
        </div>
      </div>
    </div>
  );
}
