import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getPaymentSettings } from "@/lib/settings";
import {
  createEpayOrder,
  createWechatOrder,
  createAlipayOrder,
} from "@/lib/payment";

// 用户余额充值 - 创建充值订单
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { channel, amount } = await request.json();

    if (!channel || !amount || amount <= 0) {
      return NextResponse.json({ error: "请选择支付方式并输入有效金额" }, { status: 400 });
    }

    // 充值功能开关与金额范围校验
    const payment = await getPaymentSettings();
    if (!payment.general.rechargeEnabled) {
      return NextResponse.json({ error: "充值功能暂未开放" }, { status: 403 });
    }
    const { minRecharge, maxRecharge } = payment.general;
    if (amount < minRecharge || amount > maxRecharge) {
      return NextResponse.json(
        { error: `充值金额需在 ¥${minRecharge} - ¥${maxRecharge} 之间` },
        { status: 400 }
      );
    }

    const origin = request.nextUrl.origin;
    const options = { type: "recharge" as const, userId };

    switch (channel) {
      case "epay": {
        const result = await createEpayOrder(amount, "余额充值", origin, options);
        return NextResponse.json({ type: "redirect", ...result });
      }
      case "wechat": {
        const result = await createWechatOrder(amount, "余额充值", origin, options);
        const QRCode = (await import("qrcode")).default;
        const qrDataUrl = await QRCode.toDataURL(result.codeUrl, { margin: 1, width: 280 });
        return NextResponse.json({ type: "qrcode", qrDataUrl, outTradeNo: result.outTradeNo });
      }
      case "alipay": {
        const result = await createAlipayOrder(amount, "余额充值", origin, options);
        const QRCode = (await import("qrcode")).default;
        const qrDataUrl = await QRCode.toDataURL(result.qrCode, { margin: 1, width: 280 });
        return NextResponse.json({ type: "qrcode", qrDataUrl, outTradeNo: result.outTradeNo });
      }
      default:
        return NextResponse.json({ error: "未知支付渠道" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "创建充值订单失败" },
      { status: 500 }
    );
  }
}