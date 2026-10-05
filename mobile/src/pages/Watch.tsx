import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PhimApi from '@/services/phimapi';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MovieDescription from '@/components/MovieDescription';
import LoadingSpinner from '@/components/LoadingSpinner';

const api = new PhimApi();

export default function Watch() {
  const [params] = useSearchParams();
  const slug = params.get('slug') || '';
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<any>({ categories: [], countries: [], movie: null, server: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [categories, countries, detail] = await Promise.all([
          api.listCategories(), api.listCountries(), slug ? api.get(slug) : Promise.resolve({ movie: null, server: [] }),
        ]);
        if (alive) setState({ categories, countries, movie: detail.movie, server: detail.server });
      } catch (e) {
        console.error(e);
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  return (
    <main className="content-page relative min-h-screen bg-[#070707]">
      <div className="relative z-10 mx-auto w-full">
        <Header categories={state.categories} countries={state.countries} />
        <div className="mx-auto w-full max-w-[1500px] px-4 pt-2">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Trang chủ
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner label="Đang tải phim..." />
        ) : state.movie ? (
          <div className="mx-auto w-full max-w-[1500px]">
            <MovieDescription movie={state.movie} serverData={state.server} slug={slug} />
          </div>
        ) : (
          <div className="mx-auto max-w-[1500px] px-4 py-16 text-center text-zinc-400">
            Không tìm thấy phim. <Link to="/" className="text-white underline">Về trang chủ</Link>
          </div>
        )}
        <Footer />
      </div>
    </main>
  );
}
