"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";

const CHANNEL_LABEL: Record<string, string> = {
  epay: "易支付",
  wechat: "微信",
  alipay: "支付宝",
};

const TYPE_LABEL: Record<string, string> = {
  donate: "赞赏",
  recharge: "充值",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "donate" | "recharge">(
    "all"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "paid" | "failed"
  >("all");

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(
    (o) =>
      (filterType === "all" || o.type === filterType) &&
      (filterStatus === "all" || o.status === filterStatus)
  );

  const totalPaid = orders
    .filter((o) => o.status === "paid")
    .reduce((s, o) => s + o.amount, 0);
  const donatePaid = orders
    .filter((o) => o.status === "paid" && o.type === "donate")
    .reduce((s, o) => s + o.amount, 0);
  const rechargePaid = orders
    .filter((o) => o.status === "paid" && o.type === "recharge")
    .reduce((s, o) => s + o.amount, 0);

  if (loading) {
    return (
      <div className="text-center py-20 text-pink-300 text-lg">加载中...</div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pink-600">订单管理</h1>
        <p className="text-sm text-pink-400 mt-1">
          赞赏与充值订单一览
        </p>
      </div>

      {/* 收入摘要 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-2xl p-5 text-white shadow-lg">
          <div className="text-sm text-white/80 mb-1">已支付总额</div>
          <div className="text-2xl font-bold">¥{totalPaid.toFixed(2)}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl p-5 text-white shadow-lg">
          <div className="text-sm text-white/80 mb-1">赞赏收入</div>
          <div className="text-2xl font-bold">¥{donatePaid.toFixed(2)}</div>
        </div>
        <div className="bg-gradient-to-br from-sky-400 to-purple-400 rounded-2xl p-5 text-white shadow-lg">
          <div className="text-sm text-white/80 mb-1">充值收入</div>
          <div className="text-2xl font-bold">¥{rechargePaid.toFixed(2)}</div>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["all", "全部类型"],
            ["donate", "赞赏"],
            ["recharge", "充值"],
          ] as const
        ).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterType(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterType === val
                ? "bg-pink-500 text-white shadow-md shadow-pink-200"
                : "bg-white/60 text-pink-500 border border-pink-200 hover:bg-pink-50"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="w-px bg-pink-200 mx-1" />
        {(
          [
            ["all", "全部状态"],
            ["paid", "已支付"],
            ["pending", "待支付"],
            ["failed", "失败"],
          ] as const
        ).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterStatus === val
                ? "bg-purple-500 text-white shadow-md shadow-purple-200"
                : "bg-white/60 text-purple-500 border border-purple-200 hover:bg-purple-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 订单列表 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/60 rounded-3xl border border-pink-100">
          <div className="text-4xl mb-3">🧾</div>
          <p className="text-pink-400">暂无订单</p>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl overflow-hidden shadow-lg shadow-pink-100">
          <table className="w-full text-sm">
            <thead className="bg-pink-50/80 border-b border-pink-100">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-pink-600">订单号</th>
                <th className="text-left px-4 py-3.5 font-semibold text-pink-600 w-20">类型</th>
                <th className="text-left px-4 py-3.5 font-semibold text-pink-600 w-20">渠道</th>
                <th className="text-left px-4 py-3.5 font-semibold text-pink-600 w-24">金额</th>
                <th className="text-left px-4 py-3.5 font-semibold text-pink-600 w-24">状态</th>
                <th className="text-left px-4 py-3.5 font-semibold text-pink-600 w-44">时间</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-pink-50 last:border-0 hover:bg-pink-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-xs text-gray-600">
                      {order.outTradeNo}
                    </div>
                    {order.message && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                        {order.message}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.type === "donate"
                          ? "bg-pink-50 text-pink-600"
                          : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      {TYPE_LABEL[order.type] || order.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">
                    {CHANNEL_LABEL[order.channel] || order.channel}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-pink-600">
                    ¥{order.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5">
                    {order.status === "paid" && (
                      <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-full text-xs font-medium">
                        ● 已支付
                      </span>
                    )}
                    {order.status === "pending" && (
                      <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-xs font-medium">
                        ○ 待支付
                      </span>
                    )}
                    {order.status === "failed" && (
                      <span className="bg-red-50 text-red-500 px-2.5 py-1 rounded-full text-xs font-medium">
                        ✕ 失败
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">
                    {new Date(order.createdAt).toLocaleString("zh-CN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}