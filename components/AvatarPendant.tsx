"use client";

import { useState } from "react";
import SadBoyAvatar from "./SadBoyAvatar";

// 主页头像挂件：从顶部垂下的摇曳头像，点击回到顶部
export default function AvatarPendant({ avatarUrl }: { avatarUrl?: string }) {
  const [bouncing, setBouncing] = useState(false);

  function handleClick() {
    setBouncing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setBouncing(false), 500);
  }

  return (
    <button
      onClick={handleClick}
      title="回到顶部"
      aria-label="回到顶部"
      className={`avatar-pendant group fixed top-0 right-10 z-40 hidden md:flex flex-col items-center cursor-pointer select-none ${
        bouncing ? "animate-pendant-bounce" : ""
      }`}
    >
      {/* 挂绳 */}
      <span className="w-px h-8 bg-gradient-to-b from-pink-300/70 to-purple-300/70 shadow-sm" />
      {/* 摇曳的头像 */}
      <span className="animate-pendant-swing block">
        <span className="relative block rounded-full p-[3px] bg-gradient-to-br from-pink-300 via-fuchsia-300 to-cyan-300 shadow-lg shadow-pink-200/60 ring-2 ring-white/70 transition-transform group-hover:scale-110">
          <SadBoyAvatar
            avatarUrl={avatarUrl}
            size={52}
            className="bg-white ring-0"
          />
          {/* 悬停提示气泡 */}
          <span className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-gray-800/90 text-white px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            回到顶部 ↑
          </span>
        </span>
      </span>
    </button>
  );
}
