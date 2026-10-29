import Link from "next/link";
import { getAllPosts, getAllCategories, getUserById } from "@/lib/store";
import { getSiteSettings, getApprovedFriendLinks, getEnabledProducts, getPaymentSettings, getPaidDonateOrders } from "@/lib/settings";
import type { Category } from "@/lib/types";
import OwnerCard from "@/components/OwnerCard";
import PostToc from "@/components/PostToc";
import FriendLinks from "@/components/FriendLinks";
import ProductPromos from "@/components/ProductPromos";
import DonateCard from "@/components/DonateCard";
import DonorWall, { type DonorEntry } from "@/components/DonorWall";
import Guestbook from "@/components/Guestbook";
import AvatarPendant from "@/components/AvatarPendant";

// ISR：每 60 秒重新验证
export const revalidate = 60;

export default async function HomePage() {
  const [posts, categories, site, friendLinks, products, payment, donateOrders] = await Promise.all([
    getAllPosts(),
    getAllCategories(),
    getSiteSettings(),
    getApprovedFriendLinks(),
    getEnabledProducts(),
    getPaymentSettings(),
    getPaidDonateOrders(),
  ]);

  const categoryMap = new Map<string, Category>(
    categories.map((c) => [c.id, c])
  );

  // 解析赞赏名单（已支付赞赏订单 → 昵称/金额/留言）
  const donors: DonorEntry[] = await Promise.all(
    donateOrders.map(async (o) => {
      let name = "匿名好心人";
      if (o.userId) {
        const user = await getUserById(o.userId);
        if (user) name = user.username;
      }
      return {
        name,
        amount: o.amount,
        message: o.message,
        time: o.paidAt ?? o.createdAt,
      };
    })
  );

  const paidCount = posts.filter((p) => p.paid).length;

  return (
    <div>
      {/* 头像挂件：顶部垂下的摇曳头像，点击回到顶部 */}
      <AvatarPendant avatarUrl={site.avatarUrl} />
      {/* Hero 区域：深色赛博 × 樱花二次元 */}
      <div className="relative overflow-hidden rounded-3xl mb-10 bg-gradient-to-br from-[#0d1b2a] via-[#2b1b3d] to-[#4a1942] px-8 py-16 text-center">
        {/* 网格 */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(244,114,182,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.45) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        {/* 光晕 */}
        <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-pink-500/20 blur-[110px] animate-pulse-glow" />
        <div className="absolute -bottom-20 right-1/5 w-80 h-80 rounded-full bg-cyan-400/15 blur-[100px] animate-pulse-glow" />
        {/* 樱花 */}
        {[...Array(7)].map((_, i) => (
          <span
            key={i}
            className="sakura-petal"
            style={{
              left: `${8 + i * 13}%`,
              width: `${8 + (i % 3) * 3}px`,
              height: `${8 + (i % 3) * 3}px`,
              animationDuration: `${9 + (i % 4) * 3}s`,
              animationDelay: `${i * 2.4}s`,
            }}
          />
        ))}
        {/* 装饰圆点 */}
        <div className="absolute top-6 left-8 w-2.5 h-2.5 rounded-full bg-cyan-300/60 animate-float" />
        <div className="absolute top-12 right-12 w-3 h-3 rounded-full bg-pink-300/50 animate-float-slow" />
        <div className="absolute bottom-8 left-16 w-2 h-2 rounded-full bg-fuchsia-300/60 animate-float-slow" />
        <div className="absolute bottom-12 right-8 w-2.5 h-2.5 rounded-full bg-cyan-300/50 animate-float" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-[11px] font-mono text-pink-100 tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            WELCOME TO THE NEON GARDEN · 欢迎来到霓虹花园
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide">
            <span className="bg-gradient-to-r from-pink-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg neon-text-pink">
              ✿ {site.siteName} ✿
            </span>
          </h1>
          <p className="mt-4 text-pink-100/85 text-lg max-w-xl mx-auto">
            {site.description}
          </p>

          {/* 统计徽章 */}
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            {[
              { label: "文章", value: posts.length, icon: "📝" },
              { label: "分类", value: categories.length, icon: "🗂️" },
              ...(paidCount > 0 ? [{ label: "付费资源", value: paidCount, icon: "💎" }] : []),
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-sm text-pink-50"
              >
                <span>{s.icon}</span>
                <span className="font-bold text-cyan-200">{s.value}</span>
                <span className="text-pink-100/70">{s.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <a
              href="#posts"
              className="px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-400/50 hover:scale-105 active:scale-95 transition-all"
            >
              ▶ 开始阅读
            </a>
            <Link
              href="/donate"
              className="px-6 py-2.5 rounded-full text-sm font-bold bg-white/10 border border-cyan-300/40 text-cyan-200 backdrop-blur-sm hover:bg-white/20 hover:scale-105 active:scale-95 transition-all font-mono tracking-wider"
            >
              ♡ 请我喝奶茶
            </Link>
          </div>
        </div>
      </div>

      {/* 横向滚动公告条 */}
      <div className="relative mb-8 rounded-2xl bg-white/70 backdrop-blur border border-pink-100 overflow-hidden">
        <div className="flex items-center">
          <span className="flex-shrink-0 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-xs font-bold rounded-r-xl z-10">
            📢 公告
          </span>
          <div className="relative flex-1 overflow-hidden py-2.5">
            <div className="flex whitespace-nowrap animate-marquee text-sm text-gray-500">
              {[0, 1].map((dup) => (
                <span key={dup} className="flex">
                  <span className="mx-8">
                    ✿ 欢迎来到 {site.siteName}，这里有技术、生活与二次元 ✿
                  </span>
                  {site.description && <span className="mx-8">{site.description}</span>}
                  <span className="mx-8">💡 登录后可购买付费文章与下载资源</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 双栏布局 */}
      <div id="posts" className="flex gap-10 items-start scroll-mt-6">
        {/* 左侧：文章列表 */}
        <div className="flex-1 min-w-0">
          {/* 分类导航 */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-8">
              <Link
                href="/"
                className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-md shadow-pink-200 hover:shadow-pink-300 hover:scale-105 active:scale-95 transition-all"
              >
                全部
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/80 text-gray-600 border border-pink-200 backdrop-blur hover:border-fuchsia-400 hover:text-fuchsia-600 hover:shadow-md hover:shadow-fuchsia-100 hover:scale-105 active:scale-95 transition-all"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <div className="text-6xl mb-4">(´；ω；`)</div>
              <p className="text-lg">还没有文章呢～</p>
              <Link
                href="/admin"
                className="mt-4 inline-block text-pink-500 hover:text-pink-700 underline"
              >
                前往后台发布第一篇文章 →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {posts.map((post) => {
                const cat = post.categoryId ? categoryMap.get(post.categoryId) : null;
                return (
                  <article
                    key={post.id}
                    className="group relative bg-white/85 backdrop-blur rounded-2xl border border-pink-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-fuchsia-200/70 hover:-translate-y-1.5 hover:border-fuchsia-300/60 transition-all duration-300"
                  >
                    {/* 顶部霓虹流光线 */}
                    <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-pink-400 via-fuchsia-400 to-cyan-400 bg-[length:200%_100%] opacity-0 group-hover:opacity-100 group-hover:animate-[border-flow_3s_linear_infinite] transition-opacity duration-300" />
                    <Link href={`/posts/${post.slug}`}>
                      {/* 封面 */}
                      {post.coverUrl ? (
                        <div className="aspect-[16/9] overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.coverUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* 封面日期徽章 */}
                          <time className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/45 backdrop-blur-sm text-white/95 text-[11px] font-mono tracking-wider">
                            🗓 {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                          </time>
                        </div>
                      ) : (
                        <div className="aspect-[16/9] flex items-center justify-center relative bg-gradient-to-br from-[#1a2740] via-[#3b1f47] to-[#4a1942] overflow-hidden">
                          {/* 深色霓虹占位封面 */}
                          <div
                            className="absolute inset-0 opacity-[0.18]"
                            style={{
                              backgroundImage:
                                "linear-gradient(rgba(244,114,182,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)",
                              backgroundSize: "28px 28px",
                            }}
                          />
                          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-pink-500/25 blur-2xl group-hover:bg-pink-400/40 transition-colors duration-500" />
                          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-cyan-400/20 blur-xl" />
                          <span className="relative text-5xl drop-shadow-[0_0_18px_rgba(244,114,182,0.6)] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                            🌸
                          </span>
                        </div>
                      )}

                      <div className="p-5">
                        {/* 分类 + 付费标记 */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {cat && (
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm"
                              style={{
                                backgroundColor: cat.color,
                                boxShadow: `0 0 12px ${cat.color}55`,
                              }}
                            >
                              {cat.name}
                            </span>
                          )}
                          {post.paid && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm shadow-amber-200 group-hover:shadow-amber-300 transition-shadow">
                              🔒 付费 ¥{post.price}
                            </span>
                          )}
                        </div>

                        <h2 className="text-lg font-bold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-fuchsia-600 group-hover:bg-clip-text transition-all line-clamp-2">
                          {post.title}
                        </h2>
                        <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-2">
                          {post.excerpt}
                        </p>

                        <div className="mt-4 flex items-center justify-between">
                          {post.coverUrl ? (
                            <time className="text-xs text-gray-400">
                              {new Date(post.createdAt).toLocaleDateString("zh-CN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </time>
                          ) : (
                            <span className="text-xs text-gray-300 font-mono">// READ MORE</span>
                          )}
                          {post.tags.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {post.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="bg-gradient-to-r from-pink-50 to-fuchsia-50 text-pink-500 px-2 py-0.5 rounded-full text-xs border border-pink-100 group-hover:border-pink-200 transition-colors"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}

          {/* 留言板 */}
          <Guestbook enabled={site.commentEnabled} />
        </div>

        {/* 右侧：侧边栏 */}
        <aside className="hidden xl:block w-80 flex-shrink-0 space-y-6 sticky top-6">
          <OwnerCard site={site} />
          <PostToc posts={posts} />
          <FriendLinks links={friendLinks} siteName={site.siteName} />
          <ProductPromos products={products} />
          {payment.donate.enabled && (payment.donate.wechatQr || payment.donate.alipayQr) && (
            <DonateCard
              title={payment.donate.title}
              desc={payment.donate.desc}
              wechatQr={payment.donate.wechatQr}
              alipayQr={payment.donate.alipayQr}
              variant="compact"
            />
          )}
          {payment.donate.enabled && <DonorWall donors={donors} variant="compact" />}
        </aside>
      </div>
    </div>
  );
}