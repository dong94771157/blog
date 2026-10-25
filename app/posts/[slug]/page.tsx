import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/store";
import { getPaymentSettings } from "@/lib/settings";
import { marked } from "marked";
import DonateButton from "@/components/DonateButton";

export const revalidate = 60;

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

  const html = await marked.parse(post.content);

  const payment = await getPaymentSettings();
  const showDonate =
    payment.donate.enabled &&
    (payment.epay.enabled || payment.wechat.enabled || payment.alipay.enabled);

  return (
    <article>
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-blue-600 mb-6 inline-block"
      >
        ← 返回首页
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-gray-400">
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
                  className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div
        className="prose-blog"
        dangerouslySetInnerHTML={{ __html: html }}
      />

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