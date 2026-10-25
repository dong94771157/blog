import Link from "next/link";
import { getPaymentSettings, getSiteSettings } from "@/lib/settings";
import DonateCard from "@/components/DonateCard";
import SadBoyAvatar from "@/components/SadBoyAvatar";

export const revalidate = 60;

export async function generateMetadata() {
  const payment = await getPaymentSettings();
  return { title: payment.donate.title || "赞赏支持" };
}

export default async function DonatePage() {
  const [payment, site] = await Promise.all([
    getPaymentSettings(),
    getSiteSettings(),
  ]);

  const donate = payment.donate;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/"
        className="text-sm text-gray-400 hover:text-pink-600 mb-6 inline-block transition-colors"
      >
        ← 返回首页
      </Link>

      {/* 顶部装饰 */}
      <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-pink-400 via-pink-500 to-purple-400 px-8 py-12 text-center">
        <div className="absolute top-4 left-6 w-3 h-3 rounded-full bg-white/40 animate-float" />
        <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-white/30 animate-float-slow" />
        <div className="absolute bottom-6 left-14 w-2 h-2 rounded-full bg-white/50 animate-float-slow" />
        <div className="absolute bottom-10 right-6 w-3 h-3 rounded-full bg-white/40 animate-float" />

        <div className="relative flex flex-col items-center">
          <div className="bg-white/20 backdrop-blur rounded-full p-1.5 mb-4">
            <SadBoyAvatar avatarUrl={site.avatarUrl} size={64} className="bg-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            ☕ {donate.title || "赞赏支持"}
          </h1>
          <p className="mt-3 text-white/90 text-sm leading-relaxed max-w-md">
            {donate.desc || "如果内容对你有帮助，可以请我喝杯咖啡~"}
          </p>
        </div>
      </div>

      {/* 收款码 */}
      {donate.enabled && (donate.wechatQr || donate.alipayQr) ? (
        <DonateCard
          title={donate.title}
          desc={donate.desc}
          wechatQr={donate.wechatQr}
          alipayQr={donate.alipayQr}
          variant="full"
        />
      ) : (
        <div className="text-center py-20 bg-white/60 rounded-3xl border border-pink-100">
          <div className="text-5xl mb-4">(´；ω；`)</div>
          <p className="text-gray-400">赞赏功能暂未开启</p>
          <Link
            href="/"
            className="mt-4 inline-block text-pink-500 hover:text-pink-700 underline text-sm"
          >
            返回首页 →
          </Link>
        </div>
      )}

      {/* 感谢语 */}
      {donate.enabled && (donate.wechatQr || donate.alipayQr) && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 leading-relaxed">
            每一份赞赏都是对站长持续创作的鼓励
            <br />
            <span className="text-pink-300">✿ 感谢你的支持 ✿</span>
          </p>
        </div>
      )}
    </div>
  );
}