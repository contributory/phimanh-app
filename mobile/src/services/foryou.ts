import PhimApi from './phimapi';

type BasicMovie = {
  slug?: string;
  category?: { slug: string }[];
  country?: { slug: string }[];
  year?: number | string;
  type?: string;
  [key: string]: any;
};

const takeUnique = <T, K extends string | number>(items: T[], getKey: (item: T) => K | undefined | null) => {
  const map = new Map<K, T>();
  for (const item of items) {
    const key = getKey(item);
    if (!key || map.has(key)) continue;
    map.set(key, item);
  }
  return Array.from(map.values());
};

const extractItems = (value: any): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    if (Array.isArray(value[0])) return value[0] || [];
    return (value[0] as any[]) || [];
  }
  if (Array.isArray(value?.data?.items)) return value.data.items;
  if (Array.isArray(value.items)) return value.items;
  return [];
};

const computeScore = (movie: BasicMovie, seeds: BasicMovie[]) => {
  const movieCategories = new Set((movie.category || []).map((c) => c?.slug).filter(Boolean));
  const movieCountries = new Set((movie.country || []).map((c) => c?.slug).filter(Boolean));
  const movieYear = movie.year ? Number(movie.year) : null;
  const movieType = movie.type;
  let score = 0;
  seeds.forEach((seed, index) => {
    const weight = seeds.length - index;
    const seedCategories = (seed.category || []).map((c) => c?.slug).filter(Boolean);
    const seedCountries = (seed.country || []).map((c) => c?.slug).filter(Boolean);
    const seedYear = seed.year ? Number(seed.year) : null;
    if (seedCategories.some((s) => movieCategories.has(s))) score += 6 * weight;
    if (seedCountries.some((s) => movieCountries.has(s))) score += 4 * weight;
    if (movieYear && seedYear && movieYear === seedYear) score += 2 * weight;
    if (movieType && seed.type && movieType === seed.type) score += 3 * weight;
  });
  return score + (movie.tmdb?.vote_average || 0) * 0.5 + Math.random() * 0.01;
};

const shuffle = <T,>(items: T[]) =>
  items.map((item) => ({ item, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ item }) => item);

const buildColdStartList = async (limit: number) => {
  try {
    const api = new PhimApi();
    const tasks: Promise<any>[] = [
      api.newAdding(1),
      api.byTopic('phim-bo', 1),
      api.byTopic('phim-le', 1),
      api.byTopic('hoat-hinh', 1),
    ];
    const results = await Promise.allSettled(tasks);
    const pool: any[] = [];
    results.forEach((r) => {
      if (r.status === 'fulfilled') pool.push(...extractItems(r.value));
    });
    if (pool.length > 0) return shuffle(takeUnique(pool, (m: any) => m?.slug)).slice(0, limit);
    return api.getFallbackMoviesPublic(limit);
  } catch {
    return new PhimApi().getFallbackMoviesPublic(limit);
  }
};

export async function buildForYouList(recentlyWatched: BasicMovie[] = [], limit: number): Promise<any[]> {
  try {
    const api = new PhimApi();
    const seeds = (recentlyWatched || []).filter((m) => m?.slug).slice(0, 5);
    if (seeds.length === 0) return await buildColdStartList(limit);
    const seedDetails = await Promise.allSettled(seeds.map((s) => api.get(s.slug as string)));
    const seedMovies: BasicMovie[] = seedDetails
      .map((r, i) => (r.status === 'fulfilled' && r.value?.movie ? r.value.movie : seeds[i]))
      .filter(Boolean);
    if (seedMovies.length === 0) return await buildColdStartList(limit);
    const categorySlugs = new Set<string>();
    const countrySlugs = new Set<string>();
    const yearValues = new Set<number>();
    const typeSlugs = new Set<string>();
    seedMovies.forEach((m) => {
      (m.category || []).forEach((c) => c?.slug && categorySlugs.add(c.slug));
      (m.country || []).forEach((c) => c?.slug && countrySlugs.add(c.slug));
      if (m.year) yearValues.add(Number(m.year));
      if (m.type) typeSlugs.add(m.type);
    });
    const tasks: Promise<any>[] = [];
    Array.from(categorySlugs).slice(0, 3).forEach((s) => tasks.push(api.byCategory(s, 1)));
    Array.from(countrySlugs).slice(0, 2).forEach((s) => tasks.push(api.getFilteredList({ country: s, limit: limit * 2 })));
    Array.from(yearValues).slice(0, 2).forEach((y) => tasks.push(api.getFilteredList({ year: y, limit: limit * 2 })));
    Array.from(typeSlugs).slice(0, 2).forEach((t) => tasks.push(api.byTopic(t, 1)));
    tasks.push(api.newAdding(1));
    const results = await Promise.allSettled(tasks);
    const pool: any[] = [];
    results.forEach((r) => {
      if (r.status === 'fulfilled') pool.push(...extractItems(r.value));
    });
    if (pool.length > 0) {
      const seedSlugs = new Set(seedMovies.map((m) => m.slug).filter(Boolean));
      const unique = takeUnique(pool, (m: any) => m?.slug).filter((m) => m?.slug && !seedSlugs.has(m.slug));
      const scored = unique.map((movie) => ({ movie, score: computeScore(movie, seedMovies) })).sort((a, b) => b.score - a.score);
      let selected = scored.slice(0, limit).map((x) => x.movie);
      if (selected.length < limit) {
        const cold = await buildColdStartList(limit * 2);
        const extra = cold.filter((m) => m?.slug && !seedSlugs.has(m.slug) && !selected.some((s) => s.slug === m.slug));
        selected = [...selected, ...extra].slice(0, limit);
      }
      return selected;
    }
    return await buildColdStartList(limit);
  } catch {
    return new PhimApi().getFallbackMoviesPublic(limit);
  }
}
