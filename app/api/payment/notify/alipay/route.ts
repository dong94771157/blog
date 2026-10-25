import { NextRequest, NextResponse } from "next/server";
import { verifyAlipayNotify, markOrderPaid } from "@/lib/payment";
import { getSiteSettings } from "@/lib/settings";
import { notifyDonation } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const tradeStatus = params.trade_status;
    const outTradeNo = params.out_trade_no;

    if (!outTradeNo || (tradeStatus !== "TRADE_SUCCESS" && tradeStatus !== "TRADE_FINISHED")) {
      return new NextResponse("fail", { status: 200 });
    }

    const valid = await verifyAlipayNotify(params);
    if (!valid) {
      return new NextResponse("fail", { status: 200 });
    }

    const order = await markOrderPaid(outTradeNo);
    if (order) {
      const site = await getSiteSettings();
      notifyDonation(order.amount, order.message, site.siteName).catch(() => {});
    }

    return new NextResponse("success", { status: 200 });
  } catch {
    return new NextResponse("fail", { status: 200 });
  }
}