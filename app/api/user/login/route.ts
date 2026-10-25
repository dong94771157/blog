import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, signUserToken, USER_COOKIE_NAME } from "@/lib/auth";
import { getUserByUsername, getUserByEmail } from "@/lib/store";

// 用户登录（支持用户名或邮箱）
export async function POST(request: NextRequest) {
  try {
    const { account, password } = await request.json();
    if (!account || !password) {
      return NextResponse.json({ error: "请输入账号和密码" }, { status: 400 });
    }

    const user = (await getUserByUsername(account)) || (await getUserByEmail(account));
    if (!user) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
    }

    const token = await signUserToken(user.id, user.username);
    const res = NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, balance: user.balance },
    });
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