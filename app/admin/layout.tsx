"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setAuthed(false);
      return;
    }
    // 验证登录状态
    fetch("/api/posts?all=1")
      .then((res) => {
        if (res.ok) setAuthed(true);
        else router.replace("/admin/login");
      })
      .catch(() => router.replace("/admin/login"));
  }, [isLoginPage, router]);

  // 登录页直接渲染
  if (isLoginPage) return <>{children}</>;

  // 检查中
  if (authed === null) {
    return (
      <div className="text-center py-20 text-gray-400">验证登录状态...</div>
    );
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div>
      <div className="bg-white border rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-gray-900">后台管理</span>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            文章列表
          </Link>
          <Link
            href="/admin/posts/new"
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            新建文章
          </Link>
          <Link
            href="/admin/settings"
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            网站设置
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700"
        >
          退出登录
        </button>
      </div>
      {children}
    </div>
  );
}