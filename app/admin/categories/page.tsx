"use client";

import { useEffect, useState, useCallback } from "react";
import type { Category } from "@/lib/types";

const COLORS = [
  "#ec4899", "#f43f5e", "#8b5cf6", "#6366f1",
  "#3b82f6", "#06b6d4", "#10b981", "#f59e0b",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  // 表单
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setDescription("");
    setColor(COLORS[0]);
    setError("");
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setColor(cat.color);
    setError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("分类名称不能为空");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = { name, slug, description, color };
      const res = editing
        ? await fetch(`/api/categories/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (res.ok) {
        setShowForm(false);
        await load();
      } else {
        const data = await res.json();
        setError(data.error || "保存失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`确定删除分类「${cat.name}」吗？该分类下的文章将变为未分类。`)) return;
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    if (res.ok) {
      await load();
    } else {
      alert("删除失败");
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + 新建分类
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="font-medium text-gray-900 mb-4">
            {editing ? "编辑分类" : "新建分类"}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类名称 <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：技术分享"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL 路径（slug）
                </label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="留空则自动生成"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="分类描述（可选）"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签颜色
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      color === c ? "border-gray-800 scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">还没有分类</p>
          <button
            onClick={openCreate}
            className="mt-4 text-blue-600 hover:text-blue-800 underline"
          >
            创建第一个分类 →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border rounded-xl p-4 flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-gray-900">{cat.name}</span>
                </div>
                <div className="text-xs text-gray-400">/{cat.slug}</div>
                {cat.description && (
                  <div className="text-sm text-gray-500 mt-1">{cat.description}</div>
                )}
              </div>
              <div className="flex gap-2 text-xs shrink-0">
                <button
                  onClick={() => openEdit(cat)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}