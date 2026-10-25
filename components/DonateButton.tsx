"use client";

import { useState } from "react";

interface DonateButtonProps {
  title: string;
  desc?: string;
  amounts: number[];
  customAmount: boolean;
  wechatQr?: string;
  alipayQr?: string;
  channels: {
    epay: boolean;
    wechat: boolean;
    alipay: boolean;
  };
}

export default function DonateButton({
  title,
  desc,
  amounts,
  customAmount,
  wechatQr,
  alipayQr,
  channels,
}: DonateButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(amounts[0] || 5);
  const [customValue, setCustomValue] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState(
    channels.epay ? "epay" : channels.wechat ? "wechat" : channels.alipay ? "alipay" : ""
  );
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [qrTab, setQrTab] = useState<"wechat" | "alipay">(
    wechatQr ? "wechat" : "alipay"
  );

  const enabledChannels = [
    channels.epay && { key: "epay", label: "支付宝/微信" },
    channels.wechat && { key: "wechat", label: "微信扫码" },
    channels.alipay && { key: "alipay", label: "支付宝扫码" },
  ].filter(Boolean) as { key: string; label: string }[];

  const hasQrCode = !!(wechatQr || alipayQr);
  if (enabledChannels.length === 0 && !hasQrCode) return null;

  const finalAmount = useCustom ? Number(customValue) : amount;

  async function handlePay() {
    if (!finalAmount || finalAmount <= 0) {
      setError("请输入有效金额");
      return;
    }
    setLoading(true);
    setError("");
    setQrDataUrl("");
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, amount: finalAmount, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "创建订单失败");
        return;
      }
      if (data.type === "redirect" && data.payUrl) {
        window.location.href = data.payUrl;
      } else if (data.type === "qrcode" && data.qrDataUrl) {
        setQrDataUrl(data.qrDataUrl);
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setQrDataUrl("");
    setError("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-8 w-full py-3 rounded-xl border-2 border-dashed border-pink-300 text-pink-600 font-medium hover:bg-pink-50 transition-colors"
      >
        ☕ {title}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {qrDataUrl ? (
              <div className="text-center">
                <h3 className="font-bold text-gray-900 mb-1">扫码支付</h3>
                <p className="text-sm text-gray-500 mb-4">
                  ¥{finalAmount.toFixed(2)} · 请使用相应 App 扫码
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="支付二维码" className="mx-auto rounded-lg" />
                <p className="text-xs text-gray-400 mt-4">支付完成后页面可关闭</p>
                <button
                  onClick={handleClose}
                  className="mt-4 w-full py-2 rounded-lg border text-gray-600 text-sm hover:bg-gray-50"
                >
                  关闭
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{title}</h3>
                  <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
                    ×
                  </button>
                </div>

                {desc && (
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">{desc}</p>
                )}

                {enabledChannels.length === 0 && hasQrCode ? (
                  /* 仅收款码模式 */
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-500 mb-4">扫描下方二维码赞赏支持</p>
                    {wechatQr && alipayQr ? (
                      <div className="flex gap-2 mb-4 justify-center">
                        <button
                          onClick={() => setQrTab("wechat")}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${qrTab === "wechat" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"}`}
                        >
                          微信
                        </button>
                        <button
                          onClick={() => setQrTab("alipay")}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${qrTab === "alipay" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}
                        >
                          支付宝
                        </button>
                      </div>
                    ) : null}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrTab === "wechat" ? wechatQr : alipayQr}
                      alt="收款码"
                      className="mx-auto rounded-lg max-w-[220px]"
                    />
                    <p className="text-xs text-gray-400 mt-3">
                      {qrTab === "wechat" ? "请用微信扫码" : "请用支付宝扫码"}
                    </p>
                  </div>
                ) : (
                  <>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {amounts.map((a) => (
                    <button
                      key={a}
                      onClick={() => {
                        setAmount(a);
                        setUseCustom(false);
                      }}
                      className={`py-2 rounded-lg text-sm font-medium border ${
                        !useCustom && amount === a
                          ? "bg-pink-600 text-white border-pink-600"
                          : "border-gray-200 text-gray-600 hover:border-pink-300"
                      }`}
                    >
                      ¥{a}
                    </button>
                  ))}
                </div>

                {customAmount && (
                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <input
                        type="radio"
                        checked={useCustom}
                        onChange={() => setUseCustom(true)}
                      />
                      自定义金额
                    </label>
                    {useCustom && (
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        placeholder="输入金额"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    )}
                  </div>
                )}

                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="留言（可选）"
                  maxLength={100}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />

                {enabledChannels.length > 1 ? (
                  <div className="flex gap-2 mb-4">
                    {enabledChannels.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setChannel(c.key)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                          channel === c.key
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 text-gray-600 hover:border-blue-300"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-400 mb-4">
                    支付方式：{enabledChannels[0].label}
                  </div>
                )}

                {error && (
                  <p className="text-red-500 text-xs mb-3 text-center">{error}</p>
                )}

                <button
                  onClick={handlePay}
                  disabled={loading || !channel}
                  className="w-full py-3 rounded-xl bg-pink-600 text-white font-medium hover:bg-pink-700 disabled:opacity-50"
                >
                  {loading ? "创建订单中..." : `赞赏 ¥${(finalAmount || 0).toFixed(2)}`}
                </button>

                {hasQrCode && (
                  <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400 mb-3">或直接扫码赞赏</p>
                    {wechatQr && alipayQr ? (
                      <div className="flex gap-2 mb-3 justify-center">
                        <button
                          onClick={() => setQrTab("wechat")}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${qrTab === "wechat" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"}`}
                        >
                          微信
                        </button>
                        <button
                          onClick={() => setQrTab("alipay")}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${qrTab === "alipay" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}
                        >
                          支付宝
                        </button>
                      </div>
                    ) : null}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrTab === "wechat" ? wechatQr : alipayQr}
                      alt="收款码"
                      className="mx-auto rounded-lg max-w-[180px]"
                    />
                  </div>
                )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}