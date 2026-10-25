import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  createFriendLink,
  getApprovedFriendLinks,
  getAllFriendLinks,
  genId,
} from "@/lib/settings";
import type { FriendLink } from "@/lib/types";

// 获取友链列表
// 公开：GET /api/friend-links  → 已通过的友链
// 管理：GET /api/friend-links?all=1  → 全部友链
export async function GET(request: NextRequest) {
  const all = request.nextUrl.searchParams.get("all") === "1";

  if (all) {
    const token = request.cookies.get("blog_token")?.value;
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    return NextResponse.json({ links: await getAllFriendLinks() });
  }

  return NextResponse.json({ links: await getApprovedFriendLinks() });
}

// 申请友链（公开接口）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, logo, desc } = body;

    if (!name || !url) {
      return NextResponse.json({ error: "站点名称和地址不能为空" }, { status: 400 });
    }
    if (String(name).length > 30) {
      return NextResponse.json({ error: "站点名称不能超过 30 字" }, { status: 400 });
    }
    if (!/^https?:\/\/.+/.test(String(url))) {
      return NextResponse.json({ error: "站点地址需以 http:// 或 https:// 开头" }, { status: 400 });
    }

    const link: FriendLink = {
      id: genId("frd"),
      name: String(name).trim().slice(0, 30),
      url: String(url).trim(),
      logo: String(logo || "").trim(),
      desc: String(desc || "").trim().slice(0, 100),
      status: "pending",
      createdAt: Date.now(),
    };

    await createFriendLink(link);

    return NextResponse.json({
      success: true,
      message: "友链申请已提交，等待站长审核通过后展示。",
    });
  } catch {
    return NextResponse.json({ error: "申请失败，请稍后重试" }, { status: 500 });
  }
}