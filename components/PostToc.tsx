import Link from "next/link";
import type { Post } from "@/lib/types";

export default function PostToc({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  // 最新 8 篇文章
  const recent = posts.slice(0, 8);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/40 p-4">
      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 mb-3">
        <span>📝</span> 最新文章
      </h3>
      <ul className="space-y-1">
        {recent.map((post, i) => (
          <li key={post.id}>
            <Link
              href={`/posts/${post.slug}`}
              className="group flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-pink-50 transition-colors"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-50 text-pink-400 text-[10px] font-bold flex items-center justify-center mt-0.5 group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">
                {i + 1}
              </span>
              <span className="text-xs text-gray-600 leading-relaxed line-clamp-2 group-hover:text-pink-600 transition-colors">
                {post.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}