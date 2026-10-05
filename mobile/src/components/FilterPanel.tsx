import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Filter, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  categories?: { slug: string; name: string }[];
  countries?: { slug: string; name: string }[];
}

const TYPE_LIST_OPTIONS = [
  { value: '', label: 'Tất Cả' },
  { value: 'phim-bo', label: 'Phim Bộ' },
  { value: 'phim-le', label: 'Phim Lẻ' },
  { value: 'tv-shows', label: 'TV Shows' },
  { value: 'hoat-hinh', label: 'Hoạt Hình' },
  { value: 'phim-vietsub', label: 'Phim Vietsub' },
  { value: 'phim-thuyet-minh', label: 'Phim Thuyết Minh' },
  { value: 'phim-long-tieng', label: 'Phim Lồng Tiếng' },
];
const SORT_FIELDS = [
  { value: 'modified.time', label: 'Thời gian cập nhật' },
  { value: '_id', label: 'ID Phim' },
  { value: 'year', label: 'Năm phát hành' },
];
const SORT_TYPES = [
  { value: 'desc', label: 'Giảm dần' },
  { value: 'asc', label: 'Tăng dần' },
];
const SORT_LANGS = [
  { value: 'vietsub', label: 'Vietsub' },
  { value: 'thuyet-minh', label: 'Thuyết Minh' },
  { value: 'long-tieng', label: 'Lồng Tiếng' },
];
const LIMITS = ['10', '20', '30', '40', '50', '64'];

const sel = 'w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none';

export default function FilterPanel({ categories = [], countries = [] }: Props) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({
    typeList: params.get('typeList') || '',
    sortField: params.get('sortField') || 'modified.time',
    sortType: params.get('sortType') || 'desc',
    sortLang: params.get('sortLang') || 'vietsub',
    category: params.get('category') || '',
    country: params.get('country') || '',
    year: params.get('year') || '',
    limit: params.get('limit') || '20',
  });

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: y - 1970 + 1 }, (_, i) => String(y - i));
  }, []);

  const set = (k: string, v: string) => setFilters((p) => ({ ...p, [k]: v }));
  const hasActive = filters.typeList !== '' || filters.category || filters.country || filters.year ||
    filters.sortField !== 'modified.time' || filters.sortType !== 'desc' || filters.sortLang !== 'vietsub' || filters.limit !== '10';

  const apply = () => {
    const p = new URLSearchParams();
    if (filters.typeList) p.set('typeList', filters.typeList);
    p.set('sortField', filters.sortField);
    p.set('sortType', filters.sortType);
    p.set('sortLang', filters.sortLang);
    if (filters.category) p.set('category', filters.category);
    if (filters.country) p.set('country', filters.country);
    if (filters.year) p.set('year', filters.year);
    p.set('limit', filters.limit);
    setOpen(false);
    navigate(`/filter?${p.toString()}`);
  };

  const reset = () => {
    setOpen(false);
    navigate('/');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn('flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition',
          hasActive ? 'border-red-600 bg-red-600 text-white' : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:text-white')}
      >
        <Filter className="h-4 w-4" />
        <span className="hidden md:inline">Lọc</span>
        {hasActive && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-red-600">!</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[120]" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-4 top-20 z-[130] max-h-[calc(100vh-120px)] overflow-auto rounded-2xl border border-white/10 bg-[#121212]/95 p-5 backdrop-blur-xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-[400px]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-lg font-bold text-transparent">Bộ Lọc Nâng Cao</h3>
              <button onClick={() => setOpen(false)} className="rounded-full bg-white/10 p-1.5 text-zinc-300 hover:bg-white/20" aria-label="Đóng">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Loại phim</p>
                <div className="flex flex-wrap gap-1.5">
                  {TYPE_LIST_OPTIONS.map((o) => (
                    <button key={o.value} onClick={() => set('typeList', o.value)}
                      className={cn('rounded-full border px-3 py-1 text-xs font-medium transition',
                        filters.typeList === o.value ? 'border-red-500 bg-red-600/20 text-white' : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-white')}>
                      {filters.typeList === o.value && <Check className="mr-1 inline h-3 w-3" />}{o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Sắp xếp theo</p>
                  <select value={filters.sortField} onChange={(e) => set('sortField', e.target.value)} className={sel}>
                    {SORT_FIELDS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Thứ tự</p>
                  <select value={filters.sortType} onChange={(e) => set('sortType', e.target.value)} className={sel}>
                    {SORT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Ngôn ngữ</p>
                <div className="flex flex-wrap gap-1.5">
                  {SORT_LANGS.map((o) => (
                    <button key={o.value} onClick={() => set('sortLang', o.value)}
                      className={cn('rounded-full border px-3 py-1 text-xs font-medium transition',
                        filters.sortLang === o.value ? 'border-red-500 bg-red-600/20 text-white' : 'border-white/10 text-zinc-400 hover:text-white')}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Thể loại</p>
                  <select value={filters.category} onChange={(e) => set('category', e.target.value)} className={sel}>
                    <option value="">Tất cả</option>
                    {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Quốc gia</p>
                  <select value={filters.country} onChange={(e) => set('country', e.target.value)} className={sel}>
                    <option value="">Tất cả</option>
                    {countries.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Năm</p>
                  <select value={filters.year} onChange={(e) => set('year', e.target.value)} className={sel}>
                    <option value="">Tất cả</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Số lượng</p>
                  <select value={filters.limit} onChange={(e) => set('limit', e.target.value)} className={sel}>
                    {LIMITS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={reset} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:text-white">
                  <RotateCcw className="h-4 w-4" /> Đặt lại
                </button>
                <button onClick={apply} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500">
                  <Check className="h-4 w-4" /> Áp dụng
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
