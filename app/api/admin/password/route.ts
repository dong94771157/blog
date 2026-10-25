import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, verifyCredentials, hashPassword } from "@/lib/auth";
import { getAdminCredentials, saveAdminCredentials } from "@/lib/settings";

// 修改管理员用户名/密码
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { oldPassword, newUsername, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "请填写当前密码和新密码" },
        { status: 400 }
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "新密码至少 6 位" },
        { status: 400 }
      );
    }

    // 获取当前用户名（KV 优先，否则环境变量）
    const cred = await getAdminCredentials();
    const envUsername = process.env.ADMIN_USERNAME || "admin";
    const currentUsername = cred ? cred.username : envUsername;

    // 验证当前密码
    const valid = await verifyCredentials(currentUsername, oldPassword);
    if (!valid) {
      return NextResponse.json({ error: "当前密码错误" }, { status: 400 });
    }

    // 新用户名：未填则保持不变
    const finalUsername = (newUsername || "").trim() || currentUsername;

    // 保存新凭据到 KV
    const passwordHash = await hashPassword(newPassword);
    await saveAdminCredentials({
      username: finalUsername,
      passwordHash,
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      username: finalUsername,
      message: "密码修改成功，下次登录请使用新用户名和密码",
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}