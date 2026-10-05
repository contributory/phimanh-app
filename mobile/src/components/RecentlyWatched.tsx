import { useMemo } from 'react';
import { getRecentlyWatched } from '@/lib/user-experience';
import { hasPlaybackProgress } from '@/lib/user-experience';
import MovieSection from './MovieSection';

export default function RecentlyWatched({ limit = 20 }: { limit?: number }) {
  const movies = useMemo(() => {
    const list = getRecentlyWatched();
    return list.filter((m: any) => hasPlaybackProgress(m.slug)).slice(0, Math.min(limit, 20));
  }, [limit]);
  if (movies.length === 0) return null;
  return (
    <MovieSection
      title="Tiếp Tục Xem" movies={movies} viewAllLink="/recently"
      buttonColor="purple" emptyMessage="Chưa có phim để tiếp tục xem"
      initialVisible={6} maxVisible={Math.min(limit, 20)}
    />
  );
}
