import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Play, Star } from 'lucide-react';
import { imageUrl } from '@/lib/utils';

const SLIDE_DURATION = 8000;

export default function HeroSection({ movies }: { movies: any[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || movies.length < 2) return;
    const id = setInterval(() => setActiveIndex((p) => (p + 1) % movies.length), SLIDE_DURATION);
    return () => clearInterval(id);
  }, [isPaused, movies.length]);

  const featuredMovie = movies[activeIndex];
  if (!featuredMovie) return null;

  const getRating = (m: any) => {
    const imdb = Number(m?.imdb?.rating);
    if (!Number.isNaN(imdb) && imdb > 0) return imdb.toFixed(1);
    const tmdb = Number(m?.tmdb?.vote_average);
    if (!Number.isNaN(tmdb) && tmdb > 0) return tmdb.toFixed(1);
    return null;
  };
  const featuredRating = getRating(featuredMovie);
  const featuredCategories = featuredMovie.category?.map((c: any) => c.name).slice(0, 2).join(' · ');

  return (
    <section
      className="relative h-[220px] overflow-hidden bg-[#070707] px-3 py-2.5 sm:h-[240px] sm:px-4 sm:py-3 md:h-[260px] md:px-8 md:py-4 lg:h-[280px] lg:px-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {movies.map((movie, idx) => (
        <div key={movie.slug} className={`absolute inset-0 transition-opacity duration-700 ${idx === activeIndex ? 'opacity-100' : 'opacity-0'}`}>
          <img src={imageUrl(movie.thumb_url || movie.poster_url)} alt="" className="h-full w-full scale-105 object-cover blur-[2px]" />
          <div className="absolute inset-0 bg-black/72" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_38%,rgba(255,255,255,0.08),transparent_32%),linear-gradient(to_bottom,rgba(7,7,7,0.2),#070707_92%)]" />
        </div>
      ))}

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-[1500px] items-center justify-center">
        <div className="relative h-full w-full max-w-[1320px]">
          <div className="absolute -inset-8 -z-10 rounded-[44px] bg-black/50 blur-3xl" />
          <div className="relative h-full min-h-0 overflow-hidden rounded-[20px] border border-white/[0.12] bg-zinc-950 shadow-[0_20px_55px_rgba(0,0,0,0.5)] sm:rounded-[24px]">
            {movies.map((movie, idx) => (
              <div key={`card-bg-${movie.slug}`} className={`absolute inset-0 transition-opacity duration-700 ${idx === activeIndex ? 'opacity-100' : 'opacity-0'}`}>
                <img src={imageUrl(movie.thumb_url || movie.poster_url)} alt={movie.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/72 to-black/22" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-transparent to-black/20" />
              </div>
            ))}
            <div className="relative z-30 grid h-full min-h-0 grid-rows-[1fr_auto] gap-2 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_280px] md:grid-rows-1 md:items-end md:gap-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-7">
              <div className="relative h-full min-h-0 max-w-3xl self-end">
                {movies.map((movie, idx) => {
                  const rating = getRating(movie);
                  const cats = movie.category?.map((c: any) => c.name).slice(0, 2).join(' · ');
                  return (
                    <div key={`text-${movie.slug}`} className={`absolute bottom-0 left-0 w-full ${idx === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
                      <div className="mb-3 hidden flex-wrap items-center gap-2 text-xs text-zinc-400 md:flex md:mb-4">
                        {rating && (
                          <span className="flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 font-medium text-amber-200">
                            <Star className="h-3.5 w-3.5 fill-current" />{rating}
                          </span>
                        )}
                        {movie.quality && (
                          <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 font-medium text-zinc-300 backdrop-blur-md">{movie.quality}</span>
                        )}
                      </div>
                      <h1 className="line-clamp-2 max-w-3xl text-[clamp(1.65rem,7vw,2.25rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-white sm:text-4xl md:text-[2.6rem] lg:text-5xl">
                        {movie.name}
                      </h1>
                      {movie.origin_name && (
                        <p className="mt-3 hidden line-clamp-1 text-base font-medium text-zinc-400 md:block">{movie.origin_name}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-zinc-400 sm:mt-3 sm:text-xs md:mt-4 md:gap-x-4 md:gap-y-2 md:text-sm">
                        {movie.year && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{movie.year}</span>}
                        {cats && <span className="hidden sm:inline">{cats}</span>}
                        {movie.episode_current && <span className="hidden sm:inline">{movie.episode_current}</span>}
                      </div>
                      <div className="mt-2.5 sm:mt-3 md:mt-4">
                        <Link to={`/watch?slug=${movie.slug}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 sm:px-5 sm:py-2.5 sm:text-sm">
                          <Play className="h-4 w-4 fill-current" /> Xem ngay
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="self-end md:justify-self-end">
                <div className="mb-2 hidden text-right lg:block">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Đang nổi bật</p>
                  <p className="mt-1 max-w-[320px] truncate text-sm font-medium text-zinc-300">{featuredMovie.name}</p>
                </div>
                <div className="scrollbar-hide flex max-w-full gap-2 overflow-x-auto pb-1 lg:max-w-[360px]">
                  {movies.map((movie, idx) => (
                    <button key={movie.slug} onClick={() => setActiveIndex(idx)} title={movie.name} aria-label={`Chọn ${movie.name}`}
                      className={`relative h-1.5 w-8 flex-shrink-0 overflow-hidden rounded-full border transition-all duration-300 md:h-16 md:w-28 md:rounded-xl ${idx === activeIndex ? 'border-white/70 opacity-100' : 'border-white/10 opacity-45 hover:border-white/25 hover:opacity-85'}`}>
                      <img src={imageUrl(movie.thumb_url || movie.poster_url)} alt="" className="hidden h-full w-full object-cover md:block" />
                      <span className="absolute inset-0 bg-black/15" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-6 bottom-4 z-30 hidden items-center justify-between text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500 lg:flex">
              <span>PHIMANH / FEATURED</span>
              <span>{featuredRating ? `★ ${featuredRating}` : featuredMovie.quality || 'HD'}{featuredCategories ? ` · ${featuredCategories}` : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
