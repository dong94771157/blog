import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getCurrentUserId } from "@/lib/auth";
import {
  createComment,
  getCommentsByPost,
  getAllComments,
} from "@/lib/settings";
import { moderateContent } from "@/lib/ai";
import { sendNotification } from "@/lib/notify";
import { getAISettings, getSiteSettings } from "@/lib/settings";
import { getPostById } from "@/lib/store";
import type { Comment } from "@/lib/types";

function genId() {
  return `cmt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// 获取留言列表
// ?postId=xxx  公开：获取某文章已通过的留言
// ?all=1       管理：获取全部留言
export async function GET(request: NextRequest) {
  const all = request.nextUrl.searchParams.get("all") === "1";
  const postId = request.nextUrl.searchParams.get("postId");

  if (all) {
    // 管理员鉴权
    const token = request.cookies.get("blog_token")?.value;
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    return NextResponse.json({ comments: await getAllComments() });
  }

  if (!postId) {
    return NextResponse.json({ error: "缺少 postId" }, { status: 400 });
  }

  // 公开接口：只返回已通过的留言
  return NextResponse.json({
    comments: await getCommentsByPost(postId),
  });
}

// 发表留言（AI 自动审核）
export async function POST(request: NextRequest) {
  try {
    // 留言功能开关检查
    const siteSettings = await getSiteSettings();
    if (!siteSettings.commentEnabled) {
      return NextResponse.json({ error: "留言功能暂未开放" }, { status: 403 });
    }

    const body = await request.json();
    const { postId, authorName, content } = body;

    if (!postId || !content || !String(content).trim()) {
      return NextResponse.json({ error: "文章 ID 和留言内容不能为空" }, { status: 400 });
    }
    if (String(content).length > 1000) {
      return NextResponse.json({ error: "留言不能超过 1000 字" }, { status: 400 });
    }

    // 获取文章信息
    const post = await getPostById(postId);
    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 获取当前登录用户（可选）
    const userId = await getCurrentUserId(request);
    const name = String(authorName || "").trim().slice(0, 30) || "匿名访客";

    // AI 审核
    const aiSettings = await getAISettings();
    const moderation = aiSettings.moderationEnabled
      ? await moderateContent(String(content), name)
      : { violated: false, reason: "", category: "none" };

    // 确定状态
    let status: Comment["status"];
    if (moderation.violated) {
      status = "rejected";
    } else if (aiSettings.moderationEnabled && !aiSettings.autoApprove) {
      status = "pending";
    } else {
      status = "approved";
    }

    const comment: Comment = {
      id: genId(),
      postId,
      postTitle: post.title,
      userId,
      authorName: name,
      content: String(content).trim(),
      status,
      aiReview: aiSettings.moderationEnabled
        ? {
            violated: moderation.violated,
            reason: moderation.reason,
            category: moderation.category,
          }
        : null,
      createdAt: Date.now(),
    };

    await createComment(comment);

    // 违规时邮件通知站长
    if (moderation.violated && aiSettings.notifyOnViolation) {
      const site = await getSiteSettings();
      sendNotification({
        title: `🚨 ${site.siteName} 留言违规警告`,
        content: [
          `AI 审核发现一条违规留言，已自动拦截。`,
          ``,
          `文章：${post.title}`,
          `昵称：${name}`,
          `内容：${String(content).trim().slice(0, 200)}`,
          `违规类型：${moderation.category}`,
          `违规原因：${moderation.reason}`,
        ].join("\n"),
      }).catch(() => {}); // 异步通知，不阻塞响应
    }

    // 返回给用户的结果
    if (moderation.violated) {
      return NextResponse.json({
        success: false,
        status: "rejected",
        message: "您的留言包含违规内容，已被系统拦截，请文明发言。",
        comment: null,
      });
    }

    if (status === "pending") {
      return NextResponse.json({
        success: true,
        status: "pending",
        message: "留言已提交，等待审核通过后显示。",
        comment: null,
      });
    }

    return NextResponse.json({
      success: true,
      status: "approved",
      message: "留言成功！",
      comment,
    });
  } catch {
    return NextResponse.json({ error: "留言失败，请稍后重试" }, { status: 500 });
  }
}