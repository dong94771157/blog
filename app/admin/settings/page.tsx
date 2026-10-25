"use client";

import { useEffect, useState } from "react";
import type { SiteSettings, AISettings, AdminSettings } from "@/lib/types";

type Tab = "site" | "ai" | "admin";

const inputCls =
  "w-full border border-pink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";
const btnCls =
  "bg-gradient-to-r from-pink-500 to-purple-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("site");
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [ai, setAi] = useState<AISettings | null>(null);
  const [admin, setAdmin] = useState<AdminSettings | null>(null);
  const [adminUsername, setAdminUsername] = useState("admin");
  const [hasCustomCred, setHasCustomCred] = useState(false);
  const [credUpdatedAt, setCredUpdatedAt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const [s, a, ad] = await Promise.all([
        fetch("/api/settings?type=site").then((r) => r.json()),
        fetch("/api/settings?type=ai").then((r) => r.json()),
        fetch("/api/settings?type=admin").then((r) => r.json()),
      ]);
      setSite(s.settings);
      setAi(a.settings);
      setAdmin(ad.settings);
      setAdminUsername(ad.adminUsername || "admin");
      setHasCustomCred(!!ad.hasCustomCred);
      setCredUpdatedAt(ad.credUpdatedAt || 0);
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
        if (type === "ai") setAi(d.settings);
        if (type === "admin") setAdmin(d.settings);
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

  if (!site || !ai || !admin) {
    return <div className="text-center py-20 text-pink-300 text-lg">加载中...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pink-600">系统设置</h1>
        <p className="text-sm text-pink-400 mt-1">网站信息、功能开关、AI 配置与后台管理</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(
          [
            ["site", "网站信息"],
            ["ai", "AI 配置"],
            ["admin", "后台管理"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? "bg-pink-500 text-white shadow-md shadow-pink-200"
                : "bg-white/60 text-pink-500 border border-pink-200 hover:bg-pink-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-pink-50 text-pink-700 text-sm border border-pink-100">
          {message}
        </div>
      )}

      {tab === "site" && <SiteForm site={site} setSite={setSite} save={save} saving={saving} />}
      {tab === "ai" && <AIForm ai={ai} setAi={setAi} save={save} saving={saving} />}
      {tab === "admin" && (
        <AdminForm
          admin={admin}
          setAdmin={setAdmin}
          save={save}
          saving={saving}
          adminUsername={adminUsername}
          hasCustomCred={hasCustomCred}
          credUpdatedAt={credUpdatedAt}
          onPasswordChanged={(u) => {
            setAdminUsername(u);
            setHasCustomCred(true);
            setCredUpdatedAt(Date.now());
          }}
        />
      )}
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
    <div className="space-y-5">
      {/* 基本信息 */}
      <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🏠</span>
          <h3 className="font-medium text-gray-800">基本信息</h3>
        </div>
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
          <div className="md:col-span-2">
            <label className={labelCls}>网站描述</label>
            <input className={inputCls} value={site.description} onChange={(e) => update("description", e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">显示在首页 Hero 区域和搜索引擎描述中</p>
          </div>
          <div>
            <label className={labelCls}>ICP 备案号</label>
            <input className={inputCls} value={site.icp} onChange={(e) => update("icp", e.target.value)} placeholder="京ICP备xxxxxxxx号" />
          </div>
        </div>
      </div>

      {/* SEO 与作者 */}
      <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🔍</span>
          <h3 className="font-medium text-gray-800">SEO 与作者</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>站长/作者名</label>
            <input className={inputCls} value={site.author} onChange={(e) => update("author", e.target.value)} placeholder="你的昵称" />
            <p className="text-xs text-gray-400 mt-1">写入页面 meta authors 信息</p>
          </div>
          <div>
            <label className={labelCls}>SEO 关键词</label>
            <input className={inputCls} value={site.keywords} onChange={(e) => update("keywords", e.target.value)} placeholder="博客,技术,教程" />
            <p className="text-xs text-gray-400 mt-1">多个关键词用英文逗号分隔</p>
          </div>
        </div>
      </div>

      {/* 站长挂件 */}
      <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🧑</span>
          <h3 className="font-medium text-gray-800">站长挂件</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          显示在首页侧边栏的站长信息卡片，含头像、简介、社交链接和音乐入口
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>头像 URL</label>
            <input className={inputCls} value={site.avatarUrl} onChange={(e) => update("avatarUrl", e.target.value)} placeholder="https://... 留空使用默认伤感男孩头像" />
          </div>
          <div>
            <label className={labelCls}>站长简介</label>
            <input className={inputCls} value={site.ownerBio} onChange={(e) => update("ownerBio", e.target.value)} placeholder="一句话介绍自己" />
          </div>
        </div>
      </div>

      {/* 功能开关 */}
      <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🎛️</span>
          <h3 className="font-medium text-gray-800">功能开关</h3>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="accent-pink-500"
              checked={site.commentEnabled}
              onChange={(e) => update("commentEnabled", e.target.checked)}
            />
            开启留言功能（关闭后文章页无法发表留言）
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="accent-pink-500"
              checked={site.registrationEnabled}
              onChange={(e) => update("registrationEnabled", e.target.checked)}
            />
            开启读者注册（关闭后新用户无法注册账号）
          </label>
        </div>
      </div>

      {/* 页脚配置 */}
      <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">📝</span>
          <h3 className="font-medium text-gray-800">页脚配置</h3>
        </div>
        <div>
          <label className={labelCls}>自定义页脚文案</label>
          <textarea
            className={inputCls + " h-16"}
            value={site.footerText}
            onChange={(e) => update("footerText", e.target.value)}
            placeholder="留空则显示默认的 Powered by 信息"
          />
        </div>
      </div>

      {/* 联系方式 */}
      <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">📮</span>
          <h3 className="font-medium text-gray-800">联系方式</h3>
        </div>
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
          <div>
            <label className={labelCls}>B站</label>
            <input className={inputCls} value={site.contact.bilibili} onChange={(e) => updateContact("bilibili", e.target.value)} placeholder="UID 或完整空间地址" />
          </div>
        </div>
      </div>

      <button onClick={() => save("site", site)} disabled={saving} className={btnCls}>
        {saving ? "保存中..." : "保存网站信息"}
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
    <div className="space-y-5">
      {/* AI 客服 */}
      <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🤖</span>
          <h3 className="font-medium text-gray-800">AI 客服助手</h3>
          <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              className="accent-pink-500"
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
                <p className="text-xs text-gray-400 mt-1">所有接口均兼容 OpenAI 格式</p>
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
                className="w-full accent-pink-500"
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
      <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🛡️</span>
          <h3 className="font-medium text-gray-800">AI 留言审核</h3>
          <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              className="accent-pink-500"
              checked={ai.moderationEnabled}
              onChange={(e) => update("moderationEnabled", e.target.checked)}
            />
            启用
          </label>
        </div>
        {ai.moderationEnabled && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 bg-pink-50 rounded-lg px-3 py-2 border border-pink-100">
              💡 开启后，访客留言将自动经过 AI 审核。违规留言自动拦截，并可通过邮件通知站长。
            </p>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="accent-pink-500"
                  checked={ai.autoApprove}
                  onChange={(e) => update("autoApprove", e.target.checked)}
                />
                无违规时自动通过（关闭则进入待审核）
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="accent-pink-500"
                  checked={ai.notifyOnViolation}
                  onChange={(e) => update("notifyOnViolation", e.target.checked)}
                />
                发现违规时邮件通知站长（需在「通知管理」中配置 SMTP）
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
                AI 需返回 JSON：{"{"}violated, reason, category{"}"}，AI 不可用时自动降级为关键词匹配
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

// ---- 后台管理表单 ----
function AdminForm({
  admin,
  setAdmin,
  save,
  saving,
  adminUsername,
  hasCustomCred,
  credUpdatedAt,
  onPasswordChanged,
}: {
  admin: AdminSettings;
  setAdmin: (a: AdminSettings) => void;
  save: (type: Tab, data: unknown) => void;
  saving: boolean;
  adminUsername: string;
  hasCustomCred: boolean;
  credUpdatedAt: number;
  onPasswordChanged: (username: string) => void;
}) {
  // 后台外观
  function update<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setAdmin({ ...admin, [key]: value });
  }

  // 修改密码状态
  const [oldPassword, setOldPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changing, setChanging] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    setPwdMsg("");

    if (!oldPassword || !newPassword) {
      setPwdError("请填写当前密码和新密码");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("新密码至少 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("两次输入的新密码不一致");
      return;
    }

    setChanging(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newUsername, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg(data.message || "密码修改成功");
        onPasswordChanged(data.username || newUsername || adminUsername);
        setOldPassword("");
        setNewUsername("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwdError(data.error || "修改失败");
      }
    } catch {
      setPwdError("网络错误");
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* 后台外观设置 */}
      <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🎨</span>
          <h3 className="font-medium text-gray-800">后台外观</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          自定义后台侧边栏与登录页显示的名称、Logo 和欢迎语
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>后台名称</label>
            <input
              className={inputCls}
              value={admin.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="如：我的小窝后台"
            />
            <p className="text-xs text-gray-400 mt-1">显示在侧边栏品牌区与登录页标题</p>
          </div>
          <div>
            <label className={labelCls}>后台 Logo URL</label>
            <input
              className={inputCls}
              value={admin.logo}
              onChange={(e) => update("logo", e.target.value)}
              placeholder="https://... 留空显示默认 ✿ 图标"
            />
            <p className="text-xs text-gray-400 mt-1">建议正方形图片，显示为圆角图标</p>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>登录页欢迎语</label>
            <input
              className={inputCls}
              value={admin.welcomeText}
              onChange={(e) => update("welcomeText", e.target.value)}
              placeholder="留空显示默认欢迎语"
            />
          </div>
        </div>
        {/* Logo 预览 */}
        {admin.logo && (
          <div className="mt-4 flex items-center gap-3 bg-pink-50/60 rounded-xl p-3 border border-pink-100">
            <span className="text-xs text-gray-400">预览：</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={admin.logo}
              alt="logo 预览"
              className="w-10 h-10 rounded-xl object-cover border border-pink-100"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
            <span className="text-sm font-medium text-pink-600">{admin.title || "后台管理"}</span>
          </div>
        )}
      </div>

      <button onClick={() => save("admin", admin)} disabled={saving} className={btnCls}>
        {saving ? "保存中..." : "保存后台外观"}
      </button>

      {/* 修改管理密码 */}
      <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🔐</span>
          <h3 className="font-medium text-gray-800">修改管理密码</h3>
        </div>

        {/* 当前状态 */}
        <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="text-gray-500">
            当前用户名：
            <span className="font-semibold text-amber-700 ml-1">{adminUsername}</span>
          </span>
          <span className="text-gray-500">
            密码来源：
            <span className={`font-semibold ml-1 ${hasCustomCred ? "text-green-600" : "text-amber-600"}`}>
              {hasCustomCred ? "自定义密码（已修改）" : "环境变量默认密码"}
            </span>
          </span>
          {hasCustomCred && credUpdatedAt > 0 && (
            <span className="text-gray-400">
              最后修改：{new Date(credUpdatedAt).toLocaleString("zh-CN")}
            </span>
          )}
        </div>

        {!hasCustomCred && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100 mb-4">
            💡 当前使用环境变量（ADMIN_USERNAME / ADMIN_PASSWORD）中的默认密码，建议在此修改为自定义密码以增强安全性。修改后将以 KV 存储的凭据为准。
          </p>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          {pwdError && (
            <div className="bg-red-50 text-red-500 text-sm px-3 py-2 rounded-lg border border-red-100">
              ⚠️ {pwdError}
            </div>
          )}
          {pwdMsg && (
            <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg border border-green-100">
              ✓ {pwdMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>当前密码 *</label>
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  className={inputCls + " pr-10"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="输入当前密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 text-sm"
                >
                  {showOld ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>新用户名（可选）</label>
              <input
                className={inputCls}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={`留空保持「${adminUsername}」不变`}
              />
            </div>
            <div>
              <label className={labelCls}>新密码 *</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  className={inputCls + " pr-10"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少 6 位"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 text-sm"
                >
                  {showNew ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>确认新密码 *</label>
              <input
                type={showNew ? "text" : "password"}
                className={inputCls}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changing}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md shadow-amber-100"
          >
            {changing ? "修改中..." : "确认修改"}
          </button>
        </form>
      </div>
    </div>
  );
}