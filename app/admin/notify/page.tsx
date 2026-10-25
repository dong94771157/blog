"use client";

import { useEffect, useState } from "react";
import type { NotifySettings } from "@/lib/types";

const inputCls =
  "w-full border border-pink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";
const btnCls =
  "bg-gradient-to-r from-pink-500 to-purple-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50";

export default function NotifyPage() {
  const [notify, setNotify] = useState<NotifySettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings?type=notify")
      .then((r) => r.json())
      .then((d) => setNotify(d.settings));
  }, []);

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  async function save() {
    if (!notify) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings?type=notify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notify),
      });
      if (res.ok) {
        const d = await res.json();
        setNotify(d.settings);
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

  function updateSmtp(key: keyof NotifySettings["smtp"], value: string | number | boolean) {
    setNotify({ ...notify!, smtp: { ...notify!.smtp, [key]: value } });
  }
  function updateFeishu(key: keyof NotifySettings["feishu"], value: string | boolean) {
    setNotify({ ...notify!, feishu: { ...notify!.feishu, [key]: value } });
  }
  function updateWecom(key: keyof NotifySettings["wecom"], value: string | boolean) {
    setNotify({ ...notify!, wecom: { ...notify!.wecom, [key]: value } });
  }
  function updateTelegram(key: keyof NotifySettings["telegram"], value: string | boolean) {
    setNotify({ ...notify!, telegram: { ...notify!.telegram, [key]: value } });
  }

  if (!notify) {
    return <div className="text-center py-20 text-pink-300 text-lg">加载中...</div>;
  }

  const testBtn = (channel: string) => (
    <button
      onClick={() => testNotify(channel)}
      disabled={testing === channel}
      className="text-xs text-pink-600 hover:text-pink-800 border border-pink-300 rounded px-2.5 py-1 disabled:opacity-50 hover:bg-pink-50 transition-colors"
    >
      {testing === channel ? "发送中..." : "发送测试"}
    </button>
  );

  const enabledCount = [
    notify.smtp.enabled,
    notify.feishu.enabled,
    notify.wecom.enabled,
    notify.telegram.enabled,
  ].filter(Boolean).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pink-600">通知管理</h1>
        <p className="text-sm text-pink-400 mt-1">
          配置站内消息推送渠道，用于留言违规警告、订单通知等 · 已启用 {enabledCount} 个渠道
        </p>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-pink-50 text-pink-700 text-sm border border-pink-100">
          {message}
        </div>
      )}

      <div className="space-y-5">
        {/* SMTP 邮件 */}
        <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">📧</span>
              <h3 className="font-medium text-gray-800">邮件通知（SMTP）</h3>
              <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-pink-500"
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
                <label className={labelCls}>收件人（站长邮箱）</label>
                <input className={inputCls} value={notify.smtp.to} onChange={(e) => updateSmtp("to", e.target.value)} placeholder="多个用逗号分隔" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="accent-pink-500"
                    checked={notify.smtp.secure}
                    onChange={(e) => updateSmtp("secure", e.target.checked)}
                  />
                  启用 SSL（465 端口勾选，587 端口不勾）
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 飞书 */}
        <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🐦</span>
              <h3 className="font-medium text-gray-800">飞书机器人</h3>
              <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-pink-500"
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
                <input className={inputCls} value={notify.feishu.webhook} onChange={(e) => updateFeishu("webhook", e.target.value)} placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..." />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>加签密钥（可选）</label>
                <input className={inputCls} value={notify.feishu.secret} onChange={(e) => updateFeishu("secret", e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* 企业微信 */}
        <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">💬</span>
              <h3 className="font-medium text-gray-800">企业微信机器人</h3>
              <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-pink-500"
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
              <input className={inputCls} value={notify.wecom.webhook} onChange={(e) => updateWecom("webhook", e.target.value)} placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..." />
            </div>
          )}
        </div>

        {/* Telegram */}
        <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">✈️</span>
              <h3 className="font-medium text-gray-800">Telegram</h3>
              <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-pink-500"
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
                <input className={inputCls} value={notify.telegram.botToken} onChange={(e) => updateTelegram("botToken", e.target.value)} placeholder="123456:ABC-DEF..." />
              </div>
              <div>
                <label className={labelCls}>Chat ID</label>
                <input className={inputCls} value={notify.telegram.chatId} onChange={(e) => updateTelegram("chatId", e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>

      <button onClick={save} disabled={saving} className={`mt-6 ${btnCls}`}>
        {saving ? "保存中..." : "保存通知配置"}
      </button>
    </div>
  );
}