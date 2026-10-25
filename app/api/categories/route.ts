import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAllCategories, createCategory } from "@/lib/store";

// 获取全部分类（公开）
export async function GET() {
  const categories = await getAllCategories();
  return NextResponse.json({ categories });
}

// 创建分类（管理员）
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { name, slug, description, color } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
    }

    const category = await createCategory({
      name,
      slug: slug || "",
      description: description || "",
      color: color || "#ec4899",
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}