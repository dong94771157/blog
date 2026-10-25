import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAllPosts, getAllUsers, getAllPurchases } from "@/lib/store";
import { getAllOrders } from "@/lib/settings";

// 后台数据统计（仪表板用）
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const [posts, users, purchases, orders] = await Promise.all([
    getAllPosts(true),
    getAllUsers(),
    getAllPurchases(),
    getAllOrders(),
  ]);

  const publishedPosts = posts.filter((p) => p.published).length;
  const paidPosts = posts.filter((p) => p.paid).length;

  // 文章销售营收
  const salesRevenue = purchases.reduce((s, p) => s + p.amount, 0);

  // 赞赏营收（已支付的赞赏订单）
  const donateRevenue = orders
    .filter((o) => o.type === "donate" && o.status === "paid")
    .reduce((s, o) => s + o.amount, 0);

  // 充值总额（已支付的充值订单）
  const rechargeTotal = orders
    .filter((o) => o.type === "recharge" && o.status === "paid")
    .reduce((s, o) => s + o.amount, 0);

  // 用户余额总计
  const userBalanceTotal = users.reduce((s, u) => s + u.balance, 0);

  return NextResponse.json({
    posts: {
      total: posts.length,
      published: publishedPosts,
      drafts: posts.length - publishedPosts,
      paid: paidPosts,
    },
    users: {
      total: users.length,
      balanceTotal: userBalanceTotal,
    },
    revenue: {
      sales: salesRevenue,
      donate: donateRevenue,
      recharge: rechargeTotal,
      total: salesRevenue + donateRevenue,
    },
    orders: {
      total: orders.length,
      paid: orders.filter((o) => o.status === "paid").length,
      pending: orders.filter((o) => o.status === "pending").length,
    },
    purchases: {
      total: purchases.length,
    },
  });
}