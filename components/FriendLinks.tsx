"use client";

import { useState } from "react";
import type { FriendLink } from "@/lib/types";

export default function FriendLinks({
  links,
  siteName,
}: {
  links: FriendLink[];
  siteName: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    url: "",
    logo: "",
    desc: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/friend-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "申请已提交，等待站长审核~" });
        setForm({ name: "", url: "", logo: "", desc: "" });
        setTimeout(() => {
          setShowForm(false);
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.error || "提交失败" });
      }
    } catch {
      setMessage({ type: "error", text: "网络错误，请稍后重试" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
          <span>🔗</span> 友情链接
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-pink-500 hover:text-pink-600 font-medium px-2 py-1 rounded-lg hover:bg-pink-50 transition-colors"
        >
          {showForm ? "收起" : "+ 申请友链"}
        </button>
      </div>

      {/* 申请表单 */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 p-3 bg-pink-50/50 rounded-xl border border-pink-100 space-y-2.5"
        >
          <div>
            <input
              type="text"
              placeholder="站点名称 *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={30}
              className="w-full px-3 py-2 text-xs rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400 bg-white/80"
            />
          </div>
          <div>
            <input
              type="url"
              placeholder="站点地址 https:// *"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400 bg-white/80"
            />
          </div>
          <div>
            <input
              type="url"
              placeholder="Logo 地址（可选）"
              value={form.logo}
              onChange={(e) => setForm({ ...form, logo: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400 bg-white/80"
            />
          </div>
          <div>
            <textarea
              placeholder="站点简介（可选，最多 100 字）"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              maxLength={100}
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400 bg-white/80 resize-none"
            />
          </div>
          {message && (
            <p
              className={`text-xs ${
                message.type === "success" ? "text-green-600" : "text-red-500"
              }`}
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-lg bg-pink-500 text-white text-xs font-medium hover:bg-pink-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? "提交中..." : "提交申请"}
          </button>
          <p className="text-[10px] text-gray-400 text-center">
            本站名称：{siteName}，申请时请先添加本站链接
          </p>
        </form>
      )}

      {/* 友链列表 */}
      {links.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">
          暂无友链，快来申请第一个吧~
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 p-2.5 rounded-xl border border-pink-100 bg-white/60 hover:bg-pink-50 hover:border-pink-200 transition-all"
            >
              {link.logo ? (
                <img
                  src={link.logo}
                  alt={link.name}
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-pink-100"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-xs font-bold text-pink-600 flex-shrink-0">
                  {link.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-700 truncate group-hover:text-pink-600 transition-colors">
                  {link.name}
                </p>
                {link.desc && (
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {link.desc}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}