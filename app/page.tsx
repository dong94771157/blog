import Link from "next/link";
import { getAllPosts } from "@/lib/store";

// ISR：每 60 秒重新验证，后台发布文章后前台自动更新
export const revalidate = 60;

export default async function HomePage() {
  const posts = await getAllPosts();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">最新文章</h1>
        <p className="mt-2 text-gray-500">记录技术与生活</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">还没有文章</p>
          <Link
            href="/admin"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 underline"
          >
            前往后台发布第一篇文章 →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
            >
              <Link href={`/posts/${post.slug}`}>
                <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                  {post.title}
                </h2>
              </Link>
              <p className="mt-2 text-gray-500 text-sm leading-relaxed line-clamp-2">
                {post.excerpt}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                <time>
                  {new Date(post.createdAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                {post.tags.length > 0 && (
                  <div className="flex gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}