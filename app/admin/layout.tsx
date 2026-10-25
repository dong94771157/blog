"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "仪表板", icon: "📊" },
  { href: "/admin", label: "文章管理", icon: "📝", exact: true },
  { href: "/admin/posts/new", label: "新建文章", icon: "✏️" },
  { href: "/admin/categories", label: "分类管理", icon: "🏷️" },
  { href: "/admin/users", label: "用户管理", icon: "👥" },
  { href: "/admin/orders", label: "订单管理", icon: "💰" },
  { href: "/admin/payment", label: "支付配置", icon: "💳" },
  { href: "/admin/comments", label: "留言管理", icon: "💬" },
  { href: "/admin/notify", label: "通知管理", icon: "🔔" },
  { href: "/admin/settings", label: "系统设置", icon: "⚙️" },
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
  const isLoginPage = pathname === "/admin/login";

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

  if (isLoginPage) return <>{children}</>;

  if (authed === null) {
    return (
      <div className="flex items-center justify-center py-32 text-pink-300">
        <span className="text-lg">验证登录状态...</span>
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
    // /admin 需要精确匹配，其他前缀匹配
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] -mx-4 -my-8">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[57px] left-0 z-50 h-full lg:h-[calc(100vh-57px)] w-60 bg-gradient-to-b from-pink-500 via-pink-400 to-purple-400 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 flex flex-col h-full">
          <div className="text-white font-bold text-lg mb-6 px-2">
            ✿ 后台管理
          </div>

          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-white/90 text-pink-600 shadow-md"
                      : "text-white/80 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/20 pt-4 mt-4 space-y-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-white/20 hover:text-white transition-all"
            >
              <span>🏠</span> 访问前台
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-red-400/40 hover:text-white transition-all"
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
          className="lg:hidden mb-4 px-3 py-2 rounded-lg bg-white/80 border border-pink-200 text-pink-600 text-sm"
        >
          ☰ 菜单
        </button>
        {children}
      </div>
    </div>
  );
}