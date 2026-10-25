"use client";

import { useState } from "react";

interface DownloadBuyButtonProps {
  postId: string;
  downloadId: string;
  price: number;
  loggedIn: boolean;
  balance: number;
}

export default function DownloadBuyButton({
  postId,
  downloadId,
  price,
  loggedIn,
  balance,
}: DownloadBuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handlePurchase() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${postId}/download-purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
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

  if (success) {
    return (
      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-100 text-green-600 text-sm font-medium">
        ✓ 购买成功，加载中...
      </span>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-50 text-red-500 text-xs px-3 py-1.5 rounded-lg border border-red-100">
          ⚠️ {error}
        </div>
      )}
      {!loggedIn ? (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-600 text-sm font-medium border border-amber-200">
            🔒 付费下载 ¥{price.toFixed(2)}
          </span>
          <p className="text-xs text-gray-400">请先登录后购买（右上角登录）</p>
        </div>
      ) : balance < price ? (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-600 text-sm font-medium border border-amber-200">
            🔒 付费下载 ¥{price.toFixed(2)}
          </span>
          <p className="text-xs text-gray-400">
            余额 ¥{balance.toFixed(2)} 不足，请充值后再购买 ♡
          </p>
        </div>
      ) : (
        <button
          onClick={handlePurchase}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md shadow-amber-200"
        >
          {loading ? "购买中..." : `🔒 花费 ¥${price.toFixed(2)} 购买下载`}
        </button>
      )}
    </div>
  );
}