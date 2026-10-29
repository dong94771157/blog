import { NextRequest } from "next/server";

// 图片代理
// 部分图床（如草料二维码 cli.im）有 Referer 防盗链，
// 浏览器 <img> 标签即使设置 referrerPolicy="no-referrer" 也可能被拒绝。
// 通过服务端代理转发图片，绕过防盗链。

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// 禁止访问的内网/保留地址（防 SSRF）
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0" || h === "::" || h === "::1") return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a >= 224) return true; // 组播/保留段
  }
  return false;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return new Response("Missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return new Response("Only http/https allowed", { status: 400 });
  }
  if (isBlockedHost(target.hostname)) {
    return new Response("Blocked host", { status: 403 });
  }

  try {
    // 带上目标站点同源 Referer + 浏览器 UA，绕过常见防盗链
    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent": UA,
        Referer: target.origin + "/",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok || !res.body) {
      return new Response("Image not available", { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new Response("Not an image", { status: 415 });
    }

    const outHeaders = new Headers();
    outHeaders.set("Content-Type", contentType);
    const contentLength = res.headers.get("content-length");
    if (contentLength) outHeaders.set("Content-Length", contentLength);
    outHeaders.set("Cache-Control", "public, max-age=86400, s-maxage=86400");

    return new Response(res.body, { status: 200, headers: outHeaders });
  } catch {
    return new Response("Image proxy error", { status: 502 });
  }
}