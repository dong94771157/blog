"use client";

import { useEffect, useState } from "react";
import type { Comment } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  spam: "垃圾广告",
  abuse: "辱骂攻击",
  porn: "色情低俗",
  political: "违法违规",
  scam: "诈骗钓鱼",
  none: "无",
};

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">(
    "all"
  );

  useEffect(() => {
    fetch("/api/comments?all=1")
      .then((res) => (res.ok ? res.json() : { comments: [] }))
      .then((data) => setComments(data.comments || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleStatus(id: string, status: Comment["status"]) {
    const res = await fetch(`/api/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    }
  }

  const filtered = comments.filter(
    (c) => filter === "all" || c.status === filter
  );

  const pendingCount = comments.filter((c) => c.status === "pending").length;
  const rejectedCount = comments.filter((c) => c.status === "rejected").length;
  const approvedCount = comments.filter((c) => c.status === "approved").length;

  if (loading) {
    return (
      <div className="text-center py-20 text-pink-300 text-lg">加载中...</div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pink-600">留言管理</h1>
        <p className="text-sm text-pink-400 mt-1">
          共 {comments.length} 条 · 待审 {pendingCount} · 已通过 {approvedCount} · 已拦截 {rejectedCount}
        </p>
      </div>

      {/* 筛选 */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(
          [
            ["all", "全部"],
            ["pending", "待审核"],
            ["approved", "已通过"],
            ["rejected", "已拦截"],
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
          <div className="text-4xl mb-3">💬</div>
          <p className="text-pink-400">暂无留言</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl p-5 shadow-sm"
            >
              {/* 头部 */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-xs font-bold text-pink-600">
                  {c.authorName.slice(0, 1).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {c.authorName}
                </span>
                {c.status === "approved" && (
                  <span className="bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                    ● 已通过
                  </span>
                )}
                {c.status === "pending" && (
                  <span className="bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                    ○ 待审核
                  </span>
                )}
                {c.status === "rejected" && (
                  <span className="bg-red-50 text-red-500 px-2.5 py-0.5 rounded-full text-xs font-medium">
                    ✕ 已拦截
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(c.createdAt).toLocaleString("zh-CN")}
                </span>
              </div>

              {/* 内容 */}
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words bg-pink-50/30 rounded-xl px-4 py-3 mb-3">
                {c.content}
              </p>

              {/* 文章来源 */}
              <div className="text-xs text-gray-400 mb-3">
                📄 来自文章：{c.postTitle}
              </div>

              {/* AI 审核结果 */}
              {c.aiReview && (
                <div
                  className={`text-xs rounded-xl px-3 py-2 mb-3 border ${
                    c.aiReview.violated
                      ? "bg-red-50 text-red-500 border-red-100"
                      : "bg-green-50 text-green-600 border-green-100"
                  }`}
                >
                  🤖 AI 审核：
                  {c.aiReview.violated
                    ? `检测到违规 [${CATEGORY_LABEL[c.aiReview.category] || c.aiReview.category}] - ${c.aiReview.reason}`
                    : "未发现违规内容"}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2">
                {c.status !== "approved" && (
                  <button
                    onClick={() => handleStatus(c.id, "approved")}
                    className="px-4 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-medium hover:bg-green-100 transition-colors border border-green-200"
                  >
                    ✓ 通过
                  </button>
                )}
                {c.status !== "rejected" && (
                  <button
                    onClick={() => handleStatus(c.id, "rejected")}
                    className="px-4 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors border border-red-200"
                  >
                    ✕ 拦截
                  </button>
                )}
                {c.status !== "pending" && (
                  <button
                    onClick={() => handleStatus(c.id, "pending")}
                    className="px-4 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors border border-amber-200"
                  >
                    ○ 待审
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}