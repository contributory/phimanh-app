import {
  CategoryItem,
  MovieListResult,
  MovieItem,
  Pagination,
  WatchResult,
} from "../types";

const API_URL = "https://phimapi.com";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 10000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

async function fetchJson(url: string, retryCount = 0): Promise<any> {
  try {
    const response = await fetchWithTimeout(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      if (response.status >= 500 && response.status < 600 && retryCount < MAX_RETRIES) {
        await sleep(RETRY_DELAY * (retryCount + 1));
        return fetchJson(url, retryCount + 1);
      }
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    if (
      (error?.name === "AbortError" || String(error?.message).includes("fetch")) &&
      retryCount < MAX_RETRIES
    ) {
      await sleep(RETRY_DELAY * (retryCount + 1));
      return fetchJson(url, retryCount + 1);
    }
    throw error;
  }
}

function getFallbackMovies(limit = 10): MovieItem[] {
  return Array.from({ length: limit }, (_, i) => ({
    slug: `fallback-movie-${i + 1}`,
    name: `Phim Mẫu ${i + 1}`,
    name_en: `Sample Movie ${i + 1}`,
    poster_url: "",
    thumb_url: "",
    year: 2024,
    category: [{ name: "Hành Động", slug: "hanh-dong" }],
    country: [{ name: "Việt Nam", slug: "viet-nam" }],
    type: "phim-le",
    quality: "HD",
    lang: "Vietsub",
  }));
}

const fallbackPagination = (): Pagination => ({
  currentPage: 1,
  totalPages: 1,
  totalItems: 10,
});

/**
 * Normalize an image URL. The phimapi.com endpoints are inconsistent:
 *  - `/phim/{slug}` returns absolute URLs (`https://phimimg.com/...`).
 *  - `/v1/api/*` list endpoints return relative paths (`uploads/movies/...`).
 * We join relative paths with the CDN base so consumers always see a full URL.
 */
function normalizeImageUrl(path: string | undefined | null, cdnBase: string): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = cdnBase.replace(/\/+$/, "");
  const rel = path.startsWith("/") ? path : `/${path}`;
  return `${base}${rel}`;
}

function pickCdnBase(payload: any, fallback: string): string {
  const fromResponse = payload?.APP_DOMAIN_CDN_IMAGE || payload?.data?.APP_DOMAIN_CDN_IMAGE;
  return (typeof fromResponse === "string" && fromResponse) || fallback;
}

function normalizeMovieImages<T extends { thumb_url?: string; poster_url?: string; avatar?: string }>(
  movie: T,
  cdnBase: string
): T {
  return {
    ...movie,
    thumb_url: normalizeImageUrl(movie.thumb_url, cdnBase),
    poster_url: normalizeImageUrl(movie.poster_url, cdnBase),
    avatar: normalizeImageUrl(movie.avatar, cdnBase),
  };
}

const DEFAULT_CDN_BASE = "https://phimimg.com";

export class PhimApi {
  /** Image CDN base URL. Updated whenever a list response includes
   *  `APP_DOMAIN_CDN_IMAGE`; falls back to `https://phimimg.com`. */
  private cdnBase: string = DEFAULT_CDN_BASE;

  /** Public: resolve any path (relative or absolute) to a full image URL. */
  resolveImageUrl(path: string | undefined | null): string {
    return normalizeImageUrl(path, this.cdnBase);
  }

  async get(slug: string): Promise<WatchResult> {
    try {
      const data = await fetchJson(`${API_URL}/phim/${slug}`);
      this.cdnBase = pickCdnBase(data, this.cdnBase);
      const movie = data.movie ? normalizeMovieImages(data.movie, this.cdnBase) : data.movie;
      return { movie, server: data.episodes ?? [] };
    } catch (error) {
      console.error(`Failed to get movie ${slug}:`, error);
      return { movie: getFallbackMovies(1)[0] as any, server: [] };
    }
  }

