import { NextRequest } from "next/server";

// 网易云音乐音频流代理
// 网易云外链有 Referer 防盗链，浏览器 audio 标签无法设置 Referer，
// 通过服务端代理转发音频流

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !/^\d+$/.test(id)) {
    return new Response("Missing or invalid id", { status: 400 });
  }

  const audioUrl = `https://music.163.com/song/media/outer/url?id=${id}.mp3`;

  try {
    const res = await fetch(audioUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://music.163.com",
      },
      redirect: "follow",
    });

    if (!res.ok || !res.body) {
      return new Response("Audio not available", { status: 404 });
    }

    // 流式转发音频
    const headers = new Headers();
    const contentType = res.headers.get("content-type");
    const contentLength = res.headers.get("content-length");
    if (contentType) headers.set("Content-Type", contentType);
    if (contentLength) headers.set("Content-Length", contentLength);
    headers.set("Cache-Control", "public, max-age=3600");
    // 支持 Range 请求（音频拖动进度）
    const range = res.headers.get("content-range");
    if (range) headers.set("Content-Range", range);

    return new Response(res.body, {
      status: res.status,
      headers,
    });
  } catch {
    return new Response("Audio proxy error", { status: 502 });
  }
}