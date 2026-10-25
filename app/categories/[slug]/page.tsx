import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getAllCategories, getCategoryBySlug } from "@/lib/store";
import type { Category } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "分类不存在" };
  return { title: category.name, description: category.description };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [allPosts, categories] = await Promise.all([
    getAllPosts(),
    getAllCategories(),
  ]);
  const posts = allPosts.filter((p) => p.categoryId === category.id);
  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  return (
    <div>
      {/* 分类头部 */}
      <div className="relative overflow-hidden rounded-3xl mb-10 px-8 py-12 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${category.color}, ${category.color}cc)` }}
      >
        <h1 className="text-3xl md:text-4xl font-bold drop-shadow">✿ {category.name} ✿</h1>
        {category.description && (
          <p className="mt-3 text-white/90">{category.description}</p>
        )}
        <p className="mt-2 text-white/70 text-sm">共 {posts.length} 篇文章</p>
      </div>

      {/* 分类导航 */}
      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href="/"
          className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/80 text-gray-600 border border-pink-200 hover:border-pink-400 hover:text-pink-600 transition-colors"
        >
          全部
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              cat.id === category.id
                ? "text-white shadow-sm"
                : "bg-white/80 text-gray-600 border border-pink-200 hover:border-pink-400 hover:text-pink-600"
            }`}
            style={cat.id === category.id ? { backgroundColor: cat.color } : {}}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">(´・ω・`)</div>
          <p className="text-lg">该分类下还没有文章呢～</p>
          <Link href="/" className="mt-4 inline-block text-pink-500 hover:text-pink-700 underline">
            ← 返回首页
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
                      <span className="text-5xl opacity-60 group-hover:scale-110 transition-transform duration-500">🌸</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {cat && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: cat.color }}>
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
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-2">{post.excerpt}</p>
                    <div className="mt-4 text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
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