import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSiteSettings } from "@/lib/settings";
import UserMenu from "@/components/UserMenu";
import MusicPlayer from "@/components/MusicPlayer";
import AIChat from "@/components/AIChat";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();
  return {
    title: {
      default: site.siteName,
      template: `%s | ${site.siteName}`,
    },
    description: site.description,
    ...(site.keywords ? { keywords: site.keywords } : {}),
    ...(site.author ? { authors: [{ name: site.author }] } : {}),
    ...(site.faviconUrl ? { icons: { icon: site.faviconUrl } } : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSiteSettings();
  const contact = site.contact;
  const hasContact =
    contact.email ||
    contact.github ||
    contact.twitter ||
    contact.telegram ||
    contact.qq ||
    contact.wechat ||
    contact.bilibili;

  return (
    <html lang="zh-CN">
      <body>
        <header className="sticky top-0 z-40 border-b border-pink-100 bg-white/80 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity">
              {site.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.logoUrl} alt="logo" className="h-8 w-8 rounded-full object-cover border-2 border-pink-200" />
              )}
              <span className="text-gradient-pink">{site.siteName}</span>
            </Link>
            <div className="flex items-center gap-4">
              <nav className="flex gap-3 text-sm">
                <Link href="/" className="text-gray-500 hover:text-pink-600 transition-colors">
                  首页
                </Link>
                <Link href="/donate" className="text-gray-500 hover:text-pink-600 transition-colors">
                  赞赏
                </Link>
                <Link href="/admin" className="text-gray-500 hover:text-pink-600 transition-colors">
                  管理
                </Link>
              </nav>
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 min-h-[calc(100vh-140px)]">
          {children}
        </main>
        <footer className="border-t border-pink-100 bg-white/60 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-gray-400 space-y-2">
            {hasContact && (
              <div className="flex justify-center gap-4 text-xs">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="hover:text-pink-500 transition-colors">邮箱</a>
                )}
                {contact.github && (
                  <a href={contact.github} target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">GitHub</a>
                )}
                {contact.twitter && (
                  <a href={contact.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">Twitter</a>
                )}
                {contact.telegram && (
                  <a href={contact.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">Telegram</a>
                )}
                {contact.bilibili && (
                  <a href={contact.bilibili.startsWith("http") ? contact.bilibili : `https://space.bilibili.com/${contact.bilibili}`} target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">B站</a>
                )}
                {contact.qq && <span>QQ: {contact.qq}</span>}
                {contact.wechat && <span>微信: {contact.wechat}</span>}
              </div>
            )}
            <div>
              {site.footerText ? (
                <span>{site.footerText}</span>
              ) : (
                <>
                  <span className="text-pink-300">✿</span> Powered by Next.js & EdgeOne Makers{" "}
                  <span className="text-pink-300">✿</span>
                </>
              )}
              {site.icp && (
                <>
                  {" · "}
                  <a
                    href="https://beian.miit.gov.cn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-pink-500 transition-colors"
                  >
                    {site.icp}
                  </a>
                </>
              )}
            </div>
          </div>
        </footer>
        <MusicPlayer />
        <AIChat />
      </body>
    </html>
  );
}