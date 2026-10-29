import { getPaymentSettings } from "@/lib/settings";
import DonateCard from "./DonateCard";

// 全站赞赏横幅：插入到所有前台页面底部（LayoutShell 中渲染）
// 只要配置了收款码就展示，与文章底部逻辑一致
export default async function DonateBanner() {
  const payment = await getPaymentSettings();
  const { wechatQr, alipayQr } = payment.donate;

  if (!wechatQr && !alipayQr) return null;

  return (
    <div className="mt-12">
      <DonateCard
        title="支持一下 ~"
        desc="如果内容对你有帮助，欢迎请作者喝杯咖啡 ☕"
        wechatQr={wechatQr}
        alipayQr={alipayQr}
        variant="full"
      />
    </div>
  );
}
