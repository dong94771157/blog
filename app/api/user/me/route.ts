import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getUserById, getUserPurchases } from "@/lib/store";

// 获取当前登录用户信息 + 购买记录
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const purchases = await getUserPurchases(userId);
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      balance: user.balance,
    },
    purchases,
  });
}