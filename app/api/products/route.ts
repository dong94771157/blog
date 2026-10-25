import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  createProduct,
  getEnabledProducts,
  getAllProducts,
  genId,
} from "@/lib/settings";
import type { ProductPromo } from "@/lib/types";

// 获取产品列表
// 公开：GET /api/products  → 已启用的产品
// 管理：GET /api/products?all=1  → 全部产品
export async function GET(request: NextRequest) {
  const all = request.nextUrl.searchParams.get("all") === "1";

  if (all) {
    const token = request.cookies.get("blog_token")?.value;
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    return NextResponse.json({ products: await getAllProducts() });
  }

  return NextResponse.json({ products: await getEnabledProducts() });
}

// 管理员：新增产品
export async function POST(request: NextRequest) {
  const token = request.cookies.get("blog_token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, desc, image, url, price, badge, sort, enabled } = body;

    if (!title) {
      return NextResponse.json({ error: "产品名称不能为空" }, { status: 400 });
    }

    const product: ProductPromo = {
      id: genId("prd"),
      title: String(title).trim().slice(0, 50),
      desc: String(desc || "").trim().slice(0, 200),
      image: String(image || "").trim(),
      url: String(url || "").trim(),
      price: String(price || "").trim().slice(0, 30),
      badge: String(badge || "").trim().slice(0, 20),
      sort: Number(sort) || 0,
      enabled: enabled !== false,
      createdAt: Date.now(),
    };

    await createProduct(product);
    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}