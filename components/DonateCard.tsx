"use client";

import { useEffect, useState } from "react";

interface DonateCardProps {
  title: string;
  desc?: string;
  wechatQr?: string;
  alipayQr?: string;
  /** compact: 侧边栏小卡片 | full: 赞赏页/文章底部大卡片 */
  variant?: "compact" | "full";
}

export default function DonateCard({
  title,
  desc,
  wechatQr,
  alipayQr,
  variant = "compact",
}: DonateCardProps) {
  const [tab, setTab] = useState<"wechat" | "alipay">(
    wechatQr ? "wechat" : "alipay"
  );
  const [imgError, setImgError] = useState(false);

  const currentQr = tab === "wechat" ? wechatQr : alipayQr;

  // 切换二维码时重置错误状态
  useEffect(() => {
    setImgError(false);
  }, [currentQr]);

  if (!wechatQr && !alipayQr) return null;

  const hasBoth = !!(wechatQr && alipayQr);
  const isFull = variant === "full";

  return (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/40 overflow-hidden ${
        isFull ? "p-8" : "p-4"
      }`}
    >
      {/* 标题 */}
      <div className="text-center">
        <div className={`mb-2 ${isFull ? "text-4xl" : "text-2xl"}`}>☕</div>
        <h3
          className={`font-bold text-gray-800 ${
            isFull ? "text-xl" : "text-sm"
          }`}
        >
          {title}
        </h3>
        {desc && (
          <p
            className={`text-gray-500 mt-1.5 leading-relaxed ${
              isFull ? "text-sm" : "text-xs"
            }`}
          >
            {desc}
          </p>
        )}
      </div>

      {/* 微信/支付宝 切换 */}
      {hasBoth && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setTab("wechat")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              tab === "wechat"
                ? "bg-green-500 text-white shadow-md shadow-green-200"
                : "bg-white/60 text-gray-500 border border-gray-200 hover:border-green-300"
            }`}
          >
            <span>💚</span> 微信
          </button>
          <button
            onClick={() => setTab("alipay")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              tab === "alipay"
                ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                : "bg-white/60 text-gray-500 border border-gray-200 hover:border-blue-300"
            }`}
          >
            <span>💙</span> 支付宝
          </button>
        </div>
      )}

      {/* 二维码图片 */}
      <div className="flex justify-center mt-4">
        {imgError || !currentQr ? (
          <div
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/50 text-gray-400 ${
              isFull ? "w-64 h-64" : "w-40 h-40"
            }`}
          >
            <span className="text-3xl mb-1">(´；ω；`)</span>
            <span className="text-xs">二维码加载失败</span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={currentQr}
            alt={tab === "wechat" ? "微信收款码" : "支付宝收款码"}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`rounded-xl border-2 border-pink-100 object-contain bg-white ${
              isFull ? "w-64 h-64" : "w-40 h-40"
            }`}
          />
        )}
      </div>

      {/* 提示文字 */}
      <p
        className={`text-center text-gray-400 mt-3 ${
          isFull ? "text-sm" : "text-[11px]"
        }`}
      >
        {tab === "wechat" ? "请用微信扫一扫" : "请用支付宝扫一扫"}
        {hasBoth ? " · 点击上方切换" : ""}
      </p>

      {/* 赞赏页面链接（仅 compact 模式且非赞赏页时显示） */}
      {!isFull && (
        <a
          href="/donate"
          className="mt-3 block text-center text-xs text-pink-500 hover:text-pink-600 font-medium py-1.5 rounded-lg hover:bg-pink-50 transition-colors"
        >
          前往赞赏页面 →
        </a>
      )}
    </div>
  );
}