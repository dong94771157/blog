"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

// 分组导航配置
const NAV_GROUPS: {
  title: string;
  items: { href: string; label: string; icon: string; exact?: boolean }[];
}[] = [
  {
    title: "概览",
    items: [
      { href: "/admin/dashboard", label: "仪表板", icon: "📊" },
    ],
  },
  {
    title: "内容管理",
    items: [
      { href: "/admin", label: "文章管理", icon: "📝", exact: true },
      { href: "/admin/posts/new", label: "新建文章", icon: "✏️" },
      { href: "/admin/categories", label: "分类管理", icon: "🏷️" },
    ],
  },
  {
    title: "用户与交易",
    items: [
      { href: "/admin/users", label: "用户管理", icon: "👥" },
      { href: "/admin/orders", label: "订单管理", icon: "💰" },
      { href: "/admin/payment", label: "支付配置", icon: "💳" },
    ],
  },
  {
    title: "互动与扩展",
    items: [
      { href: "/admin/comments", label: "留言管理", icon: "💬" },
      { href: "/admin/friends", label: "友链管理", icon: "🔗" },
      { href: "/admin/products", label: "产品推荐", icon: "✨" },
      { href: "/admin/notify", label: "通知管理", icon: "🔔" },
      { href: "/admin/music", label: "音乐接口", icon: "🎵" },
    ],
  },
  {
    title: "系统",
    items: [
      { href: "/admin/settings", label: "系统设置", icon: "⚙️" },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{ title: string; logo: string }>({
    title: "后台管理",
    logo: "",
  });
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // 加载后台外观设置（公开接口）
    fetch("/api/admin/info")
      .then((r) => r.json())
      .then((d) => {
        if (d.title) setAdminInfo({ title: d.title, logo: d.logo || "" });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoginPage) {
      setAuthed(false);
      return;
    }
    fetch("/api/posts?all=1")
      .then((res) => {
        if (res.ok) setAuthed(true);
        else router.replace("/admin/login");
      })
      .catch(() => router.replace("/admin/login"));
  }, [isLoginPage, router]);

  if (isLoginPage) return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );

  if (authed === null) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <span className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        <span className="text-pink-400 text-sm">验证登录状态...</span>
      </div>
    );
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-gradient-to-b from-[#0d1b2a] via-[#1b263b] to-[#415a77] transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 flex flex-col h-full overflow-y-auto">
          {/* 品牌区 */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4 rounded-2xl bg-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center text-xl shadow-inner overflow-hidden flex-shrink-0">
              {adminInfo.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={adminInfo.logo} alt="logo" className="w-full h-full object-cover" />
              ) : (
                "✿"
              )}
            </div>
            <div className="min-w-0">
              <div className="text-white font-bold text-base leading-tight truncate">
                {adminInfo.title}
              </div>
              <div className="text-white/60 text-[11px]">二次元博客系统</div>
            </div>
          </div>

          {/* 分组导航 */}
          <nav className="flex-1 space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="px-3 mb-1.5 text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? "bg-white text-pink-600 shadow-md"
                            : "text-white/80 hover:bg-white/15 hover:text-white"
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* 底部操作 */}
          <div className="border-t border-white/20 pt-3 mt-4 space-y-0.5">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/15 hover:text-white transition-all"
            >
              <span>🏠</span> 访问前台
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-red-400/40 hover:text-white transition-all"
            >
              <span>🚪</span> 退出登录
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 min-w-0 p-6 lg:p-8">
        {/* 移动端菜单按钮 */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 border border-pink-200 text-pink-600 text-sm font-medium shadow-sm"
        >
          ☰ 菜单
        </button>
        {children}
      </div>
    </div>
  );
}