  listTopics(): { name: string; slug: string }[] {
    return [
      { name: "Chương Trình Truyền Hình", slug: "phim-bo" },
      { name: "Phim Điện Ảnh", slug: "phim-le" },
      { name: "Phim Hoạt Hình", slug: "hoat-hinh" },
    ];
  }

  async listCategories(): Promise<CategoryItem[]> {
    try {
      const response = await fetchJson(`${API_URL}/the-loai`);
      return response?.data?.items || [];
    } catch {
      return [
        { name: "Hành Động", slug: "hanh-dong" },
        { name: "Tình Cảm", slug: "tinh-cam" },
        { name: "Hài Hước", slug: "hai-huoc" },
        { name: "Kinh Dị", slug: "kinh-di" },
        { name: "Phiêu Lưu", slug: "phieu-luu" },
      ];
    }
  }

  async listCountries(): Promise<CategoryItem[]> {
    try {
      const response = await fetchJson(`${API_URL}/quoc-gia`);
      return response?.data?.items || [];
    } catch {
      return [
        { name: "Việt Nam", slug: "viet-nam" },
        { name: "Hàn Quốc", slug: "han-quoc" },
        { name: "Trung Quốc", slug: "trung-quoc" },
        { name: "Mỹ", slug: "my" },
        { name: "Nhật Bản", slug: "nhat-ban" },
      ];
    }
  }

  async getList(
    isCategory: boolean | null | undefined,
    slug: string | null | undefined,
    index = 1
  ): Promise<MovieListResult> {
    if (isCategory === true && slug) return this.byCategory(slug, index);
    if (isCategory === false && slug) return this.byTopic(slug, index);
    return this.newAdding(index);
  }

  async newAdding(index = 1): Promise<MovieListResult> {
    try {
      const data = await fetchJson(
        `${API_URL}/danh-sach/phim-moi-cap-nhat-v2?page=${index}&limit=20`
      );
      this.cdnBase = pickCdnBase(data, this.cdnBase);
      const items: MovieItem[] = (data.items || []).map((m: MovieItem) =>
        normalizeMovieImages(m, this.cdnBase)
      );
      return [items, data.pagination];
    } catch {
      return [getFallbackMovies(20), fallbackPagination()];
    }
  }

