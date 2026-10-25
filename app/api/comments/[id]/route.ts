import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getComment, updateComment } from "@/lib/settings";

// 管理员审核/操作单条留言
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 管理员鉴权
  const token = request.cookies.get("blog_token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { status } = body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "无效状态" }, { status: 400 });
    }

    const updated = await updateComment(id, { status });
    if (!updated) {
      return NextResponse.json({ error: "留言不存在" }, { status: 404 });
    }

    return NextResponse.json({ comment: updated });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}

// 管理员查看单条留言详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("blog_token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const comment = await getComment(id);
  if (!comment) {
    return NextResponse.json({ error: "留言不存在" }, { status: 404 });
  }
  return NextResponse.json({ comment });
}