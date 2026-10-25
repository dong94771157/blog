"use client";

import { useEffect, useState, useCallback } from "react";

interface CommentItem {
  id: string;
  authorName: string;
  content: string;
  createdAt: number;
}

interface CommentsProps {
  postId: string;
  loggedIn: boolean;
  username?: string;
}

export default function Comments({
  postId,
  loggedIn,
  username,
}: CommentsProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "pending" | "rejected" | "error";
    message: string;
  } | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          authorName: loggedIn ? username : authorName,
          content: content.trim(),
        }),
      });
      const data = await res.json();

      if (data.status === "rejected") {
        setFeedback({ type: "rejected", message: data.message });
      } else if (data.status === "pending") {
        setFeedback({ type: "pending", message: data.message });
        setContent("");
      } else if (data.status === "approved" && data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setContent("");
        setFeedback({ type: "success", message: data.message });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: "error", message: data.error || "留言失败" });
      }
    } catch {
      setFeedback({ type: "error", message: "网络错误，请稍后重试" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-12 mb-8">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">💬</span>
        <h2 className="text-lg font-bold text-pink-600">留言</h2>
        <span className="text-xs text-pink-300 ml-1">
          {comments.length > 0 && `共 ${comments.length} 条`}
        </span>
      </div>

      {/* 留言表单 */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl p-5 mb-6 shadow-sm"
      >
        {!loggedIn && (
          <div className="mb-3">
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="你的昵称"
              maxLength={30}
              className="w-full sm:w-56 border border-pink-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-pink-50/30 placeholder:text-pink-200"
            />
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="说点什么吧...（支持 AI 智能审核，请文明发言）"
          maxLength={1000}
          rows={3}
          className="w-full border border-pink-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-pink-50/30 placeholder:text-pink-200 resize-y"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-pink-300">{content.length}/1000</span>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:from-pink-600 hover:to-purple-600 disabled:opacity-40 transition-all shadow-md shadow-pink-200"
          >
            {submitting ? "AI 审核中..." : "发表留言 ✨"}
          </button>
        </div>

        {/* 反馈 */}
        {feedback && (
          <div
            className={`mt-3 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 ${
              feedback.type === "rejected"
                ? "bg-red-50 text-red-500 border border-red-100"
                : feedback.type === "pending"
                ? "bg-amber-50 text-amber-600 border border-amber-100"
                : feedback.type === "success"
                ? "bg-green-50 text-green-600 border border-green-100"
                : "bg-red-50 text-red-500 border border-red-100"
            }`}
          >
            <span>
              {feedback.type === "rejected"
                ? "🚫"
                : feedback.type === "pending"
                ? "⏳"
                : feedback.type === "success"
                ? "✅"
                : "⚠️"}
            </span>
            {feedback.message}
          </div>
        )}
      </form>

      {/* 留言列表 */}
      {loading ? (
        <p className="text-center text-pink-300 text-sm py-6">加载留言中...</p>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 bg-white/40 rounded-2xl border border-dashed border-pink-200">
          <div className="text-3xl mb-2">🌸</div>
          <p className="text-pink-300 text-sm">还没有留言，来抢沙发吧～</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-xs font-bold text-pink-600">
                  {c.authorName.slice(0, 1).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {c.authorName}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(c.createdAt).toLocaleString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words pl-[42px]">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}