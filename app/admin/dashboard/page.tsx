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
      <div className="text-center py-20 text-pink-300 text-lg">加载中...</div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-red-400">数据加载失败</div>
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pink-600">仪表板</h1>
        <p className="text-sm text-pink-400 mt-1">博客运营数据一览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/80">
                {card.label}
              </span>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <div className="text-3xl font-bold mb-1">{card.value}</div>
            <div className="text-xs text-white/70">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* 订单概览 */}
      <div className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-lg shadow-pink-100 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-pink-600">订单概览</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-pink-400 hover:text-pink-600 underline"
          >
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-pink-50/80 rounded-xl py-4">
            <div className="text-2xl font-bold text-pink-600">
              {stats.orders.total}
            </div>
            <div className="text-xs text-pink-400 mt-1">总订单</div>
          </div>
          <div className="bg-green-50/80 rounded-xl py-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.orders.paid}
            </div>
            <div className="text-xs text-green-500 mt-1">已支付</div>
          </div>
          <div className="bg-amber-50/80 rounded-xl py-4">
            <div className="text-2xl font-bold text-amber-600">
              {stats.orders.pending}
            </div>
            <div className="text-xs text-amber-500 mt-1">待支付</div>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-lg shadow-pink-100">
        <h2 className="text-lg font-bold text-pink-600 mb-4">快捷操作</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/admin/posts/new", label: "✏️ 写文章" },
            { href: "/admin", label: "📝 管理文章" },
            { href: "/admin/categories", label: "🏷️ 管理分类" },
            { href: "/admin/users", label: "👥 管理用户" },
            { href: "/admin/settings", label: "⚙️ 网站设置" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="px-4 py-2.5 rounded-xl bg-pink-50 text-pink-600 text-sm font-medium hover:bg-pink-100 transition-colors"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}