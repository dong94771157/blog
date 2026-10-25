import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { testNotification } from "@/lib/notify";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { channel } = await request.json();
    if (!channel) {
      return NextResponse.json({ error: "缺少 channel 参数" }, { status: 400 });
    }
    const result = await testNotification(channel);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}