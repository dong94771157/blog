"use client";

import { useEffect, useState } from "react";
import type {
  SiteSettings,
  NotifySettings,
  PaymentSettings,
  AISettings,
} from "@/lib/types";

type Tab = "site" | "notify" | "payment" | "ai";

const inputCls =
  "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";
const btnCls =
  "bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("site");
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [notify, setNotify] = useState<NotifySettings | null>(null);
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [ai, setAi] = useState<AISettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const [s, n, p, a] = await Promise.all([
        fetch("/api/settings?type=site").then((r) => r.json()),
        fetch("/api/settings?type=notify").then((r) => r.json()),
        fetch("/api/settings?type=payment").then((r) => r.json()),
        fetch("/api/settings?type=ai").then((r) => r.json()),
      ]);
      setSite(s.settings);
      setNotify(n.settings);
      setPayment(p.settings);
      setAi(a.settings);
    })();
  }, []);

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  async function save(type: Tab, data: unknown) {
    setSaving(true);
    try {
      const res = await fetch(`/api/settings?type=${type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const d = await res.json();
        if (type === "site") setSite(d.settings);
        if (type === "notify") setNotify(d.settings);
        if (type === "payment") setPayment(d.settings);
        if (type === "ai") setAi(d.settings);
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

  async function testNotify(channel: string) {
    setTesting(channel);
    try {
      const res = await fetch("/api/notify/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const d = await res.json();
      flash(d.success ? "测试通知已发送" : `发送失败：${d.error || "未知错误"}`);
    } catch {
      flash("发送失败");
    } finally {
      setTesting("");
    }
  }

  if (!site || !notify || !payment || !ai) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">网站设置</h1>

      <div className="flex gap-2 mb-6">
        {(
          [
            ["site", "网站信息"],
            ["notify", "通知配置"],
            ["payment", "支付配置"],
            ["ai", "AI 配置"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === key
                ? "bg-blue-600 text-white"
                : "bg-white border text-gray-600 hover:text-blue-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm">
          {message}
        </div>
      )}

      {tab === "site" && <SiteForm site={site} setSite={setSite} save={save} saving={saving} />}
      {tab === "notify" && (
        <NotifyForm notify={notify} setNotify={setNotify} save={save} saving={saving} testNotify={testNotify} testing={testing} />
      )}
      {tab === "payment" && <PaymentForm payment={payment} setPayment={setPayment} save={save} saving={saving} />}
      {tab === "ai" && <AIForm ai={ai} setAi={setAi} save={save} saving={saving} />}
    </div>
  );
}

// ---- 网站信息表单 ----
function SiteForm({
  site,
  setSite,
  save,
  saving,
}: {
  site: SiteSettings;
  setSite: (s: SiteSettings) => void;
  save: (type: Tab, data: unknown) => void;
  saving: boolean;
}) {
  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSite({ ...site, [key]: value });
  }
  function updateContact(key: keyof SiteSettings["contact"], value: string) {
    setSite({ ...site, contact: { ...site.contact, [key]: value } });
  }

  return (
    <div className="bg-white border rounded-xl p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>网站名称</label>
          <input className={inputCls} value={site.siteName} onChange={(e) => update("siteName", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>域名</label>
          <input className={inputCls} value={site.domain} onChange={(e) => update("domain", e.target.value)} placeholder="example.com" />
        </div>
        <div>
          <label className={labelCls}>Logo URL</label>
          <input className={inputCls} value={site.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className={labelCls}>Favicon URL</label>
          <input className={inputCls} value={site.faviconUrl} onChange={(e) => update("faviconUrl", e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <div>
        <label className={labelCls}>网站描述</label>
        <input className={inputCls} value={site.description} onChange={(e) => update("description", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>ICP 备案号</label>
        <input className={inputCls} value={site.icp} onChange={(e) => update("icp", e.target.value)} placeholder="京ICP备xxxxxxxx号" />
      </div>
      <div className="border-t pt-4">
        <h3 className="font-medium text-gray-900 mb-3">联系方式</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>邮箱</label>
            <input className={inputCls} value={site.contact.email} onChange={(e) => updateContact("email", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>GitHub</label>
            <input className={inputCls} value={site.contact.github} onChange={(e) => updateContact("github", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Twitter</label>
            <input className={inputCls} value={site.contact.twitter} onChange={(e) => updateContact("twitter", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Telegram</label>
            <input className={inputCls} value={site.contact.telegram} onChange={(e) => updateContact("telegram", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>QQ</label>
            <input className={inputCls} value={site.contact.qq} onChange={(e) => updateContact("qq", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>微信</label>
            <input className={inputCls} value={site.contact.wechat} onChange={(e) => updateContact("wechat", e.target.value)} />
          </div>
        </div>
      </div>
      <button onClick={() => save("site", site)} disabled={saving} className={btnCls}>
        {saving ? "保存中..." : "保存网站信息"}
      </button>
    </div>
  );
}

// ---- 通知配置表单 ----
function NotifyForm({
  notify,
  setNotify,
  save,
  saving,
  testNotify,
  testing,
}: {
  notify: NotifySettings;
  setNotify: (n: NotifySettings) => void;
  save: (type: Tab, data: unknown) => void;
  saving: boolean;
  testNotify: (channel: string) => void;
  testing: string;
}) {
  function updateSmtp(key: keyof NotifySettings["smtp"], value: string | number | boolean) {
    setNotify({ ...notify, smtp: { ...notify.smtp, [key]: value } });
  }
  function updateFeishu(key: keyof NotifySettings["feishu"], value: string | boolean) {
    setNotify({ ...notify, feishu: { ...notify.feishu, [key]: value } });
  }
  function updateWecom(key: keyof NotifySettings["wecom"], value: string | boolean) {
    setNotify({ ...notify, wecom: { ...notify.wecom, [key]: value } });
  }
  function updateTelegram(key: keyof NotifySettings["telegram"], value: string | boolean) {
    setNotify({ ...notify, telegram: { ...notify.telegram, [key]: value } });
  }

  const testBtn = (channel: string) => (
    <button
      onClick={() => testNotify(channel)}
      disabled={testing === channel}
      className="text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-2 py-1 disabled:opacity-50"
    >
      {testing === channel ? "发送中..." : "发送测试"}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* SMTP */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-900">邮件通知（SMTP）</h3>
            <label className="flex items-center gap-1 text-sm text-gray-500">
              <input
                type="checkbox"
                checked={notify.smtp.enabled}
                onChange={(e) => updateSmtp("enabled", e.target.checked)}
              />
              启用
            </label>
          </div>
          {notify.smtp.enabled && testBtn("smtp")}
        </div>
        {notify.smtp.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>SMTP 服务器</label>
              <input className={inputCls} value={notify.smtp.host} onChange={(e) => updateSmtp("host", e.target.value)} placeholder="smtp.example.com" />
            </div>
            <div>
              <label className={labelCls}>端口</label>
              <input type="number" className={inputCls} value={notify.smtp.port} onChange={(e) => updateSmtp("port", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>账号</label>
              <input className={inputCls} value={notify.smtp.user} onChange={(e) => updateSmtp("user", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>密码/授权码</label>
              <input type="password" className={inputCls} value={notify.smtp.pass} onChange={(e) => updateSmtp("pass", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>发件人</label>
              <input className={inputCls} value={notify.smtp.from} onChange={(e) => updateSmtp("from", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>收件人</label>
              <input className={inputCls} value={notify.smtp.to} onChange={(e) => updateSmtp("to", e.target.value)} placeholder="多个用逗号分隔" />
            </div>
          </div>
        )}
      </div>

      {/* 飞书 */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-900">飞书机器人</h3>
            <label className="flex items-center gap-1 text-sm text-gray-500">
              <input
                type="checkbox"
                checked={notify.feishu.enabled}
                onChange={(e) => updateFeishu("enabled", e.target.checked)}
              />
              启用
            </label>
          </div>
          {notify.feishu.enabled && testBtn("feishu")}
        </div>
        {notify.feishu.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Webhook 地址</label>
              <input className={inputCls} value={notify.feishu.webhook} onChange={(e) => updateFeishu("webhook", e.target.value)} placeholder="https://open.feishu.cn/..." />
            </div>
            <div>
              <label className={labelCls}>加签密钥（可选）</label>
              <input className={inputCls} value={notify.feishu.secret} onChange={(e) => updateFeishu("secret", e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* 企业微信 */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-900">企业微信机器人</h3>
            <label className="flex items-center gap-1 text-sm text-gray-500">
              <input
                type="checkbox"
                checked={notify.wecom.enabled}
                onChange={(e) => updateWecom("enabled", e.target.checked)}
              />
              启用
            </label>
          </div>
          {notify.wecom.enabled && testBtn("wecom")}
        </div>
        {notify.wecom.enabled && (
          <div>
            <label className={labelCls}>Webhook 地址</label>
            <input className={inputCls} value={notify.wecom.webhook} onChange={(e) => updateWecom("webhook", e.target.value)} placeholder="https://qyapi.weixin.qq.com/..." />
          </div>
        )}
      </div>

      {/* Telegram */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-900">Telegram</h3>
            <label className="flex items-center gap-1 text-sm text-gray-500">
              <input
                type="checkbox"
                checked={notify.telegram.enabled}
                onChange={(e) => updateTelegram("enabled", e.target.checked)}
              />
              启用
            </label>
          </div>
          {notify.telegram.enabled && testBtn("telegram")}
        </div>
        {notify.telegram.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Bot Token</label>
              <input className={inputCls} value={notify.telegram.botToken} onChange={(e) => updateTelegram("botToken", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Chat ID</label>
              <input className={inputCls} value={notify.telegram.chatId} onChange={(e) => updateTelegram("chatId", e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <button onClick={() => save("notify", notify)} disabled={saving} className={btnCls}>
        {saving ? "保存中..." : "保存通知配置"}
      </button>
    </div>
  );
}

// ---- 支付配置表单 ----
function PaymentForm({
  payment,
  setPayment,
  save,
  saving,
}: {
  payment: PaymentSettings;
  setPayment: (p: PaymentSettings) => void;
  save: (type: Tab, data: unknown) => void;
  saving: boolean;
}) {
  function updateEpay(key: keyof PaymentSettings["epay"], value: string | boolean) {
    setPayment({ ...payment, epay: { ...payment.epay, [key]: value } });
  }
  function updateWechat(key: keyof PaymentSettings["wechat"], value: string | boolean) {
    setPayment({ ...payment, wechat: { ...payment.wechat, [key]: value } });
  }
  function updateAlipay(key: keyof PaymentSettings["alipay"], value: string | boolean) {
    setPayment({ ...payment, alipay: { ...payment.alipay, [key]: value } });
  }
  function updateDonate(key: keyof PaymentSettings["donate"], value: string | number[] | boolean) {
    setPayment({ ...payment, donate: { ...payment.donate, [key]: value } });
  }

  const sectionTitle = (title: string, enabled: boolean, onToggle: (v: boolean) => void) => (
    <div className="flex items-center gap-3 mb-4">
      <h3 className="font-medium text-gray-900">{title}</h3>
      <label className="flex items-center gap-1 text-sm text-gray-500">
        <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
        启用
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 赞赏设置 */}
      <div className="bg-white border rounded-xl p-6">
        {sectionTitle("赞赏功能", payment.donate.enabled, (v) => updateDonate("enabled", v))}
        {payment.donate.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>赞赏标题</label>
              <input className={inputCls} value={payment.donate.title} onChange={(e) => updateDonate("title", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>预设金额（逗号分隔）</label>
              <input
                className={inputCls}
                value={payment.donate.amounts.join(",")}
                onChange={(e) =>
                  updateDonate(
                    "amounts",
                    e.target.value.split(",").map((n) => Number(n.trim())).filter((n) => n > 0)
                  )
                }
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={payment.donate.customAmount}
                  onChange={(e) => updateDonate("customAmount", e.target.checked)}
                />
                允许自定义金额
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 易支付 */}
      <div className="bg-white border rounded-xl p-6">
        {sectionTitle("易支付", payment.epay.enabled, (v) => updateEpay("enabled", v))}
        {payment.epay.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>API 地址</label>
              <input className={inputCls} value={payment.epay.apiUrl} onChange={(e) => updateEpay("apiUrl", e.target.value)} placeholder="https://pay.example.com" />
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
      <div className="bg-white border rounded-xl p-6">
        {sectionTitle("微信支付（Native 扫码）", payment.wechat.enabled, (v) => updateWechat("enabled", v))}
        {payment.wechat.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>AppID</label>
              <input className={inputCls} value={payment.wechat.appId} onChange={(e) => updateWechat("appId", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>商户号</label>
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
              <label className={labelCls}>商户私钥（PEM）</label>
              <textarea
                className={inputCls + " h-28 font-mono text-xs"}
                value={payment.wechat.privateKey}
                onChange={(e) => updateWechat("privateKey", e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----"
              />
            </div>
          </div>
        )}
      </div>

      {/* 支付宝 */}
      <div className="bg-white border rounded-xl p-6">
        {sectionTitle("支付宝（当面付）", payment.alipay.enabled, (v) => updateAlipay("enabled", v))}
        {payment.alipay.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>AppID</label>
              <input className={inputCls} value={payment.alipay.appId} onChange={(e) => updateAlipay("appId", e.target.value)} />
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
        )}
      </div>

      <button onClick={() => save("payment", payment)} disabled={saving} className={btnCls}>
        {saving ? "保存中..." : "保存支付配置"}
      </button>
    </div>
  );
}

// ---- AI 配置表单 ----
function AIForm({
  ai,
  setAi,
  save,
  saving,
}: {
  ai: AISettings;
  setAi: (a: AISettings) => void;
  save: (type: Tab, data: unknown) => void;
  saving: boolean;
}) {
  function update<K extends keyof AISettings>(key: K, value: AISettings[K]) {
    setAi({ ...ai, [key]: value });
  }

  const PROVIDERS: { value: string; label: string }[] = [
    { value: "openai", label: "OpenAI" },
    { value: "deepseek", label: "DeepSeek（深度求索）" },
    { value: "qwen", label: "通义千问（阿里）" },
    { value: "zhipu", label: "智谱清言（GLM）" },
    { value: "moonshot", label: "月之暗面（Kimi）" },
    { value: "siliconflow", label: "硅基流动（SiliconFlow）" },
    { value: "ollama", label: "Ollama（本地部署）" },
    { value: "custom", label: "自定义接口" },
  ];

  const PRESET_URLS: Record<string, string> = {
    openai: "https://api.openai.com/v1",
    deepseek: "https://api.deepseek.com/v1",
    qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    zhipu: "https://open.bigmodel.cn/api/paas/v4",
    moonshot: "https://api.moonshot.cn/v1",
    siliconflow: "https://api.siliconflow.cn/v1",
    ollama: "http://localhost:11434/v1",
  };

  function handleProviderChange(provider: string) {
    setAi({
      ...ai,
      provider: provider as AISettings["provider"],
      apiUrl: PRESET_URLS[provider] || ai.apiUrl,
    });
  }

  return (
    <div className="space-y-6">
      {/* AI 客服 */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-medium text-gray-900">🤖 AI 客服助手</h3>
          <label className="flex items-center gap-1 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={ai.enabled}
              onChange={(e) => update("enabled", e.target.checked)}
            />
            启用
          </label>
        </div>
        {ai.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>接口提供商</label>
                <select
                  className={inputCls}
                  value={ai.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  所有接口均兼容 OpenAI 格式
                </p>
              </div>
              <div>
                <label className={labelCls}>模型名称</label>
                <input
                  className={inputCls}
                  value={ai.model}
                  onChange={(e) => update("model", e.target.value)}
                  placeholder="如 gpt-4o-mini / deepseek-chat"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>API 地址（Base URL）</label>
              <input
                className={inputCls}
                value={ai.apiUrl}
                onChange={(e) => update("apiUrl", e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className={labelCls}>API Key</label>
              <input
                type="password"
                className={inputCls}
                value={ai.apiKey}
                onChange={(e) => update("apiKey", e.target.value)}
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className={labelCls}>客服人设提示词（System Prompt）</label>
              <textarea
                className={inputCls + " h-28 text-sm"}
                value={ai.systemPrompt}
                onChange={(e) => update("systemPrompt", e.target.value)}
                placeholder="定义 AI 客服的性格和回答风格..."
              />
            </div>
            <div>
              <label className={labelCls}>
                温度（Temperature）：{ai.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={ai.temperature}
                onChange={(e) => update("temperature", Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>精确</span>
                <span>创意</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI 留言审核 */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-medium text-gray-900">🛡️ AI 留言审核</h3>
          <label className="flex items-center gap-1 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={ai.moderationEnabled}
              onChange={(e) => update("moderationEnabled", e.target.checked)}
            />
            启用
          </label>
        </div>
        {ai.moderationEnabled && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 bg-blue-50 rounded-lg px-3 py-2">
              💡 开启后，访客留言将自动经过 AI 审核。违规留言自动拦截，并可通过邮件通知站长。
            </p>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={ai.autoApprove}
                  onChange={(e) => update("autoApprove", e.target.checked)}
                />
                无违规时自动通过（关闭则进入待审核）
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={ai.notifyOnViolation}
                  onChange={(e) => update("notifyOnViolation", e.target.checked)}
                />
                发现违规时邮件通知站长（需配置 SMTP）
              </label>
            </div>
            <div>
              <label className={labelCls}>审核提示词（可自定义审核规则）</label>
              <textarea
                className={inputCls + " h-28 text-xs font-mono"}
                value={ai.moderationPrompt}
                onChange={(e) => update("moderationPrompt", e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">
                AI 需返回 JSON：{"{"}violated, reason, category{"}"}
              </p>
            </div>
          </div>
        )}
      </div>

      <button onClick={() => save("ai", ai)} disabled={saving} className={btnCls}>
        {saving ? "保存中..." : "保存 AI 配置"}
      </button>
    </div>
  );
}