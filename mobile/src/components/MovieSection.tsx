import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

interface Props {
  title: string;
  movies: any[];
  viewAllLink: string;
  emptyMessage?: string;
  initialVisible?: number;
  maxVisible?: number;
  buttonColor?: string;
}

const ACCENTS: Record<string, string> = {
  red: '#ef4444', green: '#22c55e', purple: '#a855f7', violet: '#8b5cf6',
  cyan: '#06b6d4', amber: '#f59e0b', rose: '#f43f5e', emerald: '#10b981',
};

export default function MovieSection({
  title, movies = [], viewAllLink, emptyMessage = 'Chưa có phim nào',
  initialVisible = 12, maxVisible = 20, buttonColor = 'violet',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const maxItems = Math.min(maxVisible, movies.length || 0);
  const [visibleCount, setVisibleCount] = useState(() => (maxItems ? Math.min(initialVisible, maxItems) : 0));
  const displayed = movies.slice(0, visibleCount || 0);
  const accent = ACCENTS[buttonColor] || ACCENTS.violet;

  const scroll = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -560 : 560, behavior: 'smooth' });

  const maybeLoadMore = () => {
    const el = scrollRef.current;
    if (!el || !maxItems) return;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 240) {
      setVisibleCount((p) => Math.min(p + 4, maxItems));
    }
  };

  return (
    <section
      className="relative mx-2 my-3 overflow-hidden rounded-[28px] border border-white/[0.07] bg-white/[0.02] py-5 md:mx-4 md:my-4 md:py-7"
      style={{ background: `radial-gradient(circle at 8% 0%, ${accent}26 0%, transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)` }}
    >
      <div className="pointer-events-none absolute -right-24 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full blur-3xl md:h-64 md:w-64" style={{ backgroundColor: `${accent}18` }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent 8%, ${accent}aa 50%, transparent 92%)` }} />
      <div className="relative z-10 mb-4 flex items-end justify-between px-4 md:px-8 lg:px-10">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-8 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 22px ${accent}88` }} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: `${accent}cc` }}>Khám phá</p>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-100 md:text-2xl">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 md:flex">
            <button onClick={() => scroll('left')} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-500 transition hover:border-white/15 hover:bg-white/[0.07] hover:text-white" aria-label={`Cuộn ${title} sang trái`}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => scroll('right')} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-500 transition hover:border-white/15 hover:bg-white/[0.07] hover:text-white" aria-label={`Cuộn ${title} sang phải`}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Link to={viewAllLink} className="ml-1 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition hover:brightness-125"
            style={{ color: accent, backgroundColor: `${accent}12`, border: `1px solid ${accent}26` }}>
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      <div className="relative z-10 overflow-hidden px-4 md:px-8 lg:px-10">
        {displayed.length > 0 ? (
          <div ref={scrollRef} onScroll={maybeLoadMore} className="scrollbar-hide flex snap-x gap-3.5 overflow-x-auto pb-5 pt-1 md:gap-4">
            {displayed.map((movie: any, i: number) => (
              <div key={`${movie.slug}-${i}`} className="w-[220px] flex-shrink-0 snap-start sm:w-[250px] md:w-[270px] xl:w-[285px]">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-14 text-center text-sm text-zinc-500">{emptyMessage}</div>
        )}
      </div>
    </section>
  );
}
