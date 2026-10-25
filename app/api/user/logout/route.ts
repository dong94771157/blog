import { NextResponse } from "next/server";
import { USER_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(USER_COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
  return res;
}