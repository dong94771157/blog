import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  getSiteSettings,
  saveSiteSettings,
  getNotifySettings,
  saveNotifySettings,
  getPaymentSettings,
  savePaymentSettings,
  getAISettings,
  saveAISettings,
  getAdminSettings,
  saveAdminSettings,
  getAdminCredentials,
  getMusicSettings,
  saveMusicSettings,
} from "@/lib/settings";

// 获取设置（type 参数区分：site / notify / payment）
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type") || "site";
  switch (type) {
    case "site":
      return NextResponse.json({ settings: await getSiteSettings() });
    case "notify":
      return NextResponse.json({ settings: await getNotifySettings() });
    case "payment":
      return NextResponse.json({ settings: await getPaymentSettings() });
    case "ai":
      return NextResponse.json({ settings: await getAISettings() });
    case "music":
      return NextResponse.json({ settings: await getMusicSettings() });
    case "admin": {
      const [settings, cred] = await Promise.all([
        getAdminSettings(),
        getAdminCredentials(),
      ]);
      return NextResponse.json({
        settings,
        adminUsername: cred
          ? cred.username
          : process.env.ADMIN_USERNAME || "admin",
        hasCustomCred: cred !== null,
        credUpdatedAt: cred?.updatedAt || 0,
      });
    }
    default:
      return NextResponse.json({ error: "未知设置类型" }, { status: 400 });
  }
}

// 保存设置
export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const type = request.nextUrl.searchParams.get("type") || "site";
    const settings = await request.json();

    switch (type) {
      case "site":
        return NextResponse.json({ settings: await saveSiteSettings(settings) });
      case "notify":
        return NextResponse.json({ settings: await saveNotifySettings(settings) });
      case "payment":
        return NextResponse.json({ settings: await savePaymentSettings(settings) });
      case "ai":
        return NextResponse.json({ settings: await saveAISettings(settings) });
      case "admin":
        return NextResponse.json({ settings: await saveAdminSettings(settings) });
      case "music":
        return NextResponse.json({ settings: await saveMusicSettings(settings) });
      default:
        return NextResponse.json({ error: "未知设置类型" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}