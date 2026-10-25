"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";

interface PostEditorProps {
  post?: Post; // 有值则为编辑模式
}

export default function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const isEdit = Boolean(post);

  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [content, setContent] = useState(post?.content || "");
  const [tags, setTags] = useState(post?.tags.join(", ") || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("标题和内容不能为空");
      return;
    }

    setSaving(true);
    try {
      const body = { title, slug, content, excerpt, tags, published };
      const res = isEdit
        ? await fetch(`/api/posts/${post!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "保存失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="输入文章标题"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL 路径（slug）
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="留空则自动生成"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标签（逗号分隔）
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="如：技术, Next.js"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          摘要
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="留空则自动从内容提取"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          内容（Markdown）<span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={18}
          className="w-full border rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={"# 标题\n\n在这里使用 Markdown 编写文章内容...\n\n- 支持列表\n- 支持代码块\n\n```js\nconsole.log('Hello');\n```"}
          required
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded"
          />
          立即发布
        </label>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "保存中..." : isEdit ? "更新文章" : "保存文章"}
        </button>
      </div>
    </form>
  );
}