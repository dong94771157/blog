"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Post, Category, DownloadItem } from "@/lib/types";

interface PostEditorProps {
  post?: Post; // 有值则为编辑模式
}

// 生成简易 ID
function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const isEdit = Boolean(post);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [content, setContent] = useState(post?.content || "");
  const [tags, setTags] = useState(post?.tags.join(", ") || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [categoryId, setCategoryId] = useState(post?.categoryId || "");
  const [coverUrl, setCoverUrl] = useState(post?.coverUrl || "");
  const [paid, setPaid] = useState(post?.paid ?? false);
  const [price, setPrice] = useState(post?.price || 0);
  const [freeContent, setFreeContent] = useState(post?.freeContent || "");
  const [downloads, setDownloads] = useState<DownloadItem[]>(post?.downloads || []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  // Markdown 工具栏：在光标处插入/包裹文本
  function insertMarkdown(
    before: string,
    after: string = "",
    placeholder = ""
  ) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const newContent =
      content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newContent);
    // 恢复光标位置
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    });
  }

  function insertLine(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const newContent =
      content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + prefix.length;
    });
  }

  const TOOLS = [
    { label: "H1", title: "一级标题", action: () => insertLine("# ") },
    { label: "H2", title: "二级标题", action: () => insertLine("## ") },
    { label: "H3", title: "三级标题", action: () => insertLine("### ") },
    { label: "B", title: "加粗", action: () => insertMarkdown("**", "**", "粗体") },
    { label: "I", title: "斜体", action: () => insertMarkdown("*", "*", "斜体") },
    { label: "S", title: "删除线", action: () => insertMarkdown("~~", "~~", "删除线") },
    { label: "❝", title: "引用", action: () => insertLine("> ") },
    { label: "•", title: "无序列表", action: () => insertLine("- ") },
    { label: "1.", title: "有序列表", action: () => insertLine("1. ") },
    { label: "</>", title: "行内代码", action: () => insertMarkdown("`", "`", "code") },
    { label: "{}", title: "代码块", action: () => insertMarkdown("\n```\n", "\n```\n", "code here") },
    { label: "🔗", title: "链接", action: () => insertMarkdown("[", "](https://)", "链接文字") },
    { label: "🖼", title: "图片", action: () => insertMarkdown("![", "](https://)", "图片描述") },
    { label: "―", title: "分隔线", action: () => insertMarkdown("\n---\n", "", "") },
  ];

  // 下载管理
  function addDownload() {
    setDownloads((prev) => [
      ...prev,
      { id: genId(), name: "", url: "", size: "", platform: "Windows", version: "", note: "", paid: false, price: 0 },
    ]);
  }

  function updateDownload(id: string, field: keyof DownloadItem, value: string | number | boolean) {
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  }

  function removeDownload(id: string) {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("标题和内容不能为空");
      return;
    }
    if (paid && (!price || price <= 0)) {
      setError("开启付费阅读后请设置价格");
      return;
    }

    setSaving(true);
    try {
      const body = {
        title,
        slug,
        content,
        excerpt,
        tags,
        published,
        categoryId: categoryId || null,
        coverUrl,
        paid,
        price: paid ? price : 0,
        freeContent,
        downloads: downloads.filter((d) => d.name.trim() && d.url.trim()),
      };
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
        <div className="bg-red-50 text-red-500 text-sm px-4 py-2.5 rounded-xl border border-red-100 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-pink-600 mb-1.5">
          标题 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-pink-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-white/70 placeholder:text-pink-200 transition-all"
          placeholder="输入文章标题"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-pink-600 mb-1.5">
            URL 路径（slug）
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full border border-pink-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-white/70 placeholder:text-pink-200 transition-all"
            placeholder="留空则自动生成"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-pink-600 mb-1.5">
            分类
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-pink-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-white/70 transition-all"
          >
            <option value="">未分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-pink-600 mb-1.5">
            标签（逗号分隔）
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border border-pink-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-white/70 placeholder:text-pink-200 transition-all"
            placeholder="如：技术, Next.js"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-pink-600 mb-1.5">
            封面图 URL
          </label>
          <input
            type="text"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            className="w-full border border-pink-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-white/70 placeholder:text-pink-200 transition-all"
            placeholder="https://...（可选）"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-pink-600 mb-1.5">
          摘要
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          className="w-full border border-pink-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-white/70 placeholder:text-pink-200 transition-all"
          placeholder="留空则自动从内容提取"
        />
      </div>

      {/* Markdown 编辑器 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-pink-600">
            内容（Markdown）<span className="text-red-400">*</span>
          </label>
          <span className="text-xs text-pink-300">
            {content.length} 字
          </span>
        </div>
        {/* 工具栏 */}
        <div className="flex flex-wrap gap-1 border border-pink-200 border-b-0 rounded-t-xl bg-pink-50/60 px-2 py-1.5">
          {TOOLS.map((tool) => (
            <button
              key={tool.label}
              type="button"
              title={tool.title}
              onClick={tool.action}
              className="px-2 py-1 rounded-md text-xs font-mono font-bold text-pink-500 hover:bg-pink-200/60 hover:text-pink-700 transition-colors min-w-[28px]"
            >
              {tool.label}
            </button>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={18}
          className="w-full border border-pink-200 rounded-b-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-white/70 placeholder:text-pink-200 transition-all resize-y"
          placeholder={"# 标题\n\n在这里使用 Markdown 编写文章内容...\n\n- 支持列表\n- 支持代码块\n\n```js\nconsole.log('Hello');\n```"}
          required
        />
      </div>

      {/* 付费阅读设置 */}
      <div className="border border-amber-200 rounded-2xl p-5 bg-amber-50/40">
        <label className="flex items-center gap-2.5 text-sm font-semibold text-amber-700 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="rounded accent-amber-500"
          />
          🔒 开启付费阅读
        </label>
        {paid && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-amber-600 mb-1 font-medium">
                价格（元）
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-40 border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/80"
                placeholder="如 9.9"
              />
            </div>
            <div>
              <label className="block text-xs text-amber-600 mb-1 font-medium">
                免费预览内容（Markdown，未购买用户可见）
              </label>
              <textarea
                value={freeContent}
                onChange={(e) => setFreeContent(e.target.value)}
                rows={4}
                className="w-full border border-amber-200 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/80"
                placeholder="写一段吸引人的预览内容，让读者想要购买全文..."
              />
              <p className="text-xs text-amber-400 mt-1">
                留空则自动截取全文前 300 字作为预览
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 软件下载管理 */}
      <div className="border border-pink-200 rounded-2xl p-5 bg-white/60">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-pink-600">
            💾 软件下载
          </span>
          <button
            type="button"
            onClick={addDownload}
            className="px-3 py-1.5 rounded-lg bg-pink-100 text-pink-600 text-xs font-medium hover:bg-pink-200 transition-colors"
          >
            + 添加下载项
          </button>
        </div>
        {downloads.length === 0 ? (
          <p className="text-xs text-pink-300 text-center py-3">
            暂无下载项，点击上方按钮添加（适用于软件分享类文章）
          </p>
        ) : (
          <div className="space-y-3">
            {downloads.map((d, idx) => (
              <div
                key={d.id}
                className="border border-pink-100 rounded-xl p-3 bg-pink-50/30 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-400">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDownload(d.id)}
                    className="text-red-400 hover:text-red-600 text-xs font-medium"
                  >
                    删除
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={d.name}
                    onChange={(e) => updateDownload(d.id, "name", e.target.value)}
                    className="border border-pink-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white/80"
                    placeholder="软件名称 *"
                  />
                  <input
                    value={d.version}
                    onChange={(e) => updateDownload(d.id, "version", e.target.value)}
                    className="border border-pink-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white/80"
                    placeholder="版本号"
                  />
                </div>
                <input
                  value={d.url}
                  onChange={(e) => updateDownload(d.id, "url", e.target.value)}
                  className="w-full border border-pink-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white/80"
                  placeholder="下载链接 *（https://...）"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={d.size}
                    onChange={(e) => updateDownload(d.id, "size", e.target.value)}
                    className="border border-pink-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white/80"
                    placeholder="文件大小（如 12.5 MB）"
                  />
                  <select
                    value={d.platform}
                    onChange={(e) => updateDownload(d.id, "platform", e.target.value)}
                    className="border border-pink-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white/80"
                  >
                    <option value="Windows">Windows</option>
                    <option value="macOS">macOS</option>
                    <option value="Linux">Linux</option>
                    <option value="Android">Android</option>
                    <option value="iOS">iOS</option>
                    <option value="全平台">全平台</option>
                  </select>
                </div>
                <input
                  value={d.note}
                  onChange={(e) => updateDownload(d.id, "note", e.target.value)}
                  className="w-full border border-pink-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white/80"
                  placeholder="备注（如：含激活教程 / 免安装绿色版）"
                />
                {/* 付费下载设置 */}
                <div className="border border-amber-100 rounded-lg p-2.5 bg-amber-50/40 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-amber-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={d.paid}
                      onChange={(e) => {
                        updateDownload(d.id, "paid", e.target.checked);
                        if (!e.target.checked) updateDownload(d.id, "price", 0);
                      }}
                      className="rounded accent-amber-500"
                    />
                    🔒 付费下载（读者购买后可下载）
                  </label>
                  {d.paid && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-amber-600 font-medium whitespace-nowrap">
                        价格（元）
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={d.price || ""}
                        onChange={(e) => updateDownload(d.id, "price", Number(e.target.value))}
                        className="w-28 border border-amber-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/80"
                        placeholder="如 5"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作栏 */}
      <div className="flex items-center gap-4 pt-2">
        <label className="flex items-center gap-2.5 text-sm font-medium text-pink-600 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded accent-pink-500"
          />
          立即发布
        </label>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-pink-200 rounded-xl text-sm text-pink-500 font-medium hover:bg-pink-50 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-7 py-2.5 rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 transition-all shadow-lg shadow-pink-200 hover:shadow-pink-300"
        >
          {saving ? "保存中..." : isEdit ? "更新文章 ✨" : "保存文章 ✨"}
        </button>
      </div>
    </form>
  );
}