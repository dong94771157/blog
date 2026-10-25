"use client";

import SadBoyAvatar from "./SadBoyAvatar";
import type { SiteSettings } from "@/lib/types";

interface SocialItem {
  key: string;
  label: string;
  icon: string;
  href?: string;
  text?: string; // 纯文本展示（QQ/微信）
  color: string;
}

export default function OwnerCard({ site }: { site: SiteSettings }) {
  const ownerName = site.author || site.siteName;

  const socials: SocialItem[] = [
    site.contact.email && {
      key: "email",
      label: "邮箱",
      icon: "📧",
      href: `mailto:${site.contact.email}`,
      color: "hover:bg-red-50 hover:border-red-200",
    },
    site.contact.github && {
      key: "github",
      label: "GitHub",
      icon: "🐙",
      href: site.contact.github.startsWith("http")
        ? site.contact.github
        : `https://github.com/${site.contact.github}`,
      color: "hover:bg-gray-50 hover:border-gray-300",
    },
    site.contact.bilibili && {
      key: "bilibili",
      label: "B站",
      icon: "📺",
      href: site.contact.bilibili.startsWith("http")
        ? site.contact.bilibili
        : `https://space.bilibili.com/${site.contact.bilibili}`,
      color: "hover:bg-pink-50 hover:border-pink-300",
    },
    site.contact.qq && {
      key: "qq",
      label: "QQ",
      icon: "🐧",
      text: site.contact.qq,
      color: "hover:bg-sky-50 hover:border-sky-300",
    },
    site.contact.telegram && {
      key: "telegram",
      label: "TG",
      icon: "✈️",
      href: site.contact.telegram.startsWith("http")
        ? site.contact.telegram
        : `https://t.me/${site.contact.telegram}`,
      color: "hover:bg-sky-50 hover:border-sky-300",
    },
    site.contact.twitter && {
      key: "twitter",
      label: "Twitter",
      icon: "🐦",
      href: site.contact.twitter.startsWith("http")
        ? site.contact.twitter
        : `https://twitter.com/${site.contact.twitter}`,
      color: "hover:bg-sky-50 hover:border-sky-300",
    },
    site.contact.wechat && {
      key: "wechat",
      label: "微信",
      icon: "💬",
      text: site.contact.wechat,
      color: "hover:bg-green-50 hover:border-green-300",
    },
  ].filter(Boolean) as SocialItem[];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/40 overflow-hidden">
      {/* 顶部渐变背景 */}
      <div className="h-16 bg-gradient-to-r from-pink-300 via-pink-400 to-purple-400 relative">
        <div className="absolute top-2 left-4 w-2 h-2 rounded-full bg-white/50" />
        <div className="absolute top-5 right-6 w-3 h-3 rounded-full bg-white/40" />
        <div className="absolute bottom-2 right-12 w-1.5 h-1.5 rounded-full bg-white/60" />
      </div>

      {/* 头像 */}
      <div className="flex justify-center -mt-10 mb-2">
        <SadBoyAvatar avatarUrl={site.avatarUrl} size={80} className="bg-white" />
      </div>

      {/* 名称与简介 */}
      <div className="px-4 pb-3 text-center">
        <h3 className="font-bold text-gray-800 text-lg">{ownerName}</h3>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          {site.ownerBio}
        </p>
      </div>

      {/* 社交媒体 */}
      {socials.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap justify-center gap-2">
            {socials.map((s) =>
              s.href ? (
                <a
                  key={s.key}
                  href={s.href}
                  target={s.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  title={s.label}
                  className={`w-9 h-9 rounded-full border border-pink-100 bg-white/60 flex items-center justify-center text-base transition-all hover:scale-110 ${s.color}`}
                >
                  {s.icon}
                </a>
              ) : (
                <span
                  key={s.key}
                  title={`${s.label}: ${s.text}`}
                  className={`group relative w-9 h-9 rounded-full border border-pink-100 bg-white/60 flex items-center justify-center text-base cursor-default transition-all hover:scale-110 ${s.color}`}
                >
                  {s.icon}
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-gray-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {s.text}
                  </span>
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* 在线音乐入口 */}
      <div className="px-4 pb-4">
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent("open-music-player"))
          }
          className="w-full py-2 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 text-pink-600 text-xs font-medium hover:from-pink-100 hover:to-purple-100 transition-all flex items-center justify-center gap-1.5"
        >
          <span className="animate-pulse">🎵</span> 在线音乐 · 伤感歌单
        </button>
      </div>
    </div>
  );
}