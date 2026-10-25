import { NextRequest, NextResponse } from "next/server";
import { getAllOrders } from "@/lib/settings";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // 鉴权
  const token = request.cookies.get("blog_token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const orders = await getAllOrders();
  return NextResponse.json({ orders });
}