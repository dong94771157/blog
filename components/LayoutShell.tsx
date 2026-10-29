"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import MusicPlayer from "./MusicPlayer";
import AIChat from "./AIChat";

interface ContactInfo {
  email: string;
  github: string;
  twitter: string;
  telegram: string;
  qq: string;
  wechat: string;
  bilibili: string;
}

interface LayoutShellProps {
  children: React.ReactNode;
  /** 全站赞赏卡片（服务端组件），后台与 /donate 页自动跳过 */
  donate?: React.ReactNode;
  site: {
    siteName: string;
    logoUrl: string;
    description: string;
    footerText: string;
    icp: string;
    contact: ContactInfo;
  };
}

export default function LayoutShell({ children, donate, site }: LayoutShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = pathname?.startsWith("/admin");
  const contact = site.contact;
  const hasContact =
    contact.email ||
    contact.github ||
    contact.twitter ||
    contact.telegram ||
    contact.qq ||
    contact.wechat ||
    contact.bilibili;

  // 后台路由：全屏，无站点头尾（admin/layout.tsx 自带侧边栏）
  if (isAdmin) {
    return (
      <div className="min-h-screen w-full">
        {children}
        <MusicPlayer />
        <AIChat />
      </div>
    );
  }

  // 前台导航项
  const navItems = [
    { href: "/", label: "首页", icon: "🏠", exact: true },
    { href: "/donate", label: "赞赏", icon: "💖" },
    { href: "/admin", label: "管理", icon: "⚙️" },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  // 前台路由：左侧深色侧边栏 + 右侧内容区（沉浸式全屏布局）
  return (
    <div className="flex min-h-screen w-full">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 左侧深色侧边栏 */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex-shrink-0 bg-gradient-to-b from-[#0d1b2a] via-[#1b263b] to-[#415a77] transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 flex flex-col h-full overflow-y-auto">
          {/* 品牌区 */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4 rounded-2xl bg-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center text-xl shadow-inner overflow-hidden flex-shrink-0">
              {site.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.logoUrl} alt="logo" className="w-full h-full object-cover" />
              ) : (
                "✿"
              )}
            </div>
            <div className="min-w-0">
              <div className="text-white font-bold text-base leading-tight truncate">
                {site.siteName}
              </div>
              <div className="text-white/60 text-[11px] line-clamp-2">{site.description}</div>
            </div>
          </div>

          {/* 导航 */}
          <nav className="space-y-0.5 mb-4">
            {navItems.map((item) => {
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
          </nav>

          {/* 用户区 */}
          <div className="px-3 py-3 mb-4 rounded-2xl bg-white/10 backdrop-blur-sm">
            <UserMenu variant="dark" />
          </div>

          {/* 社交联系 */}
          {hasContact && (
            <div className="space-y-0.5 mb-4">
              <div className="px-3 mb-1.5 text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                联系方式
              </div>
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-white/15 hover:text-white transition-all"
                >
                  <span>📧</span> 邮箱
                </a>
              )}
              {contact.github && (
                <a
                  href={contact.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-white/15 hover:text-white transition-all"
                >
                  <span>🐙</span> GitHub
                </a>
              )}
              {contact.twitter && (
                <a
                  href={contact.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-white/15 hover:text-white transition-all"
                >
                  <span>🐦</span> Twitter
                </a>
              )}
              {contact.telegram && (
                <a
                  href={contact.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-white/15 hover:text-white transition-all"
                >
                  <span>✈️</span> Telegram
                </a>
              )}
              {contact.bilibili && (
                <a
                  href={contact.bilibili.startsWith("http") ? contact.bilibili : `https://space.bilibili.com/${contact.bilibili}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-white/15 hover:text-white transition-all"
                >
                  <span>📺</span> B站
                </a>
              )}
              {contact.qq && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/70">
                  <span>💬</span> QQ: {contact.qq}
                </div>
              )}
              {contact.wechat && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/70">
                  <span>💚</span> 微信: {contact.wechat}
                </div>
              )}
            </div>
          )}

          {/* 底部信息 */}
          <div className="mt-auto border-t border-white/20 pt-3 text-center space-y-1">
            <div className="text-white/50 text-[11px]">
              {site.footerText || (
                <>
                  <span className="text-pink-300">✿</span> Powered by Next.js & EdgeOne Makers{" "}
                  <span className="text-pink-300">✿</span>
                </>
              )}
            </div>
            {site.icp && (
              <a
                href="https://beian.miit.gov.cn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 text-[11px] hover:text-white/70 transition-colors"
              >
                {site.icp}
              </a>
            )}
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 min-w-0">
        {/* 移动端菜单按钮 */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-3 left-3 z-30 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 border border-pink-200 text-pink-600 text-sm font-medium shadow-sm backdrop-blur"
        >
          ☰ 菜单
        </button>
        <main className="px-4 sm:px-6 lg:px-10 py-8 min-h-screen">
          {children}
          {/* 全站赞赏卡片：/donate 页自身已有大卡片，跳过避免重复 */}
          {pathname !== "/donate" && donate}
        </main>
      </div>

      <MusicPlayer />
      <AIChat />
    </div>
  );
}