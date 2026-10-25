"use client";

import { useState } from "react";

interface PaywallCardProps {
  postId: string;
  postTitle: string;
  price: number;
  loggedIn: boolean;
  balance: number;
  purchased: boolean;
}

export default function PaywallCard({
  postId,
  postTitle,
  price,
  loggedIn,
  balance,
  purchased,
}: PaywallCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handlePurchase() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${postId}/purchase`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        // 刷新页面显示全文
        setTimeout(() => window.location.reload(), 800);
      } else {
        setError(data.error || "购买失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  if (purchased || success) {
    return (
      <div className="text-center py-6 text-pink-500 text-sm">
        ✓ 购买成功！正在加载全文...
      </div>
    );
  }

  return (
    <div className="relative my-8">
      {/* 上方渐变遮罩 */}
      <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-white/90 to-transparent pointer-events-none z-10" />

      <div className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">该内容为付费内容</h3>
        <p className="text-sm text-gray-500 mb-4">
          购买《{postTitle}》全文，仅需
        </p>
        <div className="text-3xl font-bold text-pink-600 mb-6">
          ¥{price.toFixed(2)}
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!loggedIn ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">请先登录后购买</p>
            <p className="text-xs text-gray-400">点击右上角「登录 / 注册」即可</p>
          </div>
        ) : balance < price ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              当前余额 <span className="text-pink-600 font-medium">¥{balance.toFixed(2)}</span>，余额不足
            </p>
            <p className="text-xs text-gray-400">
              请联系站长充值余额后再购买 ♡
            </p>
          </div>
        ) : (
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-400 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg shadow-pink-200"
          >
            {loading ? "购买中..." : `立即购买 ¥${price.toFixed(2)}`}
          </button>
        )}

        {loggedIn && (
          <p className="text-xs text-gray-400 mt-4">
            购买后可永久阅读全文 · 当前余额 ¥{balance.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}