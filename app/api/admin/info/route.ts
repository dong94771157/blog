import { NextResponse } from "next/server";
import { getAdminSettings } from "@/lib/settings";

// 公开接口：仅返回后台外观信息（名称/Logo/欢迎语），不含敏感数据
export async function GET() {
  const settings = await getAdminSettings();
  return NextResponse.json({
    title: settings.title,
    logo: settings.logo,
    welcomeText: settings.welcomeText,
  });
}