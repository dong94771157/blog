import Link from "next/link";

export interface DonorEntry {
  name: string; // 赞赏者昵称
  amount: number; // 金额（元）
  message: string; // 赞赏留言
  time: number; // 时间戳
}

interface DonorWallProps {
  donors: DonorEntry[];
  /** compact: 侧边栏小卡片 | full: 宽幅展示 */
  variant?: "compact" | "full";
}

export default function DonorWall({ donors, variant = "compact" }: DonorWallProps) {
  const isFull = variant === "full";
  const totalAmount = donors.reduce((s, d) => s + d.amount, 0);
  const showCount = isFull ? 50 : 10;
  const list = donors.slice(0, showCount);

  if (donors.length === 0) {
  return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/40 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🏅</span>
          <h3 className="font-bold text-gray-800 text-sm">赞赏名单</h3>
        </div>
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🌸</div>
          <p className="text-xs text-gray-400">还没有人赞赏，快来成为第一位吧～</p>
          <Link
            href="/donate"
            className="mt-3 inline-block text-xs text-pink-500 hover:text-pink-600 font-medium"
          >
            前往赞赏 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/40 overflow-hidden">
      {/* 标题 + 统计 */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-3 border-b border-pink-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏅</span>
            <h3 className="font-bold text-gray-800 text-sm">赞赏名单</h3>
          </div>
          <div className="text-xs text-gray-500">
            <span className="text-pink-500 font-bold">{donors.length}</span> 位 ·
            <span className="text-pink-500 font-bold"> ¥{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 名单列表 */}
      <div className="p-3 space-y-2">
        {list.map((d, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 px-2 py-2 rounded-xl hover:bg-pink-50/50 transition-colors"
          >
            {/* 头像首字 */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-xs font-bold text-pink-600 flex-shrink-0">
              {d.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {d.name}
                </span>
                <span className="text-xs font-bold text-pink-500 flex-shrink-0">
                  ¥{d.amount.toFixed(2)}
                </span>
              </div>
              {d.message && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{d.message}</p>
              )}
            </div>
            <span className="text-[10px] text-gray-300 flex-shrink-0 mt-1">
              {new Date(d.time).toLocaleDateString("zh-CN", {
                month: "numeric",
                day: "numeric",
              })}
            </span>
          </div>
        ))}
        {donors.length > showCount && (
          <p className="text-center text-xs text-gray-400 pt-1">
            仅展示最近 {showCount} 位，共 {donors.length} 位赞赏者
          </p>
        )}
      </div>
    </div>
  );
}