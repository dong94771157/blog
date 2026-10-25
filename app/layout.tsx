import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();
  return {
    title: {
      default: site.siteName,
      template: `%s | ${site.siteName}`,
    },
    description: site.description,
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
    contact.wechat;

  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600">
              {site.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.logoUrl} alt="logo" className="h-8 w-8 rounded object-cover" />
              )}
              {site.siteName}
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="text-gray-600 hover:text-blue-600">
                首页
              </Link>
              <Link href="/admin" className="text-gray-600 hover:text-blue-600">
                管理
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8 min-h-[calc(100vh-120px)]">
          {children}
        </main>
        <footer className="border-t bg-white">
          <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-gray-500 space-y-2">
            {hasContact && (
              <div className="flex justify-center gap-4 text-xs">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="hover:text-blue-600">邮箱</a>
                )}
                {contact.github && (
                  <a href={contact.github} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">GitHub</a>
                )}
                {contact.twitter && (
                  <a href={contact.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">Twitter</a>
                )}
                {contact.telegram && (
                  <a href={contact.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">Telegram</a>
                )}
                {contact.qq && <span>QQ: {contact.qq}</span>}
                {contact.wechat && <span>微信: {contact.wechat}</span>}
              </div>
            )}
            <div>
              Powered by Next.js & EdgeOne Makers
              {site.icp && (
                <>
                  {" · "}
                  <a
                    href="https://beian.miit.gov.cn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600"
                  >
                    {site.icp}
                  </a>
                </>
              )}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}