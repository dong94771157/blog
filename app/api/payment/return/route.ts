import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL("/", request.url);
  const tradeNo = request.nextUrl.searchParams.get("out_trade_no");
  if (tradeNo) {
    url.searchParams.set("donate", "success");
    url.searchParams.set("trade_no", tradeNo);
  }
  return NextResponse.redirect(url);
}