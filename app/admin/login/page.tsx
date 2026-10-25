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
  }>({ title: "后台管理", logo: "", welcomeText: "" });

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

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl shadow-pink-200/40 border border-pink-100 bg-white">
        {/* 左侧品牌装饰区 */}
        <div className="hidden lg:flex relative bg-gradient-to-br from-pink-500 via-pink-400 to-purple-500 p-10 flex-col justify-between overflow-hidden">
          {/* 装饰圆 */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute top-1/3 -left-12 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 right-1/4 w-48 h-48 rounded-full bg-white/5" />
          {/* 樱花 SVG */}
          <svg className="absolute top-8 right-10 w-20 h-20 text-white/15 animate-pulse" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 10c10 0 15 8 15 15s-5 10-15 10-15-3-15-10 5-15 15-15zm0 60c10 0 15 8 15 15s-5 10-15 10-15-3-15-10 5-15 15-15zM10 50c0-10 8-15 15-15s10 5 10 15-3 15-10 15-15-5-15-15zm60 0c0-10 8-15 15-15s10 5 10 15-3 15-10 15-15-5-15-15z" />
          </svg>

          <div className="relative z-[1]">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl mb-6 shadow-lg overflow-hidden">
              {adminInfo.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={adminInfo.logo} alt="logo" className="w-full h-full object-cover" />
              ) : (
                "✿"
              )}
            </div>
            <h2 className="text-3xl font-bold text-white drop-shadow-md mb-3">
              {adminInfo.title}
              <br />
              管理系统
            </h2>
            <p className="text-white/75 text-sm leading-relaxed max-w-xs">
              {adminInfo.welcomeText ||
                "在这里管理你的文章、分类、用户与订单，用文字记录孤独与温柔 ♡"}
            </p>
          </div>

          <div className="relative z-[1] space-y-3">
            {[
              { icon: "📝", text: "Markdown 文章创作与付费阅读" },
              { icon: "💾", text: "软件下载与付费下载管理" },
              { icon: "👥", text: "读者注册 / 余额 / 订单一站式管理" },
              { icon: "🌸", text: "全站粉色二次元主题定制" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 text-white/80 text-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-base">
                  {item.icon}
                </span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧登录表单 */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          {/* 移动端 Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-block w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-pink-200 overflow-hidden">
              {adminInfo.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={adminInfo.logo} alt="logo" className="w-full h-full object-cover" />
              ) : (
                "✿"
              )}
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              {adminInfo.title}
            </h1>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold text-gray-800">欢迎回来 👋</h1>
            <p className="text-gray-400 text-sm mt-1.5">
              {adminInfo.welcomeText || "请输入管理员账号登录后台"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                <span>⚠️</span> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-pink-600 mb-2">
                用户名
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-300">
                  👤
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-pink-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-pink-50/30 placeholder:text-pink-200 transition-all"
                  placeholder="请输入管理员用户名"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-pink-600 mb-2">
                密码
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-300">
                  🔒
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-pink-200 rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-pink-50/30 placeholder:text-pink-200 transition-all"
                  placeholder="请输入密码"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pink-300 hover:text-pink-500 transition-colors"
                  title={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl py-3.5 font-semibold hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 transition-all shadow-lg shadow-pink-200 hover:shadow-pink-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  登录中...
                </span>
              ) : (
                "登录 ✨"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-pink-300 mt-8">
            ✿ 二次元博客管理系统 · 仅供站长使用 ✿
          </p>
        </div>
      </div>
    </div>
  );
}