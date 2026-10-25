"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

interface Song {
  id: number;
  name: string;
  artist: string;
  album: string;
  picUrl: string;
  duration: number;
}

function formatTime(sec: number) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.6);
  const [expanded, setExpanded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [failedIds, setFailedIds] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement>(null);
  const pathname = usePathname();

  const current = songs[currentIdx];

  // 加载歌曲列表
  const loadSongs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/music");
      const data = await res.json();
      if (data.songs && data.songs.length > 0) {
        setSongs(data.songs);
        setCurrentIdx(0);
      } else {
        setError("暂无歌曲");
      }
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 首次展开时加载
  useEffect(() => {
    if (expanded && songs.length === 0) {
      loadSongs();
    }
  }, [expanded, songs.length, loadSongs]);

  // 播放/暂停
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (playing) {
      audio.play().catch(() => {
        // 播放失败（VIP/版权限制），标记并自动跳下一首
        setFailedIds((prev) => new Set(prev).add(current.id));
        setPlaying(false);
        setTimeout(() => next(), 500);
      });
    } else {
      audio.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, currentIdx]);

  // 切歌时重置进度并自动播放
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    setCurrentTime(0);
    setDuration(0);
    if (playing) {
      audio.load();
      audio.play().catch(() => {
        setFailedIds((prev) => new Set(prev).add(current.id));
        setTimeout(() => next(), 500);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  // 音量
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // 后台管理页不显示播放器（必须在所有 hooks 之后 return）
  if (pathname?.startsWith("/admin")) return null;

  function togglePlay() {
    if (!current) return;
    setPlaying((p) => !p);
  }

  function next() {
    if (songs.length === 0) return;
    // 最多尝试 songs.length 次，避免全部失败时死循环
    let tries = 0;
    let idx = currentIdx;
    do {
      idx = (idx + 1) % songs.length;
      tries++;
    } while (failedIds.has(songs[idx].id) && tries < songs.length);
    if (tries >= songs.length) return;
    setCurrentIdx(idx);
    setPlaying(true);
  }

  function prev() {
    if (songs.length === 0) return;
    let tries = 0;
    let idx = currentIdx;
    do {
      idx = (idx - 1 + songs.length) % songs.length;
      tries++;
    } while (failedIds.has(songs[idx].id) && tries < songs.length);
    if (tries >= songs.length) return;
    setCurrentIdx(idx);
    setPlaying(true);
  }

  function playSong(idx: number) {
    setCurrentIdx(idx);
    setPlaying(true);
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const val = Number(e.target.value);
    audio.currentTime = (val / 100) * duration;
    setCurrentTime(audio.currentTime);
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // 未展开：悬浮按钮
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        title="在线音乐"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white text-2xl shadow-xl shadow-pink-300/50 hover:shadow-pink-400/60 hover:scale-110 transition-all flex items-center justify-center"
      >
        🎵
      </button>
    );
  }

  return (
    <>
      {/* 音频元素 */}
      {current && (
        <audio
          ref={audioRef}
          src={`/api/music/stream?id=${current.id}`}
          onTimeUpdate={handleTimeUpdate}
          onEnded={next}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (isFinite(d)) setDuration(d);
          }}
          preload="metadata"
        />
      )}

      {/* 歌曲列表面板 */}
      {panelOpen && (
        <div className="fixed bottom-[92px] right-4 left-4 sm:left-auto sm:w-96 z-50 bg-white/95 backdrop-blur-md rounded-2xl border border-pink-100 shadow-2xl shadow-pink-200/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white">
            <span className="font-bold text-sm">🎵 伤感歌曲 · 网易云</span>
            <div className="flex items-center gap-2">
              <button
                onClick={loadSongs}
                className="text-xs bg-white/20 hover:bg-white/40 rounded-lg px-2 py-1 transition-colors"
                title="换一批"
              >
                🔄 换一批
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="text-white/80 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
          <div className="max-h-[50vh] overflow-y-auto">
            {loading && (
              <p className="text-center text-pink-300 text-sm py-8">
                加载歌曲中...
              </p>
            )}
            {error && !loading && (
              <p className="text-center text-red-400 text-sm py-8">{error}</p>
            )}
            {!loading &&
              songs.map((song, idx) => {
                const failed = failedIds.has(song.id);
                const active = idx === currentIdx;
                return (
                  <button
                    key={song.id}
                    onClick={() => !failed && playSong(idx)}
                    disabled={failed}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      active
                        ? "bg-pink-50"
                        : "hover:bg-pink-50/50"
                    } ${failed ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`w-6 text-xs text-center font-mono ${
                        active ? "text-pink-500" : "text-gray-300"
                      }`}
                    >
                      {active && playing ? "♪" : idx + 1}
                    </span>
                    {song.picUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${song.picUrl}?param=48y48`}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center text-sm flex-shrink-0">
                        🎵
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm truncate ${
                          active
                            ? "text-pink-600 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {song.name}
                        {failed && " (无法播放)"}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {song.artist}
                      </div>
                    </div>
                    <span className="text-xs text-gray-300 flex-shrink-0">
                      {formatTime(song.duration / 1000)}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* 底部播放器条 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-pink-100 shadow-[0_-4px_20px_rgba(236,72,153,0.08)]">
        <div className="mx-auto max-w-3xl px-4 py-2.5 flex items-center gap-3">
          {/* 封面+歌曲信息 */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
          >
            {current?.picUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${current.picUrl}?param=96y96`}
                alt=""
                className={`w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-pink-100 ${
                  playing ? "animate-pulse" : ""
                }`}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-lg flex-shrink-0">
                🎵
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {current ? current.name : "未播放"}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {current ? current.artist : "点击列表选择歌曲"}
              </div>
            </div>
          </button>

          {/* 控制按钮 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={prev}
              disabled={songs.length === 0}
              className="w-8 h-8 rounded-full text-gray-500 hover:bg-pink-50 hover:text-pink-500 transition-colors disabled:opacity-30 flex items-center justify-center"
              title="上一首"
            >
              ⏮
            </button>
            <button
              onClick={togglePlay}
              disabled={!current}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200 hover:shadow-pink-300 transition-all disabled:opacity-50 flex items-center justify-center text-lg"
              title={playing ? "暂停" : "播放"}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              onClick={next}
              disabled={songs.length === 0}
              className="w-8 h-8 rounded-full text-gray-500 hover:bg-pink-50 hover:text-pink-500 transition-colors disabled:opacity-30 flex items-center justify-center"
              title="下一首"
            >
              ⏭
            </button>
          </div>

          {/* 音量（桌面端显示） */}
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 w-24">
            <span className="text-xs text-gray-400">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-pink-500 h-1 cursor-pointer"
            />
          </div>

          {/* 收起按钮 */}
          <button
            onClick={() => {
              setExpanded(false);
              setPlaying(false);
              setPanelOpen(false);
            }}
            className="w-8 h-8 rounded-full text-gray-400 hover:bg-pink-50 hover:text-pink-500 transition-colors flex items-center justify-center flex-shrink-0"
            title="收起播放器"
          >
            ✕
          </button>
        </div>

        {/* 进度条 */}
        <div className="mx-auto max-w-3xl px-4 pb-1.5 flex items-center gap-2">
          <span className="text-[10px] text-gray-400 w-8 text-right font-mono">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progressPercent}
            onChange={handleSeek}
            disabled={!duration}
            className="flex-1 h-1 accent-pink-500 cursor-pointer disabled:opacity-30"
          />
          <span className="text-[10px] text-gray-400 w-8 font-mono">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </>
  );
}