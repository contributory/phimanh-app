import { useEffect, useRef, useState } from 'react';
import { List, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EpisodeData {
  name: string; slug: string; filename: string; link_embed: string; link_m3u8: string;
}
interface ServerData { server_name: string; server_data: EpisodeData[]; }
interface Props {
  serverData: ServerData[];
  currentServerIndex: number;
  currentEpisodeIndex: number;
  onSelectEpisode: (link: string, serverIndex: number, episodeIndex: number) => void;
  onServerChange: (serverIndex: number) => void;
  playerMode: 'm3u8' | 'embed';
  onPlayerModeChange: (mode: 'm3u8' | 'embed') => void;
  compact?: boolean;
}

const PER_PAGE = 50;

export default function EpisodeSelector({
  serverData, currentServerIndex, currentEpisodeIndex,
  onSelectEpisode, onServerChange, playerMode, onPlayerModeChange, compact = false,
}: Props) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  if (!serverData || serverData.length === 0) {
    return (
      <div className="w-full rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <List className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <p className="font-medium text-muted-foreground">Không có tập phim nào</p>
      </div>
    );
  }

  const currentServer = serverData[currentServerIndex];
  const all = currentServer?.server_data || [];
  const filtered = !q.trim() ? all : all.filter((ep, i) =>
    ep.name.toLowerCase().includes(q.toLowerCase().trim()) || (i + 1).toString() === q.trim());
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const items = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  useEffect(() => {
    if (currentEpisodeIndex !== undefined && !q) {
      setPage(Math.floor(currentEpisodeIndex / PER_PAGE));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisodeIndex]);

  useEffect(() => { listRef.current?.scrollTo({ top: 0 }); }, [page]);

  const pickServer = (idx: number) => {
    const first = serverData[idx]?.server_data?.[0];
    if (first) {
      if (playerMode === 'm3u8' && first.link_m3u8) onSelectEpisode(first.link_m3u8, idx, 0);
      else if (playerMode === 'embed' && first.link_embed) onSelectEpisode(first.link_embed, idx, 0);
    }
    onServerChange(idx);
    setPage(0);
    setQ('');
  };

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-xl border border-border bg-card', compact ? 'h-[500px]' : 'h-full')}>
      <div className="flex-shrink-0 border-b border-border bg-muted/50 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-bold leading-tight text-foreground">Danh sách tập</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              {currentServerIndex + 1}/{serverData.length} Server · {currentEpisodeIndex + 1}/{all.length} Tập
            </p>
          </div>
          {serverData.length > 1 && (
            <select
              value={currentServerIndex}
              onChange={(e) => pickServer(Number(e.target.value))}
              className="h-8 rounded-md border-0 bg-muted text-[11px] text-foreground"
              aria-label="Chọn server"
            >
              {serverData.map((s, i) => <option key={i} value={i}>{s.server_name}</option>)}
            </select>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 rounded-lg bg-muted p-0.5">
            {(['m3u8', 'embed'] as const).map((m) => (
              <button key={m} onClick={() => onPlayerModeChange(m)}
                className={cn('flex-1 rounded-md px-2 py-1.5 text-[10px] font-bold transition-all',
                  playerMode === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {all.length > 8 && (
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }}
              placeholder="Tìm tập..." className="h-9 w-full rounded-lg bg-muted pl-8 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        )}
      </div>
      <div ref={listRef} className="grid flex-1 grid-cols-5 content-start gap-2 overflow-y-auto p-3 sm:grid-cols-8">
        {items.map((ep, i) => {
          const globalIdx = page * PER_PAGE + i;
          const active = globalIdx === currentEpisodeIndex;
          return (
            <button
              key={`${ep.slug}-${globalIdx}`}
              onClick={() => onSelectEpisode(playerMode === 'm3u8' ? ep.link_m3u8 : ep.link_embed, currentServerIndex, globalIdx)}
              className={cn('rounded-lg px-1 py-2 text-xs font-semibold transition-colors',
                active ? 'bg-red-600 text-white' : 'bg-muted text-foreground hover:bg-muted/70')}
            >
              {ep.name}
            </button>
          );
        })}
        {items.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Không tìm thấy tập phù hợp</p>}
      </div>
      {totalPages > 1 && (
        <div className="flex flex-shrink-0 items-center justify-between border-t border-border px-3 py-2">
          <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-md bg-muted px-3 py-1 text-xs font-semibold text-foreground disabled:opacity-40">Trước</button>
          <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="rounded-md bg-muted px-3 py-1 text-xs font-semibold text-foreground disabled:opacity-40">Sau</button>
        </div>
      )}
    </div>
  );
}
