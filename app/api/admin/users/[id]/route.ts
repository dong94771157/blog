import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getUserById, updateUser, deleteUser } from "@/lib/store";

// 后台修改用户（调整余额等）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const { balance, avatar } = await request.json();
    const user = await updateUser(id, {
      ...(balance !== undefined && { balance: Math.max(0, Number(balance) || 0) }),
      ...(avatar !== undefined && { avatar }),
    });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }
    const { passwordHash: _ph, ...publicUser } = user;
    return NextResponse.json({ user: publicUser });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}

// 后台删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const success = await deleteUser(id);
  if (!success) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}