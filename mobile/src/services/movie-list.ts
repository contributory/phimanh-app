import { fetchJson } from './http';

export type MovieListData = { movies: any[]; pageInfo: any | null };

const API_BASE_URL = 'https://phimapi.com';

export async function fetchMovieList({
  index = 1, category, topic, country, year, searchParams,
}: {
  index?: number; category?: string; topic?: string; country?: string; year?: string;
  searchParams?: Record<string, string | undefined>;
}): Promise<MovieListData> {
  const typeList = searchParams?.typeList;
  const sortField = searchParams?.sortField;
  const filterCategory = searchParams?.category;
  const filterCountry = searchParams?.country;
  const filterYear = searchParams?.year;
  const hasAdvancedFilters = typeList || sortField || filterCategory || filterCountry || filterYear;

  let url: string;
  if (hasAdvancedFilters) {
    const resolvedTypeList = typeList || 'phim-bo';
    const resolvedSortField = sortField || 'modified.time';
    const sortType = searchParams?.sortType || 'desc';
    const sortLang = searchParams?.sortLang || 'vietsub';
    const limit = searchParams?.limit || '64';
    const u = new URL(`${API_BASE_URL}/v1/api/danh-sach/${resolvedTypeList}`);
    u.searchParams.set('page', String(index));
    u.searchParams.set('sort_field', resolvedSortField);
    u.searchParams.set('sort_type', sortType);
    u.searchParams.set('limit', limit);
    if (sortLang) u.searchParams.set('sort_lang', sortLang);
    if (filterCategory) u.searchParams.set('category', filterCategory);
    if (filterCountry) u.searchParams.set('country', filterCountry);
    if (filterYear) u.searchParams.set('year', filterYear);
    url = u.toString();
  } else if (category) {
    url = `${API_BASE_URL}/v1/api/the-loai/${category}?page=${index}&limit=30`;
  } else if (topic) {
    url = `${API_BASE_URL}/v1/api/danh-sach/${topic}?page=${index}&limit=30`;
  } else if (country) {
    url = `${API_BASE_URL}/v1/api/quoc-gia/${country}?page=${index}&limit=30`;
  } else if (year) {
    url = `${API_BASE_URL}/v1/api/danh-sach/phim-bo?page=${index}&year=${year}&limit=30`;
  } else {
    url = `${API_BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${index}`;
  }

  try {
    const isSearch = !!searchParams?.keyword;
    const data = await fetchJson(url, isSearch ? { noCache: true } : {});
    if (hasAdvancedFilters || category || topic || country || year) {
      return { movies: data?.data?.items ?? [], pageInfo: data?.data?.params?.pagination ?? null };
    }
    return { movies: data?.items ?? [], pageInfo: data?.pagination ?? null };
  } catch {
    return { movies: [], pageInfo: null };
  }
}
