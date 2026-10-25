import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAllPosts, createPost } from "@/lib/store";
import { getSiteSettings } from "@/lib/settings";
import { notifyNewPost } from "@/lib/notify";

// 获取文章列表（后台管理用，包含未发布）
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const includeUnpublished = request.nextUrl.searchParams.get("all") === "1";
  const posts = await getAllPosts(includeUnpublished);
  return NextResponse.json({ posts });
}

// 创建文章
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, slug, content, excerpt, tags, published, categoryId, coverUrl, paid, price, freeContent } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "标题和内容不能为空" },
        { status: 400 }
      );
    }

    const post = await createPost({
      title,
      slug,
      content,
      excerpt,
      tags: Array.isArray(tags) ? tags : String(tags || "").split(",").map((t: string) => t.trim()).filter(Boolean),
      published: Boolean(published),
      categoryId: categoryId || null,
      coverUrl: coverUrl || "",
      paid: Boolean(paid),
      price: Number(price) || 0,
      freeContent: freeContent || "",
    });

    // 发布文章时发送通知（异步，不阻塞响应）
    if (post.published) {
      const site = await getSiteSettings();
      notifyNewPost(post.title, post.slug, site.siteName, request.nextUrl.origin).catch(() => {});
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}