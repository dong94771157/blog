import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getFriendLink, updateFriendLink, deleteFriendLink } from "@/lib/settings";
import type { FriendLink } from "@/lib/types";

async function auth(request: NextRequest) {
  const token = request.cookies.get("blog_token")?.value;
  return !!(token && (await verifyToken(token)));
}

// 管理员：获取单条友链
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const link = await getFriendLink(id);
  if (!link) {
    return NextResponse.json({ error: "友链不存在" }, { status: 404 });
  }
  return NextResponse.json({ link });
}

// 管理员：审核/编辑友链
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await auth(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const updates: Partial<FriendLink> = {};

    if (body.status && ["pending", "approved", "rejected"].includes(body.status)) {
      updates.status = body.status;
    }
    if (typeof body.name === "string") updates.name = body.name.slice(0, 30);
    if (typeof body.url === "string") updates.url = body.url;
    if (typeof body.logo === "string") updates.logo = body.logo;
    if (typeof body.desc === "string") updates.desc = body.desc.slice(0, 100);

    const updated = await updateFriendLink(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "友链不存在" }, { status: 404 });
    }
    return NextResponse.json({ link: updated });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 管理员：删除友链
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await auth(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteFriendLink(id);
  if (!ok) {
    return NextResponse.json({ error: "友链不存在" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}