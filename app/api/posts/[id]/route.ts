import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getPostById, updatePost, deletePost } from "@/lib/store";
import { getSiteSettings } from "@/lib/settings";
import { notifyNewPost } from "@/lib/notify";

// 获取单篇文章
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const post = await getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }
  return NextResponse.json({ post });
}

// 更新文章
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { title, slug, content, excerpt, tags, published } = body;

    const before = await getPostById(id);
    const post = await updatePost(id, {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(content !== undefined && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(tags !== undefined && {
        tags: Array.isArray(tags)
          ? tags
          : String(tags || "").split(",").map((t: string) => t.trim()).filter(Boolean),
      }),
      ...(published !== undefined && { published: Boolean(published) }),
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 草稿转为发布时发送通知
    if (post.published && before && !before.published) {
      const site = await getSiteSettings();
      notifyNewPost(post.title, post.slug, site.siteName, request.nextUrl.origin).catch(() => {});
    }

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}

// 删除文章
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const success = await deletePost(id);
  if (!success) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}