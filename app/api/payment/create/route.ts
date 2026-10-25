import { NextRequest, NextResponse } from "next/server";
import {
  createEpayOrder,
  createWechatOrder,
  createAlipayOrder,
} from "@/lib/payment";

export async function POST(request: NextRequest) {
  try {
    const { channel, amount, message } = await request.json();

    if (!channel || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "请选择支付方式并输入有效金额" },
        { status: 400 }
      );
    }

    const origin = request.nextUrl.origin;

    switch (channel) {
      case "epay": {
        const result = await createEpayOrder(amount, message || "", origin);
        return NextResponse.json({ type: "redirect", ...result });
      }
      case "wechat": {
        const result = await createWechatOrder(amount, message || "", origin);
        const QRCode = (await import("qrcode")).default;
        const qrDataUrl = await QRCode.toDataURL(result.codeUrl, {
          margin: 1,
          width: 280,
        });
        return NextResponse.json({ type: "qrcode", qrDataUrl, outTradeNo: result.outTradeNo });
      }
      case "alipay": {
        const result = await createAlipayOrder(amount, message || "", origin);
        const QRCode = (await import("qrcode")).default;
        const qrDataUrl = await QRCode.toDataURL(result.qrCode, {
          margin: 1,
          width: 280,
        });
        return NextResponse.json({ type: "qrcode", qrDataUrl, outTradeNo: result.outTradeNo });
      }
      default:
        return NextResponse.json({ error: "未知支付渠道" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "创建订单失败" },
      { status: 500 }
    );
  }
}