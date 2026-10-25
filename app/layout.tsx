import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "我的博客",
    template: "%s | 我的博客",
  },
  description: "基于 Next.js + EdgeOne Makers 的全栈博客",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">
              我的博客
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
          <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-gray-500">
            Powered by Next.js & EdgeOne Makers
          </div>
        </footer>
      </body>
    </html>
  );
}