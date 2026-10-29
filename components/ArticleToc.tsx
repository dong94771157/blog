"use client";

import { useEffect, useState } from "react";

export interface TocHeading {
  id: string;
  text: string;
  level: number; // 2 = h2, 3 = h3
}

// 文章目录：右侧悬浮按钮 + 可展开面板，滚动时高亮当前章节
export default function ArticleToc({ headings }: { headings: TocHeading[] }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId(e.target.id);
        }
      },
      { rootMargin: "-70px 0px -65% 0px" }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveId(id);
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? "收起目录" : "展开目录"}
        aria-label="文章目录"
        className={`fixed right-5 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full flex items-center justify-center text-lg shadow-lg transition-all ${
          open
            ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-pink-300/60 rotate-0"
            : "bg-white/85 backdrop-blur border border-pink-200 text-pink-500 hover:bg-pink-50 hover:scale-110 shadow-pink-100"
        }`}
      >
        {open ? "✕" : "📑"}
      </button>

      {/* 目录面板 */}
      {open && (
        <div className="fixed right-16 top-1/2 -translate-y-1/2 z-40 w-64 max-w-[70vw] bg-white/90 backdrop-blur rounded-2xl border border-pink-100 shadow-xl shadow-pink-100/50 overflow-hidden animate-fade-up">
          <div className="px-4 py-2.5 border-b border-pink-50 flex items-center gap-1.5">
            <span className="text-sm">📚</span>
            <span className="text-xs font-bold text-gray-700">文章目录</span>
            <span className="ml-auto text-[10px] text-gray-400">
              {headings.length} 节
            </span>
          </div>
          <nav className="max-h-[50vh] overflow-y-auto py-1.5 px-2">
            {headings.map((h) => (
              <button
                key={h.id}
                onClick={() => jump(h.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs leading-snug transition-colors line-clamp-2 ${
                  h.level === 3 ? "pl-6" : ""
                } ${
                  activeId === h.id
                    ? "bg-pink-50 text-pink-600 font-bold"
                    : "text-gray-500 hover:bg-pink-50/60 hover:text-pink-500"
                }`}
              >
                {h.text}
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
