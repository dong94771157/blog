"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Msg = {
  role: "assistant",
  content: "你好呀～我是小樱，博客的 AI 客服助手 🌸\n有什么问题都可以问我哦！",
};

export default function AIChat() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // 后台页不显示
  const isAdmin = pathname?.startsWith("/admin");

  // 检查 AI 客服是否启用
  useEffect(() => {
    if (isAdmin) return;
    fetch("/api/ai/chat")
      .then((r) => r.json())
      .then((d) => setEnabled(Boolean(d.enabled)))
      .catch(() => {});
  }, [isAdmin]);

  // 自动滚动到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (isAdmin || !enabled) return null;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setError(data.error || "回复失败，请稍后重试");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([WELCOME]);
    setError("");
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen(!open)}
        title="AI 客服"
        className={`fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl shadow-xl shadow-purple-300/50 hover:shadow-purple-400/60 hover:scale-110 transition-all flex items-center justify-center ${
          open ? "rotate-90" : ""
        }`}
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* 聊天面板 */}
      {open && (
        <div className="fixed bottom-24 left-4 right-4 sm:right-auto sm:w-96 z-50 bg-white/95 backdrop-blur-md rounded-3xl border border-pink-100 shadow-2xl shadow-purple-200/40 overflow-hidden flex flex-col max-h-[70vh]">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-pink-400 px-5 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-xl">
              🤖
            </div>
            <div className="flex-1">
              <div className="font-bold text-white text-sm">小樱 · AI 客服</div>
              <div className="text-white/70 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block" />
                在线
              </div>
            </div>
            <button
              onClick={handleReset}
              title="清空对话"
              className="text-white/70 hover:text-white text-xs bg-white/15 hover:bg-white/30 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              🔄
            </button>
          </div>

          {/* 消息列表 */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-pink-50/30 to-white">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-md"
                      : "bg-white border border-pink-100 text-gray-700 rounded-bl-md shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-pink-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-pink-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-pink-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-pink-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center text-xs text-red-400 bg-red-50 rounded-lg py-2 px-3">
                {error}
              </div>
            )}
          </div>

          {/* 输入区 */}
          <form onSubmit={handleSend} className="border-t border-pink-100 p-3 flex gap-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的问题..."
              maxLength={500}
              className="flex-1 border border-pink-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-pink-50/30 placeholder:text-pink-200"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:from-pink-600 hover:to-purple-600 disabled:opacity-40 transition-all shadow-md shadow-pink-200"
            >
              发送
            </button>
          </form>
        </div>
      )}
    </>
  );
}