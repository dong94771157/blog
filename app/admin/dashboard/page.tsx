"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  posts: { total: number; published: number; drafts: number; paid: number };
  users: { total: number; balanceTotal: number };
  revenue: { sales: number; donate: number; recharge: number; total: number };
  orders: { total: number; paid: number; pending: number };
  purchases: { total: number };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <span className="w-10 h-10 border-[3px] border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        <span className="text-pink-400 text-sm">加载运营数据...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-24">
        <div className="text-4xl mb-3">😵</div>
        <div className="text-red-400">数据加载失败，请刷新重试</div>
      </div>
    );
  }

  const cards = [
    {
      label: "总营收",
      value: `¥${stats.revenue.total.toFixed(2)}`,
      sub: `销售 ¥${stats.revenue.sales.toFixed(2)} · 赞赏 ¥${stats.revenue.donate.toFixed(2)}`,
      icon: "💰",
      gradient: "from-pink-500 to-rose-400",
    },
    {
      label: "充值总额",
      value: `¥${stats.revenue.recharge.toFixed(2)}`,
      sub: `用户余额合计 ¥${stats.users.balanceTotal.toFixed(2)}`,
      icon: "💳",
      gradient: "from-purple-500 to-pink-400",
    },
    {
      label: "文章总数",
      value: String(stats.posts.total),
      sub: `已发布 ${stats.posts.published} · 草稿 ${stats.posts.drafts} · 付费 ${stats.posts.paid}`,
      icon: "📝",
      gradient: "from-orange-400 to-pink-400",
    },
    {
      label: "用户总数",
      value: String(stats.users.total),
      sub: `文章购买 ${stats.purchases.total} 次`,
      icon: "👥",
      gradient: "from-sky-400 to-purple-400",
    },
  ];

  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div>
      {/* 页头 */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-500 bg-clip-text text-transparent">
            仪表板
          </h1>
          <p className="text-sm text-pink-400 mt-1">{today}</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-pink-200 hover:shadow-pink-300 hover:scale-105 active:scale-95 transition-all"
        >
          ✏️ 写新文章
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`relative bg-gradient-to-br ${card.gradient} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all overflow-hidden`}
          >
            {/* 装饰圆 */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10" />
            <div className="relative z-[1]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white/85">
                  {card.label}
                </span>
                <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                  {card.icon}
                </span>
              </div>
              <div className="text-3xl font-bold mb-1 drop-shadow-sm">
                {card.value}
              </div>
              <div className="text-xs text-white/70">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 订单概览 */}
      <div className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-lg shadow-pink-100/50 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-pink-600 flex items-center gap-2">
            <span>📦</span> 订单概览
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm text-pink-400 hover:text-pink-600 transition-colors"
          >
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl py-5 border border-pink-100">
            <div className="text-3xl font-bold text-pink-600">
              {stats.orders.total}
            </div>
            <div className="text-xs text-pink-400 mt-1.5 font-medium">总订单</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl py-5 border border-green-100">
            <div className="text-3xl font-bold text-green-600">
              {stats.orders.paid}
            </div>
            <div className="text-xs text-green-500 mt-1.5 font-medium">已支付</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl py-5 border border-amber-100">
            <div className="text-3xl font-bold text-amber-600">
              {stats.orders.pending}
            </div>
            <div className="text-xs text-amber-500 mt-1.5 font-medium">待支付</div>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-lg shadow-pink-100/50">
        <h2 className="text-lg font-bold text-pink-600 mb-5 flex items-center gap-2">
          <span>⚡</span> 快捷操作
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { href: "/admin/posts/new", label: "写文章", icon: "✏️" },
            { href: "/admin", label: "管理文章", icon: "📝" },
            { href: "/admin/categories", label: "管理分类", icon: "🏷️" },
            { href: "/admin/users", label: "管理用户", icon: "👥" },
            { href: "/admin/settings", label: "网站设置", icon: "⚙️" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-2.5 py-5 rounded-2xl bg-pink-50/60 border border-pink-100 hover:border-pink-300 hover:bg-pink-50 hover:shadow-md transition-all"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {action.icon}
              </span>
              <span className="text-sm text-pink-600 font-medium">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}