  async search(query: string, index = 1): Promise<MovieListResult> {
    try {
      if (!query || query.trim() === "") {
        return [[], { currentPage: 1, totalPages: 1, totalItems: 0 }];
      }
      const data = await fetchJson(
        `${API_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(query)}&limit=20&page=${index}`
      );
      if (!data || !data.data) {
        return [[], { currentPage: 1, totalPages: 1, totalItems: 0 }];
      }
      this.cdnBase = pickCdnBase(data, this.cdnBase);
      const items: MovieItem[] = (data.data.items || []).map((m: MovieItem) =>
        normalizeMovieImages(m, this.cdnBase)
      );
      const pagination: Pagination =
        data.data.params?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 };
      return [items, pagination];
    } catch {
      return [[], { currentPage: 1, totalPages: 1, totalItems: 0 }];
    }
  }

  async byCategory(slug: string, index = 1): Promise<MovieListResult> {
    try {
      const data = await fetchJson(
        `${API_URL}/v1/api/the-loai/${slug}?page=${index}&limit=20`
      );
      this.cdnBase = pickCdnBase(data, this.cdnBase);
      const items: MovieItem[] = (data.data.items || []).map((m: MovieItem) =>
        normalizeMovieImages(m, this.cdnBase)
      );
      return [items, data.data.params.pagination];
    } catch {
      return [getFallbackMovies(20), fallbackPagination()];
    }
  }

  async byTopic(slug: string, index = 1): Promise<MovieListResult> {
    try {
      const data = await fetchJson(
        `${API_URL}/v1/api/danh-sach/${slug}?page=${index}&limit=20`
      );
      this.cdnBase = pickCdnBase(data, this.cdnBase);
      const items: MovieItem[] = (data.data.items || []).map((m: MovieItem) =>
        normalizeMovieImages(m, this.cdnBase)
      );
      return [items, data.data.params.pagination];
    } catch {
      return [getFallbackMovies(20), fallbackPagination()];
    }
  }

  async getTopicItems(slug: string, limit = 6): Promise<MovieItem[]> {
    const data = await fetchJson(
      `${API_URL}/v1/api/danh-sach/${slug}?page=1&limit=${limit}`
    );
    this.cdnBase = pickCdnBase(data, this.cdnBase);
    return (data.data.items as MovieItem[]).slice(0, limit).map((m) =>
      normalizeMovieImages(m, this.cdnBase)
    );
  }

  async getFilteredList(params: {
    typeList?: string;
    page?: number;
    sortField?: string;
    sortType?: string;
    sortLang?: string;
    category?: string;
    country?: string;
    year?: number;
    limit?: number;
  }): Promise<MovieListResult> {
    try {
      const {
        typeList = "phim-bo",
        page = 1,
        sortField = "modified.time",
        sortType = "desc",
        sortLang = "vietsub",
        category,
        country,
        year,
        limit = 10,
      } = params;

      let url = `${API_URL}/v1/api/danh-sach/${typeList}?page=${page}&sort_field=${sortField}&sort_type=${sortType}&limit=${limit}`;
      if (sortLang) url += `&sort_lang=${sortLang}`;
      if (category) url += `&category=${category}`;
      if (country) url += `&country=${country}`;
      if (year) url += `&year=${year}`;

      const data = await fetchJson(url);
      this.cdnBase = pickCdnBase(data, this.cdnBase);
      const items: MovieItem[] = (data.data.items || []).map((m: MovieItem) =>
        normalizeMovieImages(m, this.cdnBase)
      );
      return [items, data.data.params.pagination];
    } catch {
      return [getFallbackMovies(params.limit || 10), fallbackPagination()];
    }
  }

  /** Resolve a playable HLS URL for an episode via the embed endpoint. */
  async getEpisodeStream(embedUrl: string): Promise<string | null> {
    try {
      // embedUrl looks like: https://phimapi.com/embed/phim-xxx/tap-1.html
      const idMatch = embedUrl.match(/embed\/([^/]+)\/([^/.]+)/);
      if (!idMatch) return null;
      const [, movieId, episodeId] = idMatch;
      const referer = encodeURIComponent(embedUrl.replace(/\.html$/, ""));
      const data = await fetchJson(
        `${API_URL}/src/${movieId}/${episodeId}.html?referer=${referer}`
      );
      return data?.data?.link_play || data?.data?.[0]?.link || null;
    } catch (error) {
      console.error("Failed to resolve episode stream:", error);
      return null;
    }
  }

  async getRecommended(movie: MovieItem): Promise<MovieItem[]> {
    try {
      const requests: Promise<MovieListResult>[] = [];
      if (movie.category?.[0]?.slug) requests.push(this.byCategory(movie.category[0].slug, 1));
      if (movie.country?.[0]?.slug)
        requests.push(this.getFilteredList({ country: movie.country[0].slug, limit: 10 }));
      if (movie.year) requests.push(this.getFilteredList({ year: Number(String(movie.year).split(",")[0]), limit: 10 }));
      if (movie.type) requests.push(this.byTopic(movie.type, 1));

      const results = await Promise.allSettled(requests);
      let allMovies: MovieItem[] = [];
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          allMovies = [...allMovies, ...(result.value[0] || [])];
        }
      });

      const unique = Array.from(new Map(allMovies.map((m) => [m.slug, m])).values()).filter(
        (m) => m.slug !== movie.slug
      );
      return unique.sort(() => Math.random() - 0.5);
    } catch {
      return [];
    }
  }
}

export default new PhimApi();
