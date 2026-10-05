import { useEffect, useState } from 'react';
import PhimApi from '@/services/phimapi';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import MovieSection from '@/components/MovieSection';
import RecentlyWatched from '@/components/RecentlyWatched';
import LoadingSpinner from '@/components/LoadingSpinner';

const api = new PhimApi();

function shuffle<T>(arr: T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}
const uniqueBySlug = (items: any[]) => {
  const seen = new Set<string>();
  return items.filter((it) => {
    if (!it?.slug || seen.has(it.slug)) return false;
    seen.add(it.slug);
    return true;
  });
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    categories: [], countries: [], topics: [],
    heroes: [], newUpdates: [], topicsWithMovies: [],
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const topics = api.listTopics();
        const [categories, countries, newUpdates, extra] = await Promise.all([
          api.listCategories(),
          api.listCountries(),
          api.newAdding(1),
          api.newAdding(2).catch(() => [[], {}]),
        ]);
        const [moviePool, tvPool] = await Promise.all([
          api.getTopicItems('phim-le', 20).catch(() => []),
          api.getTopicItems('phim-bo', 20).catch(() => []),
        ]);
        const newItems: any[] = newUpdates?.[0] || [];
        const extraItems: any[] = extra?.[0] || [];
        const imdbPool = await Promise.all(
          newItems.slice(0, 10).map(async (m: any) => {
            try {
              const d = await api.get(m.slug);
              return d.movie;
            } catch {
              return m;
            }
          }),
        );
        const getRating = (m: any) => Number(m?.imdb?.rating ?? m?.tmdb?.vote_average ?? 0);
        const pick = (items: any[], n: number, exclude: Set<string>) =>
          shuffle(items || []).filter((m) => m?.slug && !exclude.has(m.slug)).slice(0, n);
        const exclude = new Set<string>();
        const imdbCands = (imdbPool || []).filter((m) => getRating(m) > 7);
        const [imdbMovie] = pick(imdbCands.length ? imdbCands : imdbPool, 1, exclude);
        if (imdbMovie?.slug) exclude.add(imdbMovie.slug);
        const [newest] = pick(newItems.slice(0, 5), 1, exclude);
        if (newest?.slug) exclude.add(newest.slug);
        const [fromTopic] = pick(moviePool, 1, exclude);
        if (fromTopic?.slug) exclude.add(fromTopic.slug);
        const [fromTv] = pick(tvPool, 1, exclude);
        if (fromTv?.slug) exclude.add(fromTv.slug);
        const [extraR] = pick(newItems, 1, exclude);
        if (extraR?.slug) exclude.add(extraR.slug);

        const heroes = uniqueBySlug([
          imdbMovie || null,
          newest ? { ...newest, badgeText: 'Mới cập nhật' } : null,
          fromTopic ? { ...fromTopic, badgeText: 'Phim điện ảnh' } : null,
          fromTv ? { ...fromTv, badgeText: 'Chương trình truyền hình' } : null,
          extraR ? { ...extraR, badgeText: 'Đề xuất' } : null,
        ].filter(Boolean));

        const topicsWithMovies = await Promise.all(
          topics.map(async (t: any) => {
            try {
              const movies = await api.getTopicItems(t.slug, 20);
              return { ...t, movies: movies || [] };
            } catch {
              return { ...t, movies: [] };
            }
          }),
        );

        if (!alive) return;
        setData({
          categories, countries, topics,
          heroes,
          newUpdates: uniqueBySlug([...newItems, ...extraItems]).slice(0, 20),
          topicsWithMovies,
        });
      } catch (e) {
        console.error(e);
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070707] text-white">
        <Header categories={[]} countries={[]} topics={[]} />
        <LoadingSpinner full label="Đang tải phim..." />
      </main>
    );
  }

  const accents = ['emerald', 'cyan', 'violet', 'amber', 'rose'];

  return (
    <main className="min-h-screen overflow-hidden bg-[#070707] text-white">
      <Header categories={data.categories} countries={data.countries} topics={data.topics} />
      <HeroSection movies={data.heroes} />
      <div className="relative z-20 mx-auto max-w-[1500px] space-y-1 pb-24 md:space-y-2">
        <MovieSection title="Mới Cập Nhật" movies={data.newUpdates} viewAllLink="/new-updates" buttonColor="red" initialVisible={12} maxVisible={20} />
        <RecentlyWatched limit={20} />
        <div className="space-y-1 md:space-y-2">
          {data.topicsWithMovies.map((t: any, i: number) => (
            <MovieSection key={t.slug} title={t.name} movies={(t.movies || []).slice(0, 20)}
              viewAllLink={`/topic/${t.slug}`} buttonColor={accents[i % accents.length]}
              initialVisible={12} maxVisible={20} />
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
