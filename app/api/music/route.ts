import { NextRequest, NextResponse } from "next/server";

// 网易云音乐 - 伤感歌曲搜索 API
// 通过服务端请求网易云搜索接口，避免浏览器跨域问题

// 简单内存缓存（避免频繁请求被限流）
let cache: { keyword: string; response: unknown; ts: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 分钟

interface SongItem {
  id: number;
  name: string;
  artist: string;
  album: string;
  picUrl: string;
  duration: number;
}

export async function GET(request: NextRequest) {
  const keyword =
    request.nextUrl.searchParams.get("keyword") || "伤感";

  // 命中缓存直接返回
  if (
    cache &&
    cache.keyword === keyword &&
    Date.now() - cache.ts < CACHE_TTL
  ) {
    return NextResponse.json(cache.response);
  }

  try {
    const limit = 50;
    // 随机偏移，让每次取到不同批次的歌曲
    const offset = Math.floor(Math.random() * 6) * limit;
    const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(
      keyword
    )}&type=1&limit=${limit}&offset=${offset}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://music.163.com",
      },
    });

    if (!res.ok) {
      throw new Error("网易云接口请求失败");
    }

    const data = await res.json();
    const rawSongs = data?.result?.songs || [];

    const songs: SongItem[] = rawSongs.map(
      (s: {
        id: number;
        name: string;
        artists?: { name: string }[];
        album?: { name?: string; picUrl?: string };
        duration?: number;
      }) => ({
        id: s.id,
        name: s.name,
        artist: (s.artists || []).map((a) => a.name).join(" / "),
        album: s.album?.name || "",
        picUrl: (s.album?.picUrl || "").replace("http://", "https://"),
        duration: s.duration || 0,
      })
    );

    const response = { songs, keyword, total: songs.length };
    cache = { keyword, response, ts: Date.now() };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { songs: [], error: "获取歌曲失败，请稍后重试" },
      { status: 500 }
    );
  }
}