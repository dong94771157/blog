import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  getPostBySlug,
  getAllCategories,
  getUserById,
  hasPurchased,
} from "@/lib/store";
import { getPaymentSettings } from "@/lib/settings";
import { verifyToken } from "@/lib/auth";
import { marked } from "marked";
import DonateButton from "@/components/DonateButton";
import PaywallCard from "@/components/PaywallCard";
import type { Category } from "@/lib/types";

// 付费文章需根据用户登录状态动态渲染
export const dynamic = "force-dynamic";

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "文章不存在" };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.published) {
    notFound();
  }

  // 获取分类
  const categories = await getAllCategories();
  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const cat = post.categoryId ? categoryMap.get(post.categoryId) : null;

  // 检查用户登录和购买状态
  let loggedIn = false;
  let balance = 0;
  let purchased = false;

  const cookieStore = await cookies();
  const userToken = cookieStore.get("user_token")?.value;
  if (userToken) {
    const payload = await verifyToken(userToken);
    if (payload && payload.role === "user" && payload.sub) {
      const user = await getUserById(payload.sub as string);
      if (user) {
        loggedIn = true;
        balance = user.balance;
        purchased = await hasPurchased(user.id, post.id);
      }
    }
  }

  // 判断是否需要付费墙
  const needPaywall = post.paid && post.price > 0 && !purchased;

  // 生成显示内容
  let displayHtml: string;
  if (needPaywall) {
    // 显示免费预览部分
    const previewContent =
      post.freeContent || post.content.slice(0, 300) + "\n\n...";
    displayHtml = await marked.parse(previewContent);
  } else {
    displayHtml = await marked.parse(post.content);
  }

  const payment = await getPaymentSettings();
  const showDonate =
    !needPaywall &&
    payment.donate.enabled &&
    (payment.epay.enabled || payment.wechat.enabled || payment.alipay.enabled);

  return (
    <article>
      <Link
        href="/"
        className="text-sm text-gray-400 hover:text-pink-600 mb-6 inline-block transition-colors"
      >
        ← 返回首页
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
          <time>
            {new Date(post.createdAt).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          {cat && (
            <Link
              href={`/categories/${cat.slug}`}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white hover:opacity-80 transition-opacity"
              style={{ backgroundColor: cat.color }}
            >
              {cat.name}
            </Link>
          )}
          {post.paid && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              🔒 付费 ¥{post.price}
            </span>
          )}
          {post.tags.length > 0 && (
            <div className="flex gap-2">
              {post.tags.map((tag) => (
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
      </header>

      <div
        className="prose-blog"
        dangerouslySetInnerHTML={{ __html: displayHtml }}
      />

      {needPaywall && (
        <PaywallCard
          postId={post.id}
          postTitle={post.title}
          price={post.price}
          loggedIn={loggedIn}
          balance={balance}
          purchased={false}
        />
      )}

      {showDonate && (
        <DonateButton
          title={payment.donate.title}
          amounts={payment.donate.amounts}
          customAmount={payment.donate.customAmount}
          channels={{
            epay: payment.epay.enabled,
            wechat: payment.wechat.enabled,
            alipay: payment.alipay.enabled,
          }}
        />
      )}
    </article>
  );
}