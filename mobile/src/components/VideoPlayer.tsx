import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, Maximize, Pause, Play, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { getPlaybackProgress, savePlaybackProgress } from '@/lib/user-experience';

interface Props {
  videoUrl: string;
  autoplay?: boolean;
  poster?: string;
  movieSlug?: string;
  onEnded?: () => void;
  nextEpisodeLabel?: string;
  onNextEpisode?: () => void;
  nextRecommendationLabel?: string;
  onNextRecommendation?: () => void;
  isFinalEpisode?: boolean;
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export default function VideoPlayer({
  videoUrl, autoplay = true, poster, movieSlug, onEnded,
  nextEpisodeLabel, onNextEpisode, isFinalEpisode,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showCtl, setShowCtl] = useState(true);
  const hideTimer = useRef<any>(null);
  const playingRef = useRef(false);

  // Hen gio an controls doc tu playingRef de tranh closure cu giu playing=false
  // mai (loi controls khong bao gio tu an khi video dang chay).
  const poke = () => {
    setShowCtl(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playingRef.current) setShowCtl(false);
    }, 2800);
  };

  // Dong bo ref + quan ly hen gio theo trang thai play/pause (giong ban web).
  useEffect(() => {
    playingRef.current = playing;
    if (!playing) {
      setShowCtl(true);
      clearTimeout(hideTimer.current);
    } else {
      poke();
    }
    return () => clearTimeout(hideTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    setLoading(true);
    let hls: Hls | null = null;
    const isHls = videoUrl.includes('.m3u8');
    if (isHls && Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 30 });
      hls.loadSource(videoUrl);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        const resume = movieSlug ? getPlaybackProgress(movieSlug, videoUrl) : 0;
        if (resume > 5) { try { v.currentTime = resume; } catch {} }
        if (autoplay) v.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data?.fatal) return;
        try {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls?.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls?.recoverMediaError();
          else hls?.destroy();
        } catch { /* ignore */ }
        setLoading(false);
      });
    } else {
      v.src = videoUrl;
      const onCan = () => {
        setLoading(false);
        const resume = movieSlug ? getPlaybackProgress(movieSlug, videoUrl) : 0;
        if (resume > 5) { try { v.currentTime = resume; } catch {} }
        if (autoplay) v.play().catch(() => {});
      };
      v.addEventListener('loadedmetadata', onCan, { once: true });
      return () => v.removeEventListener('loadedmetadata', onCan);
    }
    return () => { hls?.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => { setPlaying(true); poke(); };
    const onPause = () => setPlaying(false);
    let lastSave = 0;
    const onTime = () => {
      setTime(v.currentTime);
      setDur(v.duration || 0);
      const now = Date.now();
      // Throttle: luu toi da 1 lan / 5s de tranh ghi Preferences lien tuc tren mobile
      if (movieSlug && v.duration > 0 && now - lastSave > 5000) {
        lastSave = now;
        savePlaybackProgress(movieSlug, v.currentTime, v.duration, { isFinalEpisode, videoUrl });
      }
    };
    const onEnd = () => {
      if (movieSlug && v.duration > 0) {
        savePlaybackProgress(movieSlug, v.duration, v.duration, { isFinalEpisode, videoUrl });
      }
      if (onNextEpisode) onNextEpisode();
      else onEnded?.();
    };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', onEnd);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('ended', onEnd);
    };
  }, [movieSlug, videoUrl, isFinalEpisode, onEnded, onNextEpisode]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else {
      if (movieSlug && v.duration > 0) savePlaybackProgress(movieSlug, v.currentTime, v.duration, { isFinalEpisode, videoUrl });
      v.pause();
    }
    poke();
  };

  const seek = (d: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + d), v.duration || 0);
    poke();
  };

  const fullscreen = async () => {
    const el = wrapRef.current as any;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (el?.requestFullscreen) await el.requestFullscreen();
      else if ((videoRef.current as any)?.webkitEnterFullscreen) (videoRef.current as any).webkitEnterFullscreen();
    } catch {}
    poke();
  };

  const pct = dur > 0 ? (time / dur) * 100 : 0;

  return (
    <div ref={wrapRef} className="relative h-full w-full bg-black" onTouchStart={poke} onMouseMove={poke} onClick={poke}>
      <video ref={videoRef} className="h-full w-full" poster={poster} playsInline preload="metadata" onClick={toggle} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}
      {!playing && !loading && (
        <button onClick={toggle} className="absolute inset-0 flex items-center justify-center" aria-label="Phát">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-xl">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </span>
        </button>
      )}
      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-8 transition-opacity ${showCtl || !playing ? 'opacity-100' : 'opacity-0'}`}>
        <input
          type="range" min={0} max={dur || 0} step={0.5} value={time}
          onChange={(e) => { const v = videoRef.current; if (v) v.currentTime = Number(e.target.value); }}
          className="w-full accent-red-600"
          aria-label="Thanh tiến trình"
        />
        <div className="flex items-center gap-2 text-white">
          <button onClick={() => seek(-10)} className="p-1.5" aria-label="Lùi 10s">-10s</button>
          <button onClick={toggle} className="p-1.5" aria-label={playing ? 'Tạm dừng' : 'Phát'}>
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
          </button>
          <button onClick={() => seek(10)} className="p-1.5" aria-label="Tới 10s">+10s</button>
          <span className="text-xs text-zinc-300">{fmt(time)} / {fmt(dur)}</span>
          <span className="flex-1" />
          {onNextEpisode && (
            <button onClick={onNextEpisode} className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold" aria-label="Tập tiếp">
              <SkipForward className="h-4 w-4" /> {nextEpisodeLabel || 'Tập tiếp'}
            </button>
          )}
          <button onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted); } }} className="p-1.5" aria-label="Âm lượng">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <button onClick={fullscreen} className="p-1.5" aria-label="Toàn màn hình">
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="absolute left-0 top-0 h-0.5 bg-red-600" style={{ width: `${pct}%` }} />
    </div>
  );
}
