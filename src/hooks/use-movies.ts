import { useQuery, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import api from "../services/phimapi";

export const movieKeys = {
  all: ["movies"] as const,
  lists: () => [...movieKeys.all, "list"] as const,
  list: (filters: any) => [...movieKeys.lists(), filters] as const,
  details: () => [...movieKeys.all, "detail"] as const,
  detail: (slug: string) => [...movieKeys.details(), slug] as const,
  categories: () => ["categories"] as const,
  countries: () => ["countries"] as const,
  search: (query: string, page: number) => ["search", query, page] as const,
  recommended: (slug: string) => [...movieKeys.detail(slug), "recommended"] as const,
};

/** Compute the next page index from a paginated API response, or
 *  `undefined` when there are no more pages. */
function nextPageOf(lastPage: any): number | undefined {
  const pagination = lastPage?.[1];
  if (!pagination) return undefined;
  return pagination.currentPage < pagination.totalPages
    ? pagination.currentPage + 1
    : undefined;
}

/** Maximum number of pages kept in the UI-visible data window. We keep
 *  the first page (so the top of the list never blanks out) plus the most
 *  recent `MAX_PAGES - 1` pages. Anything older is dropped from the
 *  `data.pages` array so the cumulative list stays bounded.
 *
 *  This is a `select` transform — the underlying cache still retains every
 *  fetched page (so a scroll-up jump doesn't immediately empty the list) but
 *  FlatList never sees more than `MAX_PAGES * 20` items at once. Combined
 *  with the virtualization props on `FlatList`, scrolling stays smooth even
 *  after hundreds of pages have been fetched. */
const MAX_PAGES = 5;
function capPages<T>(data: { pages: T[]; pageParams: unknown[] }): typeof data {
  if (data.pages.length <= MAX_PAGES) return data;
  return {
    pages: [data.pages[0], ...data.pages.slice(-(MAX_PAGES - 1))],
    pageParams: [data.pageParams[0], ...data.pageParams.slice(-(MAX_PAGES - 1))],
  };
}

export function useMovieDetail(slug: string) {
  return useQuery({
    queryKey: movieKeys.detail(slug),
    queryFn: () => api.get(slug),
    enabled: !!slug,
    // Keep showing the previous detail while a refetch runs so the screen
    // doesn't blank out momentarily.
    placeholderData: keepPreviousData,
  });
}

export function useNewMovies(page: number = 1) {
  return useQuery({
    queryKey: movieKeys.list({ type: "new", page }),
    queryFn: () => api.newAdding(page),
    placeholderData: keepPreviousData,
  });
}

export function useMoviesByCategory(slug: string, page: number = 1) {
  return useQuery({
    queryKey: movieKeys.list({ type: "category", slug, page }),
    queryFn: () => api.byCategory(slug, page),
    enabled: !!slug,
    placeholderData: keepPreviousData,
  });
}

export function useMoviesByTopic(slug: string, page: number = 1) {
  return useQuery({
    queryKey: movieKeys.list({ type: "topic", slug, page }),
    queryFn: () => api.byTopic(slug, page),
    enabled: !!slug,
    placeholderData: keepPreviousData,
  });
}

export function useSearchMovies(query: string, page: number = 1) {
  return useQuery({
    queryKey: movieKeys.search(query, page),
    queryFn: () => api.search(query, page),
    enabled: !!query,
    placeholderData: keepPreviousData,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: movieKeys.categories(),
    queryFn: () => api.listCategories(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: movieKeys.countries(),
    queryFn: () => api.listCountries(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useRecommendedMovies(movie: any) {
  return useQuery({
    queryKey: movieKeys.recommended(movie?.slug),
    queryFn: () => api.getRecommended(movie),
    enabled: !!movie?.slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFilteredMovies(params: any) {
  return useQuery({
    queryKey: movieKeys.list({ type: "filter", ...params }),
    queryFn: () => api.getFilteredList(params),
    placeholderData: keepPreviousData,
  });
}

// ────────────────────────────────────────────────────────────────────────────
//  Infinite query variants
// ────────────────────────────────────────────────────────────────────────────
//
// The hooks above fetch one page at a time and replace their cached data on
// each page change. That's fine for *single-page* callers (HomeScreen,
// search) but it causes the "top items disappear" bug when the list is
// paginated via `useState`: switching to page 2 overwrites the page 1 cache,
// so scrolling back to the top empties the visible list.
//
// `useInfiniteQuery` keeps every loaded page in `data.pages` so we can
// `flatMap` them into a single growing list. Refetch re-fetches the first
// page but leaves the rest of the cache intact, so pull-to-refresh no longer
// wipes the visible items.

export function useNewMoviesInfinite() {
  return useInfiniteQuery({
    queryKey: movieKeys.list({ type: "new" }),
    queryFn: ({ pageParam = 1 }) => api.newAdding(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
    select: capPages,
  });
}

export function useMoviesByCategoryInfinite(slug: string) {
  return useInfiniteQuery({
    queryKey: movieKeys.list({ type: "category", slug }),
    queryFn: ({ pageParam = 1 }) => api.byCategory(slug, pageParam),
    enabled: !!slug,
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
    select: capPages,
  });
}

export function useMoviesByTopicInfinite(slug: string) {
  return useInfiniteQuery({
    queryKey: movieKeys.list({ type: "topic", slug }),
    queryFn: ({ pageParam = 1 }) => api.byTopic(slug, pageParam),
    enabled: !!slug,
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
    select: capPages,
  });
}
