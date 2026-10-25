import { NextRequest, NextResponse } from "next/server";
import { verifyEpayNotify, markOrderPaid } from "@/lib/payment";
import { getSiteSettings } from "@/lib/settings";
import { notifyDonation } from "@/lib/notify";

export async function GET(request: NextRequest) {
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const tradeStatus = params.trade_status;
  const outTradeNo = params.out_trade_no;

  if (!outTradeNo || tradeStatus !== "TRADE_SUCCESS") {
    return new NextResponse("fail", { status: 200 });
  }

  // 验证签名
  const valid = await verifyEpayNotify(params);
  if (!valid) {
    return new NextResponse("fail", { status: 200 });
  }

  // 标记支付成功
  const order = await markOrderPaid(outTradeNo);
  if (order) {
    const site = await getSiteSettings();
    notifyDonation(order.amount, order.message, site.siteName).catch(() => {});
  }

  return new NextResponse("success", { status: 200 });
}