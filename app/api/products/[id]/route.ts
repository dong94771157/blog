import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getProduct, updateProduct, deleteProduct } from "@/lib/settings";
import type { ProductPromo } from "@/lib/types";

async function auth(request: NextRequest) {
  const token = request.cookies.get("blog_token")?.value;
  return !!(token && (await verifyToken(token)));
}

// 管理员：编辑产品
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
    const updates: Partial<ProductPromo> = {};

    if (typeof body.title === "string") updates.title = body.title.slice(0, 50);
    if (typeof body.desc === "string") updates.desc = body.desc.slice(0, 200);
    if (typeof body.image === "string") updates.image = body.image;
    if (typeof body.url === "string") updates.url = body.url;
    if (typeof body.price === "string") updates.price = body.price.slice(0, 30);
    if (typeof body.badge === "string") updates.badge = body.badge.slice(0, 20);
    if (body.sort !== undefined) updates.sort = Number(body.sort) || 0;
    if (typeof body.enabled === "boolean") updates.enabled = body.enabled;

    const updated = await updateProduct(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 });
    }
    return NextResponse.json({ product: updated });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 管理员：删除产品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await auth(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteProduct(id);
  if (!ok) {
    return NextResponse.json({ error: "产品不存在" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}