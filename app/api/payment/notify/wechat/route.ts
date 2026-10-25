import { NextRequest, NextResponse } from "next/server";
import { parseWechatNotify, markOrderPaid } from "@/lib/payment";
import { getSiteSettings } from "@/lib/settings";
import { notifyDonation } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await parseWechatNotify(body);
    if (!result || result.tradeState !== "SUCCESS") {
      return NextResponse.json({ code: "FAIL", message: "解析失败" }, { status: 200 });
    }

    const order = await markOrderPaid(result.outTradeNo);
    if (order) {
      const site = await getSiteSettings();
      notifyDonation(order.amount, order.message, site.siteName).catch(() => {});
    }

    return NextResponse.json({ code: "SUCCESS", message: "成功" }, { status: 200 });
  } catch {
    return NextResponse.json({ code: "FAIL", message: "处理失败" }, { status: 200 });
  }
}