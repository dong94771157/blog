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
import Comments from "@/components/Comments";
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
  let username = "";

  const cookieStore = await cookies();
  const userToken = cookieStore.get("user_token")?.value;
  if (userToken) {
    const payload = await verifyToken(userToken);
    if (payload && payload.role === "user" && payload.sub) {
      const user = await getUserById(payload.sub as string);
      if (user) {
        loggedIn = true;
        balance = user.balance;
        username = user.username;
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
    (payment.epay.enabled ||
      payment.wechat.enabled ||
      payment.alipay.enabled ||
      payment.donate.wechatQr ||
      payment.donate.alipayQr);

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

      {/* 软件下载区（付费文章需购买后可见） */}
      {!needPaywall && post.downloads && post.downloads.length > 0 && (
        <div className="mt-10 mb-8 rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50/80 to-purple-50/50 p-6 shadow-lg shadow-pink-100/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💾</span>
            <h2 className="text-lg font-bold text-pink-600">软件下载</h2>
            <span className="text-xs text-pink-400 ml-auto">
              共 {post.downloads.length} 个下载项
            </span>
          </div>
          <div className="space-y-3">
            {post.downloads.map((d, idx) => (
              <div
                key={d.id}
                className="bg-white/80 rounded-xl p-4 border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-bold text-gray-800">{d.name}</span>
                  {d.version && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-500 font-medium">
                      v{d.version}
                    </span>
                  )}
                  {d.platform && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-sky-50 text-sky-500 font-medium">
                      {d.platform}
                    </span>
                  )}
                  {d.size && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                      {d.size}
                    </span>
                  )}
                </div>
                {d.note && (
                  <p className="text-xs text-gray-400 mb-2.5">{d.note}</p>
                )}
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:from-pink-600 hover:to-purple-600 transition-all shadow-md shadow-pink-200"
                >
                  ⬇ 下载{post.downloads.length > 1 ? ` #${idx + 1}` : ""}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

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
          desc={payment.donate.desc}
          amounts={payment.donate.amounts}
          customAmount={payment.donate.customAmount}
          wechatQr={payment.donate.wechatQr}
          alipayQr={payment.donate.alipayQr}
          channels={{
            epay: payment.epay.enabled,
            wechat: payment.wechat.enabled,
            alipay: payment.alipay.enabled,
          }}
        />
      )}

      <Comments
        postId={post.id}
        loggedIn={loggedIn}
        username={username}
      />
    </article>
  );
}