"use client";

import { useEffect, useState } from "react";
import type { FriendLink } from "@/lib/types";

export default function FriendsAdminPage() {
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [editing, setEditing] = useState<FriendLink | null>(null);
  const [editForm, setEditForm] = useState({ name: "", url: "", logo: "", desc: "" });

  useEffect(() => {
    fetch("/api/friend-links?all=1")
      .then((res) => (res.ok ? res.json() : { links: [] }))
      .then((data) => setLinks(data.links || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleStatus(id: string, status: FriendLink["status"]) {
    const res = await fetch(`/api/friend-links/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除该友链？")) return;
    const res = await fetch(`/api/friend-links/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLinks((prev) => prev.filter((l) => l.id !== id));
    }
  }

  function startEdit(link: FriendLink) {
    setEditing(link);
    setEditForm({ name: link.name, url: link.url, logo: link.logo, desc: link.desc });
  }

  async function handleSaveEdit() {
    if (!editing) return;
    const res = await fetch(`/api/friend-links/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setLinks((prev) =>
        prev.map((l) => (l.id === editing.id ? { ...l, ...editForm } : l))
      );
      setEditing(null);
    }
  }

  const filtered = links.filter((l) => filter === "all" || l.status === filter);
  const pendingCount = links.filter((l) => l.status === "pending").length;
  const approvedCount = links.filter((l) => l.status === "approved").length;
  const rejectedCount = links.filter((l) => l.status === "rejected").length;

  if (loading) {
    return <div className="text-center py-20 text-pink-300 text-lg">加载中...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pink-600">友链管理</h1>
        <p className="text-sm text-pink-400 mt-1">
          共 {links.length} 条 · 待审 {pendingCount} · 已通过 {approvedCount} · 已拒绝 {rejectedCount}
        </p>
      </div>

      {/* 筛选 */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(
          [
            ["all", "全部"],
            ["pending", "待审核"],
            ["approved", "已通过"],
            ["rejected", "已拒绝"],
          ] as const
        ).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === val
                ? "bg-pink-500 text-white shadow-md shadow-pink-200"
                : "bg-white/60 text-pink-500 border border-pink-200 hover:bg-pink-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/60 rounded-3xl border border-pink-100">
          <div className="text-4xl mb-3">🔗</div>
          <p className="text-pink-400">暂无友链</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((link) => (
            <div
              key={link.id}
              className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {link.logo ? (
                  <img
                    src={link.logo}
                    alt={link.name}
                    className="w-10 h-10 rounded-xl object-cover border border-pink-100"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-sm font-bold text-pink-600">
                    {link.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-700">{link.name}</span>
                    {link.status === "approved" && (
                      <span className="bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full text-xs font-medium">● 已通过</span>
                    )}
                    {link.status === "pending" && (
                      <span className="bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full text-xs font-medium">○ 待审核</span>
                    )}
                    {link.status === "rejected" && (
                      <span className="bg-red-50 text-red-500 px-2.5 py-0.5 rounded-full text-xs font-medium">✕ 已拒绝</span>
                    )}
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-pink-400 hover:text-pink-600 truncate block"
                  >
                    {link.url}
                  </a>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(link.createdAt).toLocaleString("zh-CN")}
                </span>
              </div>

              {link.desc && (
                <p className="text-xs text-gray-500 bg-pink-50/30 rounded-xl px-4 py-2 mb-3">
                  {link.desc}
                </p>
              )}

              {/* 编辑表单 */}
              {editing?.id === link.id ? (
                <div className="space-y-2 p-3 bg-pink-50/50 rounded-xl border border-pink-100 mb-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="站点名称"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400"
                  />
                  <input
                    type="url"
                    value={editForm.url}
                    onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                    placeholder="站点地址"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400"
                  />
                  <input
                    type="url"
                    value={editForm.logo}
                    onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
                    placeholder="Logo 地址"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400"
                  />
                  <textarea
                    value={editForm.desc}
                    onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                    placeholder="站点简介"
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-1.5 rounded-lg bg-pink-500 text-white text-xs font-medium hover:bg-pink-600 transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {link.status !== "approved" && (
                    <button
                      onClick={() => handleStatus(link.id, "approved")}
                      className="px-4 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-medium hover:bg-green-100 transition-colors border border-green-200"
                    >
                      ✓ 通过
                    </button>
                  )}
                  {link.status !== "rejected" && (
                    <button
                      onClick={() => handleStatus(link.id, "rejected")}
                      className="px-4 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors border border-red-200"
                    >
                      ✕ 拒绝
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(link)}
                    className="px-4 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-medium hover:bg-sky-100 transition-colors border border-sky-200"
                  >
                    ✏️ 编辑
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="px-4 py-1.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    🗑 删除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}