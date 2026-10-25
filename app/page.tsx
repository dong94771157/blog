import Link from "next/link";
import { getAllPosts, getAllCategories } from "@/lib/store";
import { getSiteSettings } from "@/lib/settings";
import type { Category } from "@/lib/types";

// ISR：每 60 秒重新验证
export const revalidate = 60;

export default async function HomePage() {
  const [posts, categories, site] = await Promise.all([
    getAllPosts(),
    getAllCategories(),
    getSiteSettings(),
  ]);

  const categoryMap = new Map<string, Category>(
    categories.map((c) => [c.id, c])
  );

  return (
    <div>
      {/* Hero 区域 */}
      <div className="relative overflow-hidden rounded-3xl mb-10 bg-gradient-to-br from-pink-400 via-pink-500 to-purple-400 px-8 py-14 text-center">
        {/* 装饰圆点 */}
        <div className="absolute top-4 left-6 w-3 h-3 rounded-full bg-white/40 animate-float" />
        <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-white/30 animate-float-slow" />
        <div className="absolute bottom-6 left-14 w-2 h-2 rounded-full bg-white/50 animate-float-slow" />
        <div className="absolute bottom-10 right-6 w-3 h-3 rounded-full bg-white/40 animate-float" />
        <div className="absolute top-1/2 left-4 w-2 h-2 rounded-full bg-yellow-200/60 animate-float" />
        <div className="absolute top-1/3 right-4 w-2 h-2 rounded-full bg-yellow-200/60 animate-float-slow" />

        <h1 className="relative text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
          ✿ {site.siteName} ✿
        </h1>
        <p className="relative mt-4 text-white/90 text-lg">
          {site.description}
        </p>
      </div>

      {/* 分类导航 */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-8">
          <Link
            href="/"
            className="px-4 py-1.5 rounded-full text-sm font-medium bg-pink-500 text-white shadow-sm hover:bg-pink-600 transition-colors"
          >
            全部
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/80 text-gray-600 border border-pink-200 hover:border-pink-400 hover:text-pink-600 transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => {
            const cat = post.categoryId ? categoryMap.get(post.categoryId) : null;
            return (
              <article
                key={post.id}
                className="group bg-white/80 backdrop-blur rounded-2xl border border-pink-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-pink-100 hover:-translate-y-1 transition-all duration-300"
              >
                <Link href={`/posts/${post.slug}`}>
                  {/* 封面 */}
                  {post.coverUrl ? (
                    <div className="aspect-[16/9] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.coverUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100">
                      <span className="text-5xl opacity-60 group-hover:scale-110 transition-transform duration-500">
                        🌸
                      </span>
                    </div>
                  )}

                  <div className="p-5">
                    {/* 分类 + 付费标记 */}
                    <div className="flex items-center gap-2 mb-2">
                      {cat && (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.name}
                        </span>
                      )}
                      {post.paid && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                          🔒 ¥{post.price}
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-gray-800 group-hover:text-pink-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <time className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString("zh-CN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                      {post.tags.length > 0 && (
                        <div className="flex gap-1.5">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full text-xs"
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
    </div>
  );
}