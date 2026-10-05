import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pageInfo }: { pageInfo?: any }) {
  const location = useLocation();
  const [params] = useSearchParams();
  if (!pageInfo || pageInfo.totalPages <= 1) return null;

  const qs = (page: number) => {
    const p = new URLSearchParams(params.toString());
    p.set('index', String(page));
    return `${location.pathname}?${p.toString()}`;
  };

  const total = pageInfo.totalPages;
  const cur = pageInfo.currentPage;
  const pages: (number | '...')[] = [];
  const delta = 1;
  const range: number[] = [];
  for (let i = Math.max(2, cur - delta); i <= Math.min(total - 1, cur + delta); i++) range.push(i);
  if (cur - delta > 2) pages.push(1, '...');
  else pages.push(1);
  pages.push(...range);
  if (cur + delta < total - 1) pages.push('...', total);
  else if (total > 1) pages.push(total);

  const btn = 'rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1 font-medium text-zinc-400 transition-colors hover:border-white/15 hover:bg-white/[0.08] hover:text-white';

  return (
    <nav className="flex items-center justify-center gap-2 py-4" aria-label="Phân trang">
      <Link to={qs(Math.max(1, cur - 1))} className={btn} aria-label="Trang trước">
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={i} className="px-2 text-zinc-500">…</span>
        ) : (
          <Link key={i} to={qs(p)}
            className={`rounded-lg border px-3 py-1 font-medium transition-colors ${cur === p ? 'border-white bg-white text-black' : btn}`}>
            {p}
          </Link>
        ),
      )}
      <Link to={qs(Math.min(total, cur + 1))} className={btn} aria-label="Trang sau">
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
