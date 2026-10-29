import { NextRequest, NextResponse } from "next/server";
import { getMusicSettings } from "@/lib/settings";

interface SongItem {
  id: number | string;
  name: string;
  artist: string;
  album: string;
  picUrl: string;
  duration: number;
}

// 内存缓存（避免频繁请求被限流）
let cache: { key: string; response: unknown; ts: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 分钟

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// 网易云音乐搜索
async function fetchNetease(keyword: string, limit: number): Promise<SongItem[]> {
  // 随机偏移，让每次取到不同批次的歌曲
  const offset = Math.floor(Math.random() * 6) * limit;
  const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(
    keyword
  )}&type=1&limit=${limit}&offset=${offset}`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Referer: "https://music.163.com" },
  });
  if (!res.ok) throw new Error("网易云接口请求失败");
  const data = await res.json();
  const rawSongs = data?.result?.songs || [];
  return rawSongs.map((s: any) => ({
    id: s.id,
    name: s.name,
    artist: (s.artists || []).map((a: any) => a.name).join(" / "),
    album: s.album?.name || "",
    picUrl: (s.album?.picUrl || "").replace("http://", "https://"),
    duration: s.duration || 0,
  }));
}

// 自定义接口：listUrl 需 GET 返回 {songs:[{id,name,artist,album,picUrl,duration}]}
// 也兼容直接返回数组，或 {list:[...]} 结构
async function fetchCustom(listUrl: string): Promise<SongItem[]> {
  const res = await fetch(listUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error("自定义音乐接口请求失败");
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.songs || data.list || [];
  return list.map((s: any) => ({
    id: s.id,
    name: s.name || s.title || "",
    artist: s.artist || s.singer || "",
    album: s.album || s.albumName || "",
    picUrl: (s.picUrl || s.cover || s.pic || "").replace("http://", "https://"),
    duration: s.duration || s.length || 0,
  }));
}

export async function GET(request: NextRequest) {
  const music = await getMusicSettings();
  const keyword =
    request.nextUrl.searchParams.get("keyword") ||
    music.netease.keyword ||
    "伤感";

  const key = `${music.source}:${keyword}:${music.custom.listUrl}`;
  if (cache && cache.key === key && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.response);
  }

  let songs: SongItem[];
  try {
    if (music.source === "custom" && music.custom.listUrl) {
      songs = await fetchCustom(music.custom.listUrl);
    } else {
      const limit = music.netease.limit || 50;
      songs = await fetchNetease(keyword, limit);
    }
  } catch {
    return NextResponse.json(
      { songs: [], error: "获取歌曲失败，请稍后重试" },
      { status: 500 }
    );
  }

  const response = {
    songs,
    keyword,
    total: songs.length,
    source: music.source,
    label: music.label,
    enabled: music.enabled,
  };
  cache = { key, response, ts: Date.now() };
  return NextResponse.json(response);
}
