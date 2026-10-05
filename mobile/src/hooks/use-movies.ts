import PhimApi from '@/services/phimapi';
import { fetchMovieList } from '@/services/movie-list';
import { useQuery } from '@tanstack/react-query';

const api = new PhimApi();

export const movieKeys = {
  all: ['movies'] as const,
  lists: () => [...movieKeys.all, 'list'] as const,
  list: (filters: any) => [...movieKeys.lists(), filters] as const,
  details: () => [...movieKeys.all, 'detail'] as const,
  detail: (slug: string) => [...movieKeys.details(), slug] as const,
  categories: () => ['categories'] as const,
  countries: () => ['countries'] as const,
  search: (query: string, page: number) => ['search', query, page] as const,
};

export function useMovieDetail(slug: string) {
  return useQuery({ queryKey: movieKeys.detail(slug), queryFn: () => api.get(slug), enabled: !!slug });
}
export function useNewMovies(page = 1) {
  return useQuery({ queryKey: movieKeys.list({ type: 'new', page }), queryFn: () => api.newAdding(page) });
}
export function useMoviesByCategory(slug: string, page = 1) {
  return useQuery({ queryKey: movieKeys.list({ type: 'category', slug, page }), queryFn: () => api.byCategory(slug, page), enabled: !!slug });
}
export function useMoviesByTopic(slug: string, page = 1) {
  return useQuery({ queryKey: movieKeys.list({ type: 'topic', slug, page }), queryFn: () => api.byTopic(slug, page), enabled: !!slug });
}
export function useSearchMovies(query: string, page = 1) {
  return useQuery({ queryKey: movieKeys.search(query, page), queryFn: () => api.search(query, page), enabled: !!query });
}
export function useCategories() {
  return useQuery({ queryKey: movieKeys.categories(), queryFn: () => api.listCategories(), staleTime: 30 * 60 * 1000 });
}
export function useCountries() {
  return useQuery({ queryKey: movieKeys.countries(), queryFn: () => api.listCountries(), staleTime: 30 * 60 * 1000 });
}
export function useFilteredMovies(params: any) {
  return useQuery({ queryKey: movieKeys.list({ type: 'filtered', ...params }), queryFn: () => api.getFilteredList(params) });
}
export function useMovieList(args: { index?: number; category?: string; topic?: string; country?: string; year?: string; searchParams?: Record<string, string | undefined> }) {
  const key = movieKeys.list(args);
  return useQuery({ queryKey: key, queryFn: () => fetchMovieList(args as any) });
}
