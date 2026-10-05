import { useEffect, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import PhimApi from '@/services/phimapi';
import { fetchMovieList } from '@/services/movie-list';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MovieGrid from '@/components/MovieGrid';
import FilterPanel from '@/components/FilterPanel';
import LoadingSpinner from '@/components/LoadingSpinner';

const api = new PhimApi();

interface Props {
  kind: 'category' | 'topic' | 'country' | 'year' | 'new' | 'filter' | 'search' | 'recently' | 'foryou';
  title?: string;
}

const TITLES: Record<string, string> = {
  new: 'Mới Cập Nhật', filter: 'Kết quả Lọc', search: 'Kết quả tìm kiếm',
  recently: 'Tiếp Tục Xem', foryou: 'Dành Cho Bạn',
};

export default function ListPage({ kind, title }: Props) {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const index = Number(params.get('index')) || 1;
  const query = params.get('query') || params.get('keyword') || '';
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<any>({ categories: [], countries: [], topics: [], movies: [], pageInfo: null, heading: '' });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const topics = api.listTopics();
        const [categories, countries] = await Promise.all([api.listCategories(), api.listCountries()]);
        let movies: any[] = [];
        let pageInfo: any = null;
        let heading = title || TITLES[kind] || '';

        if (kind === 'category' && slug) {
          const data = await fetchMovieList({ index, category: slug });
          movies = data.movies; pageInfo = data.pageInfo;
          heading = `Phim ${categories.find((c: any) => c.slug === slug)?.name || 'Thể loại'}`;
        } else if (kind === 'topic' && slug) {
          const data = await fetchMovieList({ index, topic: slug });
          movies = data.movies; pageInfo = data.pageInfo;
          heading = topics.find((t: any) => t.slug === slug)?.name || 'Danh mục';
        } else if (kind === 'country' && slug) {
          const data = await fetchMovieList({ index, country: slug });
          movies = data.movies; pageInfo = data.pageInfo;
          heading = `Phim ${countries.find((c: any) => c.slug === slug)?.name || slug}`;
        } else if (kind === 'year' && slug) {
          const data = await fetchMovieList({ index, year: slug });
          movies = data.movies; pageInfo = data.pageInfo;
          heading = `Phim năm ${slug}`;
        } else if (kind === 'filter') {
          const sp: Record<string, string | undefined> = {};
          params.forEach((v, k) => { sp[k] = v; });
          const data = await fetchMovieList({ index, searchParams: sp });
          movies = data.movies; pageInfo = data.pageInfo;
          heading = 'Kết quả Lọc';
        } else if (kind === 'search') {
          if (query.trim()) {
            const [items, pg] = await api.search(query, index);
            movies = items; pageInfo = pg;
          }
          heading = query ? `Kết quả cho "${query}"` : 'Vui lòng nhập từ khóa tìm kiếm';
        } else if (kind === 'recently') {
          const { getRecentlyWatched, hasPlaybackProgress } = await import('@/lib/user-experience');
          movies = getRecentlyWatched().filter((m: any) => hasPlaybackProgress(m.slug));
          heading = 'Tiếp Tục Xem';
        } else if (kind === 'foryou') {
          const { getRecentlyWatched } = await import('@/lib/user-experience');
          const { buildForYouList } = await import('@/services/foryou');
          movies = await buildForYouList(getRecentlyWatched(), 20);
          heading = 'Dành Cho Bạn';
        } else {
          const data = await fetchMovieList({ index });
          movies = data.movies; pageInfo = data.pageInfo;
          heading = 'Mới Cập Nhật';
        }

        if (alive) setState({ categories, countries, topics, movies, pageInfo, heading });
      } catch (e) {
        console.error(e);
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, slug, index, query, location.search]);

  return (
    <main className="content-page min-h-screen bg-[#070707]">
      <Header categories={state.categories} countries={state.countries} topics={state.topics} />
      <div className="content-page-inner">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="content-page-title">{state.heading}</h1>
          {(kind === 'filter' || kind === 'category') && (
            <FilterPanel categories={state.categories} countries={state.countries} />
          )}
        </div>
        {loading ? <LoadingSpinner label="Đang tải danh sách..." /> : <MovieGrid movies={state.movies} pageInfo={state.pageInfo} />}
      </div>
      <Footer />
    </main>
  );
}
