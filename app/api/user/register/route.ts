import { NextRequest, NextResponse } from "next/server";
import { hashPassword, signUserToken, USER_COOKIE_NAME } from "@/lib/auth";
import { getUserByUsername, getUserByEmail, createUser } from "@/lib/store";
import { getSiteSettings } from "@/lib/settings";

// 用户注册
export async function POST(request: NextRequest) {
  try {
    // 注册开关检查
    const site = await getSiteSettings();
    if (!site.registrationEnabled) {
      return NextResponse.json({ error: "注册功能暂未开放" }, { status: 403 });
    }

    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "用户名、邮箱和密码不能为空" }, { status: 400 });
    }
    if (username.length < 2 || username.length > 20) {
      return NextResponse.json({ error: "用户名长度需在 2-20 之间" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    // 检查重名
    if (await getUserByUsername(username)) {
      return NextResponse.json({ error: "用户名已被使用" }, { status: 400 });
    }
    if (await getUserByEmail(email)) {
      return NextResponse.json({ error: "邮箱已被注册" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      username,
      email,
      passwordHash,
      avatar: "",
      balance: 0,
    });

    const token = await signUserToken(user.id, user.username);
    const res = NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, balance: user.balance },
    }, { status: 201 });
    res.cookies.set(USER_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 3600,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}