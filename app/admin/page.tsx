"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Post, Category } from "@/lib/types";

export default function AdminHomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    try {
      const [postsRes, catRes] = await Promise.all([
        fetch("/api/posts?all=1"),
        fetch("/api/categories"),
      ]);
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`确定删除《${title}》吗？此操作不可恢复。`)) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert("删除失败");
    }
  }

  async function handleTogglePublish(post: Post) {
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === post.id ? data.post : p)));
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-pink-300 text-lg">加载中...</div>
    );
  }

  const publishedCount = posts.filter((p) => p.published).length;
  const paidCount = posts.filter((p) => p.paid).length;

  return (
    <div>
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-pink-600">文章管理</h1>
          <p className="text-sm text-pink-400 mt-1">
            共 {posts.length} 篇 · 已发布 {publishedCount} 篇 · 付费 {paidCount} 篇
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-pink-200 hover:shadow-pink-300 hover:from-pink-600 hover:to-purple-600 transition-all"
        >
          ✏️ 新建文章
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-white/60 rounded-3xl border border-pink-100">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-lg text-pink-400">还没有文章</p>
          <Link
            href="/admin/posts/new"
            className="mt-4 inline-block text-pink-500 hover:text-pink-600 underline"
          >
            写第一篇文章 →
          </Link>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl overflow-hidden shadow-lg shadow-pink-100">
          <table className="w-full text-sm">
            <thead className="bg-pink-50/80 border-b border-pink-100">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-pink-600">标题</th>
                <th className="text-left px-4 py-3.5 font-semibold text-pink-600 w-24">状态</th>
                <th className="text-left px-4 py-3.5 font-semibold text-pink-600 w-44">创建时间</th>
                <th className="text-left px-4 py-3.5 font-semibold text-pink-600 w-48">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-pink-50 last:border-0 hover:bg-pink-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="text-gray-800 hover:text-pink-600 font-medium transition-colors"
                      target="_blank"
                    >
                      {post.title}
                    </Link>
                    <div className="text-xs text-gray-400 mt-0.5">
                      /{post.slug}
                      {post.paid && (
                        <span className="ml-2 inline-block bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-xs">
                          🔒 ¥{post.price}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {post.published ? (
                      <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-full text-xs font-medium">
                        ● 已发布
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-xs font-medium">
                        ○ 草稿
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">
                    {new Date(post.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-3 text-xs">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="text-pink-500 hover:text-pink-700 font-medium"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(post)}
                        className="text-purple-400 hover:text-purple-600 font-medium"
                      >
                        {post.published ? "转草稿" : "发布"}
                      </button>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="text-red-400 hover:text-red-600 font-medium"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}