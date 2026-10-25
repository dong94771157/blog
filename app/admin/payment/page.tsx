"use client";

import { useEffect, useState } from "react";
import type { PaymentSettings } from "@/lib/types";

const inputCls =
  "w-full border border-pink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";
const btnCls =
  "bg-gradient-to-r from-pink-500 to-purple-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50";

export default function PaymentPage() {
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings?type=payment")
      .then((r) => r.json())
      .then((d) => setPayment(d.settings));
  }, []);

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  async function save() {
    if (!payment) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings?type=payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment),
      });
      if (res.ok) {
        const d = await res.json();
        setPayment(d.settings);
        flash("保存成功");
      } else {
        flash("保存失败");
      }
    } catch {
      flash("保存失败");
    } finally {
      setSaving(false);
    }
  }

  function updateGeneral(key: keyof PaymentSettings["general"], value: string | number | boolean) {
    setPayment({ ...payment!, general: { ...payment!.general, [key]: value } });
  }
  function updateEpay(key: keyof PaymentSettings["epay"], value: string | boolean) {
    setPayment({ ...payment!, epay: { ...payment!.epay, [key]: value } });
  }
  function updateWechat(key: keyof PaymentSettings["wechat"], value: string | boolean) {
    setPayment({ ...payment!, wechat: { ...payment!.wechat, [key]: value } });
  }
  function updateAlipay(key: keyof PaymentSettings["alipay"], value: string | boolean) {
    setPayment({ ...payment!, alipay: { ...payment!.alipay, [key]: value } });
  }
  function updateDonate(key: keyof PaymentSettings["donate"], value: string | boolean) {
    setPayment({ ...payment!, donate: { ...payment!.donate, [key]: value } });
  }

  if (!payment) {
    return <div className="text-center py-20 text-pink-300 text-lg">加载中...</div>;
  }

  const enabledChannels = [
    payment.epay.enabled && "易支付",
    payment.wechat.enabled && "微信支付",
    payment.alipay.enabled && "支付宝",
  ].filter(Boolean);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pink-600">支付配置</h1>
        <p className="text-sm text-pink-400 mt-1">
          赞赏与余额充值的支付渠道配置 · 已启用：{enabledChannels.length > 0 ? enabledChannels.join("、") : "无"}
        </p>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-pink-50 text-pink-700 text-sm border border-pink-100">
          {message}
        </div>
      )}

      <div className="space-y-5">
        {/* 通用设置 */}
        <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">⚙️</span>
            <h3 className="font-medium text-gray-800">通用设置</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="accent-pink-500"
                  checked={payment.general.rechargeEnabled}
                  onChange={(e) => updateGeneral("rechargeEnabled", e.target.checked)}
                />
                开启余额充值功能（关闭后读者无法充值）
              </label>
            </div>
            <div>
              <label className={labelCls}>最低充值金额（元）</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className={inputCls}
                value={payment.general.minRecharge}
                onChange={(e) => updateGeneral("minRecharge", Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelCls}>最高充值金额（元）</label>
              <input
                type="number"
                min="1"
                step="1"
                className={inputCls}
                value={payment.general.maxRecharge}
                onChange={(e) => updateGeneral("maxRecharge", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* 赞赏设置 */}
        <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">☕</span>
            <h3 className="font-medium text-gray-800">赞赏功能</h3>
            <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                className="accent-pink-500"
                checked={payment.donate.enabled}
                onChange={(e) => updateDonate("enabled", e.target.checked)}
              />
              启用
            </label>
          </div>
          {payment.donate.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>赞赏标题</label>
                  <input className={inputCls} value={payment.donate.title} onChange={(e) => updateDonate("title", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelCls}>赞赏说明文案</label>
                <textarea
                  className={inputCls + " h-16"}
                  value={payment.donate.desc}
                  onChange={(e) => updateDonate("desc", e.target.value)}
                  placeholder="如果文章对你有帮助，可以请我喝杯咖啡~"
                />
              </div>
              <div className="border-t border-pink-100 pt-4">
                <p className="text-xs text-gray-500 mb-1">
                  💡 自定义收款码：上传微信/支付宝收款码图片，读者扫码即可转账赞赏，无需签约支付接口。
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  赞赏将自动展示在首页侧边栏、每篇文章底部和赞赏页面（/donate）
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>微信收款码图片 URL</label>
                    <input className={inputCls} value={payment.donate.wechatQr} onChange={(e) => updateDonate("wechatQr", e.target.value)} placeholder="https://...jpg/png" />
                    {payment.donate.wechatQr && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={payment.donate.wechatQr} alt="微信收款码预览" className="w-24 h-24 rounded-lg border border-pink-100 object-contain" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>支付宝收款码图片 URL</label>
                    <input className={inputCls} value={payment.donate.alipayQr} onChange={(e) => updateDonate("alipayQr", e.target.value)} placeholder="https://...jpg/png" />
                    {payment.donate.alipayQr && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={payment.donate.alipayQr} alt="支付宝收款码预览" className="w-24 h-24 rounded-lg border border-pink-100 object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 易支付 */}
        <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">🔗</span>
            <h3 className="font-medium text-gray-800">易支付（聚合支付）</h3>
            <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                className="accent-pink-500"
                checked={payment.epay.enabled}
                onChange={(e) => updateEpay("enabled", e.target.checked)}
              />
              启用
            </label>
          </div>
          {payment.epay.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>API 地址</label>
                <input className={inputCls} value={payment.epay.apiUrl} onChange={(e) => updateEpay("apiUrl", e.target.value)} placeholder="https://pay.example.com" />
                <p className="text-xs text-gray-400 mt-1">填写易支付站点根地址，系统将自动拼接 /submit.php</p>
              </div>
              <div>
                <label className={labelCls}>商户 ID（PID）</label>
                <input className={inputCls} value={payment.epay.pid} onChange={(e) => updateEpay("pid", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>商户密钥</label>
                <input type="password" className={inputCls} value={payment.epay.key} onChange={(e) => updateEpay("key", e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* 微信支付 */}
        <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">💚</span>
            <h3 className="font-medium text-gray-800">微信支付（Native 扫码）</h3>
            <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                className="accent-pink-500"
                checked={payment.wechat.enabled}
                onChange={(e) => updateWechat("enabled", e.target.checked)}
              />
              启用
            </label>
          </div>
          {payment.wechat.enabled && (
            <div className="space-y-4">
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                ⚠️ 需在微信商户平台设置 API 回调地址，格式为：<code className="text-xs">https://你的域名/api/payment/notify/wechat</code>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>AppID（公众号/小程序）</label>
                  <input className={inputCls} value={payment.wechat.appId} onChange={(e) => updateWechat("appId", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>商户号（MchID）</label>
                  <input className={inputCls} value={payment.wechat.mchId} onChange={(e) => updateWechat("mchId", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>APIv3 密钥</label>
                  <input type="password" className={inputCls} value={payment.wechat.apiV3Key} onChange={(e) => updateWechat("apiV3Key", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>证书序列号</label>
                  <input className={inputCls} value={payment.wechat.serialNo} onChange={(e) => updateWechat("serialNo", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>商户私钥（PEM 格式）</label>
                  <textarea
                    className={inputCls + " h-28 font-mono text-xs"}
                    value={payment.wechat.privateKey}
                    onChange={(e) => updateWechat("privateKey", e.target.value)}
                    placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 支付宝 */}
        <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">💙</span>
            <h3 className="font-medium text-gray-800">支付宝（当面付）</h3>
            <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                className="accent-pink-500"
                checked={payment.alipay.enabled}
                onChange={(e) => updateAlipay("enabled", e.target.checked)}
              />
              启用
            </label>
          </div>
          {payment.alipay.enabled && (
            <div className="space-y-4">
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                ⚠️ 需在支付宝开放平台配置回调地址，格式为：<code className="text-xs">https://你的域名/api/payment/notify/alipay</code>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>AppID</label>
                  <input className={inputCls} value={payment.alipay.appId} onChange={(e) => updateAlipay("appId", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>网关环境</label>
                  <select
                    className={inputCls}
                    value={payment.alipay.gateway}
                    onChange={(e) => updateAlipay("gateway", e.target.value)}
                  >
                    <option value="https://openapi.alipay.com/gateway.do">正式环境</option>
                    <option value="https://openapi-sandbox.dl.alipaydev.com/gateway.do">沙箱环境（测试用）</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>应用私钥</label>
                  <textarea
                    className={inputCls + " h-20 font-mono text-xs"}
                    value={payment.alipay.privateKey}
                    onChange={(e) => updateAlipay("privateKey", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>支付宝公钥</label>
                  <textarea
                    className={inputCls + " h-20 font-mono text-xs"}
                    value={payment.alipay.alipayPublicKey}
                    onChange={(e) => updateAlipay("alipayPublicKey", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button onClick={save} disabled={saving} className={`mt-6 ${btnCls}`}>
        {saving ? "保存中..." : "保存支付配置"}
      </button>
    </div>
  );
}