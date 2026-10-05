import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown, Clock, Globe, Heart, Play, Sparkles, Star } from 'lucide-react';
import { cn, imageUrl, stripHtml } from '@/lib/utils';
import { getFavoriteMovies, getLastEpisode, pushRecentlyWatched, saveLastEpisode, toggleFavoriteMovie } from '@/lib/user-experience';
import PhimApi from '@/services/phimapi';
import VideoPlayer from './VideoPlayer';
import EmbedPlayer from './EmbedPlayer';
import EpisodeSelector from './EpisodeSelector';
import MovieCard from './MovieCard';

interface Props {
  movie: any;
  serverData: any[];
  slug: string;
}

const api = new PhimApi();

export default function MovieDescription({ movie, serverData, slug }: Props) {
  const navigate = useNavigate();
  const [showTrailer, setShowTrailer] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [curIdx, setCurIdx] = useState<{ server: number; episode: number } | null>(null);
  const [mode, setMode] = useState<'m3u8' | 'embed'>('m3u8');
  const [recs, setRecs] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(getFavoriteMovies().some((m) => m.slug === movie.slug));
    pushRecentlyWatched({
      slug: movie.slug, name: movie.name, poster_url: movie.poster_url,
      thumb_url: movie.thumb_url, year: movie.year, quality: movie.quality, timestamp: Date.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.slug]);

  useEffect(() => {
    let alive = true;
    api.getRecommended(movie).then((r) => alive && setRecs((r || []).slice(0, 20))).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.slug]);

  useEffect(() => {
    if (!serverData?.length) return;
    const saved = getLastEpisode(movie.slug);
    if (saved && serverData[saved.serverIndex]?.server_data?.[saved.episodeIndex]) {
      const ep = serverData[saved.serverIndex].server_data[saved.episodeIndex];
      if (mode === 'm3u8' && ep.link_m3u8) {
        setCurrentUrl(ep.link_m3u8);
        setCurIdx({ server: saved.serverIndex, episode: saved.episodeIndex });
        return;
      }
      if (mode === 'embed' && ep.link_embed) {
        setCurrentUrl(ep.link_embed);
        setCurIdx({ server: saved.serverIndex, episode: saved.episodeIndex });
        return;
      }
    }
    let def = 0;
    for (let i = 0; i < serverData.length; i++) {
      if (serverData[i].server_name?.toLowerCase().includes('thuyết minh')) { def = i; break; }
    }
    const first = serverData[def]?.server_data?.[0];
    if (first) {
      if (mode === 'm3u8' && first.link_m3u8) {
        setCurrentUrl(first.link_m3u8);
        setCurIdx({ server: def, episode: 0 });
      } else if (mode === 'embed' && first.link_embed) {
        setCurrentUrl(first.link_embed);
        setCurIdx({ server: def, episode: 0 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverData, movie.slug]);

  useEffect(() => {
    if (currentUrl && curIdx && movie.slug) {
      saveLastEpisode(movie.slug, curIdx.server, curIdx.episode, serverData?.[curIdx.server]?.server_data?.[curIdx.episode]?.name);
    }
  }, [currentUrl, curIdx, movie.slug, serverData]);

  const pick = (link: string, s: number, e: number) => {
    setCurrentUrl(link);
    setCurIdx({ server: s, episode: e });
  };

  const changeServer = (s: number) => {
    setCurIdx({ server: s, episode: 0 });
    const first = serverData?.[s]?.server_data?.[0];
    if (first) {
      if (mode === 'm3u8' && first.link_m3u8) setCurrentUrl(first.link_m3u8);
      else if (mode === 'embed' && first.link_embed) setCurrentUrl(first.link_embed);
    }
  };

  const changeMode = (m: 'm3u8' | 'embed') => {
    setMode(m);
    if (curIdx && serverData) {
      const ep = serverData[curIdx.server]?.server_data?.[curIdx.episode];
      if (ep) {
        if (m === 'm3u8' && ep.link_m3u8) setCurrentUrl(ep.link_m3u8);
        else if (m === 'embed' && ep.link_embed) setCurrentUrl(ep.link_embed);
      }
    }
  };

  const currentServer = curIdx ? serverData?.[curIdx.server] : null;
  const isFinal = Boolean(curIdx && currentServer?.server_data?.length && curIdx.episode >= currentServer.server_data.length - 1);
  const nextEp = useMemo(() => {
    if (!curIdx || !currentServer || isFinal) return null;
    const n = curIdx.episode + 1;
    const ep = currentServer.server_data[n];
    if (!ep?.link_m3u8) return null;
    return { serverIndex: curIdx.server, episodeIndex: n, episode: ep };
  }, [curIdx, currentServer, isFinal]);

  const playNext = () => {
    if (!nextEp) return;
    setCurrentUrl(nextEp.episode.link_m3u8);
    setCurIdx({ server: nextEp.serverIndex, episode: nextEp.episodeIndex });
  };

  const trailerId = useMemo(() => {
    const u: string = movie.trailer_url || '';
    const m = u.match(/[?&]v=([^&]+)/) || u.match(/youtu\.be\/([^?]+)/);
    return m ? m[1] : '';
  }, [movie.trailer_url]);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-8 pt-4 md:px-8 lg:px-10">
      <div className="flex min-w-0 flex-col gap-6 lg:flex-row">
        <div className="w-full min-w-0 flex-1 space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
            {mode === 'm3u8' ? (
              <VideoPlayer
                videoUrl={currentUrl} autoplay poster={movie.thumb_url || movie.poster_url}
                movieSlug={slug} isFinalEpisode={isFinal}
                nextEpisodeLabel={nextEp?.episode?.name}
                onNextEpisode={nextEp ? playNext : undefined}
                nextRecommendationLabel={undefined}
                onEnded={playNext}
              />
            ) : (
              <EmbedPlayer videoUrl={currentUrl} />
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
              {movie.name}
              {movie.origin_name && movie.origin_name !== movie.name && (
                <span className="ml-2 text-lg font-normal text-muted-foreground sm:text-xl">({movie.origin_name})</span>
              )}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border-0 bg-muted px-3 py-1 text-sm text-foreground">{movie.year}</span>
                {movie.quality && <span className="rounded-md border-0 bg-muted px-3 py-1 text-sm text-foreground">{movie.quality}</span>}
                {movie.lang && <span className="rounded-md border-0 bg-muted px-3 py-1 text-sm text-foreground">{movie.lang}</span>}
                {movie.time && <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> {movie.time}</span>}
                {movie.country?.length > 0 && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" /> {movie.country.map((c: any) => c.name).join(', ')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {trailerId && (
                  <button onClick={() => setShowTrailer(true)} className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80">
                    <Play className="h-4 w-4" /> Trailer
                  </button>
                )}
                <button
                  onClick={() => { toggleFavoriteMovie(movie); setLiked((v) => !v); }}
                  className={cn('rounded-full bg-muted p-2 text-foreground transition-colors hover:bg-muted/80', liked && 'text-red-500')}
                  aria-label="Yêu thích"
                >
                  <Heart className={cn('h-5 w-5', liked && 'fill-current')} />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card/80">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm font-semibold text-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{movie.year}</span>
                  <div className="flex flex-wrap gap-2">
                    {movie.category?.slice(0, 3).map((cat: any) => (
                      <Link key={cat.slug} to={`/category/${cat.slug}`} className="text-primary transition-colors hover:text-primary/80">#{cat.name}</Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className={cn('overflow-hidden text-sm leading-relaxed text-foreground transition-all duration-300', showDetails ? 'max-h-[2000px]' : 'max-h-20')}>
                <p className="whitespace-pre-line">{stripHtml(movie.content)}</p>
                {showDetails && (
                  <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
                    {movie.director?.length > 0 && (
                      <div><span className="mb-1 block text-xs uppercase text-muted-foreground">Đạo diễn</span><span className="text-sm text-foreground">{movie.director.join(', ')}</span></div>
                    )}
                    {movie.actor?.length > 0 && (
                      <div><span className="mb-1 block text-xs uppercase text-muted-foreground">Diễn viên</span><span className="line-clamp-2 text-sm text-foreground">{movie.actor.join(', ')}</span></div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => setShowDetails(!showDetails)} className="mt-2 text-sm font-bold text-foreground hover:underline">
                {showDetails ? 'Ẩn bớt' : 'Hiện thêm'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 lg:w-[400px]">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <EpisodeSelector
              serverData={serverData}
              currentServerIndex={curIdx?.server || 0}
              currentEpisodeIndex={curIdx?.episode || 0}
              onSelectEpisode={pick}
              onServerChange={changeServer}
              playerMode={mode}
              onPlayerModeChange={changeMode}
              compact
            />
          </div>
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 px-1 text-base font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-amber-400" /> Đề xuất cho bạn
            </h2>
            <div className="flex flex-col gap-3">
              {recs.map((rec: any) => (
                <button key={rec.slug} onClick={() => navigate(`/watch?slug=${rec.slug}`)} className="group flex gap-3 text-left">
                  <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img src={imageUrl(rec.thumb_url || rec.poster_url)} alt={rec.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] font-bold text-white">{rec.quality || 'HD'}</div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">{rec.name}</h3>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{rec.year} · {rec.lang}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground/80">{rec.origin_name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showTrailer && trailerId && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-4" onClick={() => setShowTrailer(false)}>
          <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-black/95 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-xl font-bold text-white">
                <span className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 p-2"><Play className="h-5 w-5 text-white" /></span>
                Trailer phim
              </h3>
              <button onClick={() => setShowTrailer(false)} className="rounded-full bg-white/10 px-3 py-1 text-sm text-white">Đóng</button>
            </div>
            <div className="aspect-video overflow-hidden rounded-xl ring-1 ring-white/10">
              <iframe src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`} className="h-full w-full" allowFullScreen title="Movie Trailer" />
            </div>
          </div>
        </div>
      )}

      {movie.tmdb?.vote_average > 0 && (
        <p className="flex items-center gap-1 text-sm text-amber-300">
          <Star className="h-4 w-4 fill-current" /> {Number(movie.tmdb.vote_average).toFixed(1)}
          <button onClick={() => setShowDetails((v) => !v)} className="ml-1 text-zinc-400"><ChevronDown className="h-4 w-4" /></button>
        </p>
      )}
    </div>
  );
}
