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

interface MusicResponse {
  songs: SongItem[];
  keyword?: string;
  playlist?: string;
  total: number;
  source: string;
  label: string;
  enabled: boolean;
}

// 内存缓存（避免频繁请求被限流）
let cache: { key: string; response: MusicResponse; ts: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 分钟

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const neteaseHeaders = {
  "User-Agent": UA,
  Referer: "https://music.163.com",
};

function toSongItem(s: any): SongItem {
  return {
    id: s.id,
    name: s.name,
    artist: (s.artists || []).map((a: any) => a.name).join(" / "),
    album: s.album?.name || "",
    picUrl: (s.album?.picUrl || "").replace("http://", "https://"),
    duration: s.duration || 0,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 网易云音乐搜索（关键词模式）
async function fetchNetease(keyword: string, limit: number): Promise<SongItem[]> {
  // 随机偏移，让每次取到不同批次的歌曲
  const offset = Math.floor(Math.random() * 6) * limit;
  const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(
    keyword
  )}&type=1&limit=${limit}&offset=${offset}`;

  const res = await fetch(url, { headers: neteaseHeaders });
  if (!res.ok) throw new Error("网易云接口请求失败");
  const data = await res.json();
  const rawSongs = data?.result?.songs || [];
  return rawSongs.map(toSongItem);
}

// 网易云精品歌单（歌单模式）：
// 1) 拉取分类下的精品歌单列表 → 随机挑一个
// 2) 取歌单全部曲目 ID → 随机抽样
// 3) 批量获取歌曲详情（含封面），过滤 VIP 专属（fee=1）与需单独购买（fee=4）的歌曲
// 4) 失败时由调用方降级到关键词搜索
async function fetchNeteasePlaylist(
  cat: string,
  limit: number
): Promise<{ songs: SongItem[]; playlistName: string }> {
  // 1) 精品歌单列表
  const listRes = await fetch(
    `https://music.163.com/api/playlist/highquality/list?cat=${encodeURIComponent(
      cat
    )}&limit=30`,
    { headers: neteaseHeaders }
  );
  if (!listRes.ok) throw new Error("网易云精品歌单接口请求失败");
  const listData = await listRes.json();
  const playlists: any[] = listData?.playlists || [];
  if (!playlists.length) throw new Error(`未找到「${cat}」分类的精品歌单`);

  // 优先从曲目数充足的歌单里随机挑一个
  const pool = playlists.filter((p) => (p.trackCount || 0) >= Math.min(limit, 10));
  const candidates = pool.length ? pool : playlists;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];

  // 2) 歌单详情（trackIds）
  const detRes = await fetch(
    `https://music.163.com/api/v3/playlist/detail?id=${picked.id}&n=1000`,
    { headers: neteaseHeaders }
  );
  if (!detRes.ok) throw new Error("网易云歌单详情接口请求失败");
  const detData = await detRes.json();
  const trackIds: number[] = (detData?.playlist?.trackIds || []).map(
    (t: any) => t.id
  );
  if (!trackIds.length) throw new Error("歌单内没有曲目");

  // 3) 随机抽样（多取一些，过滤 VIP 后再截断到 limit）
  const sampled = shuffle(trackIds).slice(0, Math.min(limit * 2, 300));
  const detailRes = await fetch(
    `https://music.163.com/api/song/detail?ids=${encodeURIComponent(
      JSON.stringify(sampled)
    )}`,
    { headers: neteaseHeaders }
  );
  if (!detailRes.ok) throw new Error("网易云歌曲详情接口请求失败");
  const detailData = await detailRes.json();
  const rawSongs: any[] = detailData?.songs || [];

  // 4) 过滤不可外链播放的歌曲（fee: 1=VIP专属 4=购买专辑），再截断
  const songs = rawSongs
    .filter((s) => s.fee !== 1 && s.fee !== 4)
    .slice(0, limit)
    .map(toSongItem);

  if (!songs.length) throw new Error("歌单内没有可播放的歌曲");
  return { songs, playlistName: picked.name || "" };
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
  const cat =
    request.nextUrl.searchParams.get("cat") ||
    music.netease.cat ||
    "伤感";
  const keyword =
    request.nextUrl.searchParams.get("keyword") ||
    music.netease.keyword ||
    "伤感";

  const key = `${music.source}:${keyword}:${cat}:${music.custom.listUrl}`;
  if (cache && cache.key === key && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.response);
  }

  const limit = music.netease.limit || 50;
  let songs: SongItem[];
  let response: MusicResponse;

  try {
    if (music.source === "custom" && music.custom.listUrl) {
      songs = await fetchCustom(music.custom.listUrl);
      response = {
        songs,
        total: songs.length,
        source: music.source,
        label: music.label,
        enabled: music.enabled,
      };
    } else if (music.source === "playlist") {
      // 歌单模式：拉精品歌单，失败时降级为关键词搜索
      let playlistName = "";
      try {
        const r = await fetchNeteasePlaylist(cat, limit);
        songs = r.songs;
        playlistName = r.playlistName;
      } catch {
        songs = await fetchNetease(keyword, limit);
      }
      response = {
        songs,
        keyword,
        playlist: playlistName,
        total: songs.length,
        source: music.source,
        label: music.label,
        enabled: music.enabled,
      };
    } else {
      songs = await fetchNetease(keyword, limit);
      response = {
        songs,
        keyword,
        total: songs.length,
        source: music.source,
        label: music.label,
        enabled: music.enabled,
      };
    }
  } catch {
    return NextResponse.json(
      { songs: [], error: "获取歌曲失败，请稍后重试" },
      { status: 500 }
    );
  }

  cache = { key, response, ts: Date.now() };
  return NextResponse.json(response);
}
