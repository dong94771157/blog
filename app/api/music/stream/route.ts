import { NextRequest } from "next/server";
import { getMusicSettings } from "@/lib/settings";

// 音频流代理
// 网易云外链有 Referer 防盗链，浏览器 audio 标签无法设置 Referer，
// 通过服务端代理转发音频流
// 自定义源：streamUrl 模板，用 {id} 作为歌曲 id 占位符

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !/^[A-Za-z0-9_\-]+$/.test(id)) {
    return new Response("Missing or invalid id", { status: 400 });
  }

  const music = await getMusicSettings();
  let audioUrl: string;
  let referer: string | undefined;

  if (music.source === "custom" && music.custom.streamUrl) {
    audioUrl = music.custom.streamUrl.replace(/\{id\}/g, encodeURIComponent(id));
  } else {
    audioUrl = `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
    referer = "https://music.163.com";
  }

  try {
    const headers: Record<string, string> = { "User-Agent": UA };
    if (referer) headers["Referer"] = referer;
    const res = await fetch(audioUrl, { headers, redirect: "follow" });

    if (!res.ok || !res.body) {
      return new Response("Audio not available", { status: 404 });
    }

    // 流式转发音频
    const outHeaders = new Headers();
    const contentType = res.headers.get("content-type");
    const contentLength = res.headers.get("content-length");
    if (contentType) outHeaders.set("Content-Type", contentType);
    if (contentLength) outHeaders.set("Content-Length", contentLength);
    outHeaders.set("Cache-Control", "public, max-age=3600");
    const range = res.headers.get("content-range");
    if (range) outHeaders.set("Content-Range", range);

    return new Response(res.body, { status: res.status, headers: outHeaders });
  } catch {
    return new Response("Audio proxy error", { status: 502 });
  }
}
