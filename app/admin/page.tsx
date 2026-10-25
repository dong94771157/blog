"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Post } from "@/lib/types";

export default function AdminHomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts?all=1");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
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
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">文章管理</h1>
        <Link
          href="/admin/posts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + 新建文章
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">还没有文章</p>
          <Link
            href="/admin/posts/new"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 underline"
          >
            写第一篇文章 →
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">标题</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-44">创建时间</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-48">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="text-gray-900 hover:text-blue-600 font-medium"
                      target="_blank"
                    >
                      {post.title}
                    </Link>
                    <div className="text-xs text-gray-400 mt-0.5">
                      /{post.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {post.published ? (
                      <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs">
                        已发布
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs">
                        草稿
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(post.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(post)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {post.published ? "转为草稿" : "发布"}
                      </button>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="text-red-500 hover:text-red-700"
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