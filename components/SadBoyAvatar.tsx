// 伤感男孩默认头像（纯 SVG 绘制，配合全站粉色二次元主题）
// 站长可在系统设置中用自定义头像 URL 覆盖

interface SadBoyAvatarProps {
  avatarUrl?: string; // 自定义头像（留空使用默认 SVG）
  size?: number;
  className?: string;
}

export default function SadBoyAvatar({
  avatarUrl,
  size = 96,
  className = "",
}: SadBoyAvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt="站长头像"
        width={size}
        height={size}
        className={`rounded-full object-cover border-2 border-pink-200 shadow-lg shadow-pink-200/50 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`rounded-full border-2 border-pink-200 shadow-lg shadow-pink-200/50 ${className}`}
      style={{ width: size, height: size }}
    >
      <defs>
        <linearGradient id="sadbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="50%" stopColor="#f9a8d4" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
        <linearGradient id="sadhair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="sadface" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3e2" />
          <stop offset="100%" stopColor="#fde6c8" />
        </linearGradient>
      </defs>

      {/* 背景 */}
      <circle cx="100" cy="100" r="100" fill="url(#sadbg)" />

      {/* 装饰雨滴 */}
      <circle cx="32" cy="45" r="2.5" fill="#fff" opacity="0.5" />
      <circle cx="168" cy="38" r="2" fill="#fff" opacity="0.4" />
      <circle cx="175" cy="70" r="1.8" fill="#fff" opacity="0.5" />
      <circle cx="25" cy="80" r="1.5" fill="#fff" opacity="0.4" />
      <path d="M 45 30 q 1.5 3 0 5 q -1.5 -2 0 -5" fill="#e0f2fe" opacity="0.7" />
      <path d="M 160 55 q 1.5 3 0 5 q -1.5 -2 0 -5" fill="#e0f2fe" opacity="0.6" />

      {/* 脖子 */}
      <rect x="88" y="140" width="24" height="20" rx="6" fill="url(#sadface)" />

      {/* 衣服 */}
      <path
        d="M 60 200 Q 60 158 100 155 Q 140 158 140 200 Z"
        fill="#64748b"
      />
      <path d="M 92 158 L 100 168 L 108 158" fill="#475569" />

      {/* 脸 */}
      <ellipse cx="100" cy="105" rx="38" ry="42" fill="url(#sadface)" />

      {/* 头发（后层） */}
      <path
        d="M 60 95 Q 58 55 100 50 Q 142 55 140 95 Q 142 70 135 62 Q 130 50 100 46 Q 70 50 65 62 Q 58 70 60 95 Z"
        fill="url(#sadhair)"
      />

      {/* 刘海 - 遮住右眼 */}
      <path
        d="M 62 92 Q 60 58 100 52 Q 140 58 138 92 Q 136 72 128 66 Q 122 78 110 70 Q 100 82 88 70 Q 76 78 72 66 Q 64 72 62 92 Z"
        fill="url(#sadhair)"
      />
      {/* 长刘海遮右眼 */}
      <path
        d="M 100 52 Q 130 55 138 85 Q 138 100 132 108 Q 130 90 124 80 Q 120 72 112 68 Q 104 64 100 62 Z"
        fill="url(#sadhair)"
      />

      {/* 左眼（忧郁半闭） */}
      <ellipse cx="82" cy="108" rx="7" ry="5" fill="#1e293b" />
      <circle cx="84" cy="106" r="2.2" fill="#fff" opacity="0.9" />
      {/* 上眼皮 */}
      <path d="M 73 104 Q 82 100 91 104" stroke="#334155" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* 下眼袋（疲惫感） */}
      <path d="M 75 114 Q 82 116 89 114" stroke="#fbbf24" strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round" />

      {/* 右眼（被头发遮住，只露一点） */}
      <path d="M 118 108 Q 124 106 128 110" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* 眉毛（忧郁微皱） */}
      <path d="M 72 96 Q 82 93 91 97" stroke="#334155" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 116 97 Q 122 95 128 98" stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />

      {/* 一滴泪 */}
      <path
        d="M 82 116 Q 80 122 82 126 Q 84 122 82 116 Z"
        fill="#60a5fa"
        opacity="0.85"
      />
      <circle cx="82" cy="124" r="1.2" fill="#93c5fd" />

      {/* 鼻子 */}
      <path d="M 100 118 Q 99 122 101 124" stroke="#d4a574" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* 嘴巴（微微下垂，伤感） */}
      <path
        d="M 92 134 Q 100 131 108 134"
        stroke="#9a6b6b"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* 腮红 */}
      <ellipse cx="72" cy="122" rx="6" ry="3.5" fill="#f9a8d4" opacity="0.35" />
      <ellipse cx="128" cy="122" rx="6" ry="3.5" fill="#f9a8d4" opacity="0.25" />
    </svg>
  );
}