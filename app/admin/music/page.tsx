"use client";

import { useEffect, useState } from "react";
import type { MusicSettings } from "@/lib/types";
import { defaultMusicSettings } from "@/lib/types";

const inputCls =
  "w-full border border-pink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

export default function MusicPage() {
  const [music, setMusic] = useState<MusicSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings?type=music")
      .then((r) => r.json())
      .then((d) => setMusic(d.settings || defaultMusicSettings))
      .catch(() => setMusic(defaultMusicSettings));
  }, []);

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  function update<K extends keyof MusicSettings>(key: K, value: MusicSettings[K]) {
    setMusic((m) => (m ? { ...m, [key]: value } : m));
  }
  function updateNetease(key: keyof MusicSettings["netease"], value: string | number) {
    setMusic((m) => (m ? { ...m, netease: { ...m.netease, [key]: value } } : m));
  }
  function updateCustom(key: keyof MusicSettings["custom"], value: string) {
    setMusic((m) => (m ? { ...m, custom: { ...m.custom, [key]: value } } : m));
  }

  async function handleSave() {
    if (!music) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings?type=music", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(music),
      });
      if (res.ok) {
        const d = await res.json();
        setMusic(d.settings);
        flash("✅ 音乐配置已保存");
      } else {
        flash("❌ 保存失败，请重试");
      }
    } catch {
      flash("❌ 网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!music?.custom.listUrl) {
      setTestResult({ ok: false, msg: "请先填写歌曲列表接口 URL" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(music.custom.listUrl);
      if (!res.ok) {
        setTestResult({ ok: false, msg: `接口返回 HTTP ${res.status} ${res.statusText}` });
        return;
      }
      const data = await res.json();
      const songs = Array.isArray(data) ? data : data.songs || data.list || [];
      if (Array.isArray(songs) && songs.length > 0) {
        const s = songs[0];
        const hasFields = s.id !== undefined && s.name !== undefined;
        setTestResult({
          ok: true,
          msg: `连接成功，获取到 ${songs.length} 首歌曲` + (hasFields ? `，首曲：${s.name} - ${s.artist || "未知"}` : "（注意：字段格式可能不匹配，需要 id / name 字段）"),
        });
      } else {
        setTestResult({ ok: false, msg: "接口返回数据中未找到歌曲列表（需要 songs / list / 数组格式）" });
      }
    } catch (e) {
      setTestResult({
        ok: false,
        msg: `请求失败：${e instanceof Error ? e.message : "未知错误"}（浏览器直连可能跨域受限，实际播放走服务端代理不受影响）`,
      });
    } finally {
      setTesting(false);
    }
  }

  if (!music) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <span className="w-10 h-10 border-[3px] border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        <span className="text-pink-400 text-sm">加载音乐配置...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          🎵 音乐接口配置
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          配置前台音乐播放器的数据源，支持网易云音乐搜索或自定义接口
        </p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`rounded-lg px-4 py-2.5 text-sm font-medium border ${
            message.startsWith("✅")
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-600 border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* 音乐源设置 */}
      <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎵</span>
            <h3 className="font-medium text-gray-800">播放器开关与音乐源</h3>
          </div>
          <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              className="accent-pink-500 w-4 h-4"
              checked={music.enabled}
              onChange={(e) => update("enabled", e.target.checked)}
            />
            启用播放器
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>音乐源</label>
            <select
              className={inputCls}
              value={music.source}
              onChange={(e) => update("source", e.target.value as MusicSettings["source"])}
            >
              <option value="netease">网易云音乐（默认）</option>
              <option value="custom">自定义接口</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>显示名称</label>
            <input
              className={inputCls}
              value={music.label}
              onChange={(e) => update("label", e.target.value)}
              placeholder="在线音乐 · 网易云"
            />
            <p className="text-xs text-gray-400 mt-1">显示在播放器条与歌曲列表标题</p>
          </div>
        </div>
      </div>

      {/* 网易云参数 */}
      {music.source === "netease" && (
        <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">🔍</span>
            <h3 className="font-medium text-gray-800">网易云参数</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>搜索关键词</label>
              <input
                className={inputCls}
                value={music.netease.keyword}
                onChange={(e) => updateNetease("keyword", e.target.value)}
                placeholder="伤感"
              />
              <p className="text-xs text-gray-400 mt-1">用于搜索网易云歌曲，留空则使用默认列表</p>
            </div>
            <div>
              <label className={labelCls}>每批数量</label>
              <input
                type="number"
                min="5"
                max="100"
                className={inputCls}
                value={music.netease.limit}
                onChange={(e) => updateNetease("limit", Number(e.target.value) || 50)}
              />
              <p className="text-xs text-gray-400 mt-1">每次搜索返回的歌曲数量（5-100）</p>
            </div>
          </div>
        </div>
      )}

      {/* 自定义接口 */}
      {music.source === "custom" && (
        <div className="bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔌</span>
            <h3 className="font-medium text-gray-800">自定义接口</h3>
          </div>
          <div>
            <label className={labelCls}>歌曲列表接口 URL</label>
            <input
              className={inputCls + " font-mono"}
              value={music.custom.listUrl}
              onChange={(e) => updateCustom("listUrl", e.target.value)}
              placeholder="https://api.example.com/songs?genre=sad"
            />
            <p className="text-xs text-gray-400 mt-1">
              必须返回 JSON：<code className="bg-pink-50 px-1 rounded">{'{ songs: [{ id, name, artist, album, picUrl, duration }]'}</code>
              ，或数组 / <code className="bg-pink-50 px-1 rounded">{'{ list: [...] }'}</code>
            </p>
          </div>
          <div>
            <label className={labelCls}>音频流地址模板</label>
            <input
              className={inputCls + " font-mono"}
              value={music.custom.streamUrl}
              onChange={(e) => updateCustom("streamUrl", e.target.value)}
              placeholder="https://music.example.com/{id}.mp3"
            />
            <p className="text-xs text-gray-400 mt-1">
              使用 <code className="bg-pink-50 px-1 rounded">{"{id}"}</code> 作为歌曲 id 占位符，播放时通过服务端代理绕过防盗链
            </p>
          </div>

          {/* 测试连接 */}
          <div className="pt-2 border-t border-pink-100">
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100 disabled:opacity-50 transition-colors"
            >
              {testing ? "测试中..." : "🔍 测试列表接口"}
            </button>
            {testResult && (
              <div
                className={`mt-3 rounded-lg px-3.5 py-2.5 text-xs border ${
                  testResult.ok
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {testResult.ok ? "✅ " : "⚠️ "}
                {testResult.msg}
              </div>
            )}
          </div>

          <div className="bg-amber-50/60 rounded-lg px-3 py-2 text-xs text-amber-700 border border-amber-100">
            💡 自定义接口支持：listUrl 返回 JSON（songs / list / 数组）；streamUrl 支持任意 http(s) 地址，由服务端代理转发（支持 Range 分段加载）
          </div>
        </div>
      )}

      {/* 保存 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md shadow-pink-200"
        >
          {saving ? "保存中..." : "💾 保存音乐配置"}
        </button>
        <span className="text-xs text-gray-400">保存后前台播放器将使用新配置</span>
      </div>
    </div>
  );
}