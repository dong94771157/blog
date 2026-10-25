import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCategoryById, updateCategory, deleteCategory } from "@/lib/store";

// 获取单个分类
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) {
    return NextResponse.json({ error: "分类不存在" }, { status: 404 });
  }
  return NextResponse.json({ category });
}

// 更新分类（管理员）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const category = await updateCategory(id, body);
    if (!category) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}

// 删除分类（管理员）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const success = await deleteCategory(id);
  if (!success) {
    return NextResponse.json({ error: "分类不存在" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}