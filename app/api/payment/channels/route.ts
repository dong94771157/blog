import { NextResponse } from "next/server";
import { getPaymentSettings } from "@/lib/settings";

// 公开接口：返回各支付渠道是否启用（不含任何密钥信息）
export async function GET() {
  const payment = await getPaymentSettings();
  return NextResponse.json({
    channels: {
      epay: payment.epay.enabled,
      wechat: payment.wechat.enabled,
      alipay: payment.alipay.enabled,
    },
    donate: {
      enabled: payment.donate.enabled,
    },
  });
}