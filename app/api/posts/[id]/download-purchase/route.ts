import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import {
  getPostById,
  getUserById,
  updateUser,
  hasPurchasedDownload,
  createPurchase,
} from "@/lib/store";

// 购买付费下载项（使用账户余额）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const downloadId = String(body.downloadId || "");
  if (!downloadId) {
    return NextResponse.json({ error: "缺少下载项 ID" }, { status: 400 });
  }

  const post = await getPostById(id);
  if (!post || !post.published) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  const download = post.downloads.find((d) => d.id === downloadId);
  if (!download) {
    return NextResponse.json({ error: "下载项不存在" }, { status: 404 });
  }
  if (!download.paid || download.price <= 0) {
    return NextResponse.json({ error: "该下载项无需购买" }, { status: 400 });
  }

  // 已购买
  if (await hasPurchasedDownload(userId, id, downloadId)) {
    return NextResponse.json({ success: true, message: "已购买过" });
  }

  // 检查余额
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }
  if (user.balance < download.price) {
    return NextResponse.json(
      {
        error: `余额不足，需 ¥${download.price.toFixed(2)}，当前余额 ¥${user.balance.toFixed(2)}`,
      },
      { status: 400 }
    );
  }

  // 扣款 + 记录
  await updateUser(userId, { balance: user.balance - download.price });
  await createPurchase({
    userId,
    postId: id,
    postTitle: post.title,
    amount: download.price,
    downloadId,
    downloadName: download.name,
  });

  return NextResponse.json({
    success: true,
    balance: user.balance - download.price,
  });
}