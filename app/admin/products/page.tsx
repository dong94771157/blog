"use client";

import { useEffect, useState } from "react";
import type { ProductPromo } from "@/lib/types";

const EMPTY_FORM = {
  title: "",
  desc: "",
  image: "",
  url: "",
  price: "",
  badge: "",
  sort: 0,
  enabled: true,
};

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<ProductPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/products?all=1")
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(p: ProductPromo) {
    setForm({
      title: p.title,
      desc: p.desc,
      image: p.image,
      url: p.url,
      price: p.price,
      badge: p.badge,
      sort: p.sort,
      enabled: p.enabled,
    });
    setEditingId(p.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const isEdit = !!editingId;
      const res = await fetch(isEdit ? `/api/products/${editingId}` : "/api/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        if (isEdit) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingId ? { ...p, ...form } : p))
          );
        } else {
          setProducts((prev) => [...prev, data.product]);
        }
        resetForm();
      } else {
        alert(data.error || "操作失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除该推荐产品？")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-pink-300 text-lg">加载中...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-pink-600">产品推荐</h1>
          <p className="text-sm text-pink-400 mt-1">
            共 {products.length} 个 · 启用 {products.filter((p) => p.enabled).length} 个
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 rounded-xl bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 transition-colors shadow-md shadow-pink-200"
        >
          + 新增推荐
        </button>
      </div>

      {/* 表单 */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-5 bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl shadow-sm space-y-3"
        >
          <h2 className="text-sm font-bold text-pink-600">
            {editingId ? "编辑推荐" : "新增推荐"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">标题 *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                maxLength={50}
                className="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">链接 *</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                required
                placeholder="https://"
                className="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">图片地址</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://"
                className="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">价格</label>
              <input
                type="text"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="如 ¥99 或 免费"
                maxLength={20}
                className="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">角标</label>
              <input
                type="text"
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="如 热门 / 新品"
                maxLength={10}
                className="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">排序（数字越小越靠前）</label>
              <input
                type="number"
                value={form.sort}
                onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">描述</label>
            <textarea
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              maxLength={200}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400 resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="w-4 h-4 accent-pink-500"
            />
            启用（前台展示）
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? "保存中..." : editingId ? "保存修改" : "添加"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {/* 列表 */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-white/60 rounded-3xl border border-pink-100">
          <div className="text-4xl mb-3">✨</div>
          <p className="text-pink-400">暂无推荐产品</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...products]
            .sort((a, b) => (a.sort || 0) - (b.sort || 0))
            .map((p) => (
              <div
                key={p.id}
                className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex gap-4">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-16 h-16 rounded-xl object-cover border border-pink-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-2xl flex-shrink-0">
                      ✨
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-700">{p.title}</span>
                      {p.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 font-medium">
                          {p.badge}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          p.enabled
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {p.enabled ? "● 已启用" : "○ 已停用"}
                      </span>
                      <span className="text-[10px] text-gray-400">排序: {p.sort}</span>
                    </div>
                    {p.desc && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.desc}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {p.price && (
                        <span className="text-xs font-bold text-pink-500">{p.price}</span>
                      )}
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-pink-400 hover:text-pink-600 truncate"
                      >
                        {p.url}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-pink-50">
                  <button
                    onClick={() => handleToggle(p.id, !p.enabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      p.enabled
                        ? "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"
                        : "bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                    }`}
                  >
                    {p.enabled ? "⏸ 停用" : "▶ 启用"}
                  </button>
                  <button
                    onClick={() => startEdit(p)}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-medium hover:bg-sky-100 transition-colors border border-sky-200"
                  >
                    ✏️ 编辑
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors border border-red-200"
                  >
                    🗑 删除
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}