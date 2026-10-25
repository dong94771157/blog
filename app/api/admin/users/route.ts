import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAllUsers, getAllPurchases } from "@/lib/store";

// 后台获取用户列表 + 购买统计
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const users = await getAllUsers().then((list) =>
    list.map(({ passwordHash: _ph, ...u }) => u)
  );
  const purchases = await getAllPurchases();

  // 统计每个用户的购买数和消费总额
  const stats = new Map<string, { count: number; total: number }>();
  for (const p of purchases) {
    const s = stats.get(p.userId) || { count: 0, total: 0 };
    s.count++;
    s.total += p.amount;
    stats.set(p.userId, s);
  }

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      purchaseCount: stats.get(u.id)?.count || 0,
      totalSpent: stats.get(u.id)?.total || 0,
    })),
  });
}