// Port cua services/phimapi.com.ts sang Ionic/Capacitor.
// Bo: `next: { revalidate }` (chi chay tren Next server), User-Agent tuy bien.
// Them: cache in-memory + retry + timeout qua http.ts, chay tot tren Android WebView.

import { fetchJson } from './http';

export default class PhimApi {
  private apiUrl = 'https://phimapi.com';

  private getFallbackMovies(limit = 10): any[] {
    return Array.from({ length: limit }, (_, i) => ({
      slug: `fallback-movie-${i + 1}`,
      name: `Phim Mẫu ${i + 1}`,
      name_en: `Sample Movie ${i + 1}`,
      poster_url: 'placeholder-movie.png',
      thumb_url: 'placeholder-movie.png',
      year: 2024,
      category: [{ name: 'Hành Động', slug: 'hanh-dong' }],
      country: [{ name: 'Việt Nam', slug: 'viet-nam' }],
      type: 'phim-le',
      quality: 'HD',
      lang: 'Vietsub',
      modified: { time: Date.now() },
    }));
  }

  private getFallbackPagination(): any {
    return { currentPage: 1, totalPages: 1, totalItems: 10, itemsPerPage: 10 };
  }

  public getFallbackMoviesPublic(limit = 10): any[] {
    return this.getFallbackMovies(limit);
  }

  async get(slug: string): Promise<{ movie: any; server: any[] }> {
    try {
      const data = await fetchJson(`${this.apiUrl}/phim/${slug}`);
      return { movie: data.movie, server: data.episodes };
    } catch (e) {
      console.error(`Failed to get movie ${slug}:`, e);
      return { movie: this.getFallbackMovies(1)[0], server: [] };
    }
  }

  listTopics(): any[] {
    return [
      { name: 'Chương Trình Truyền Hình', slug: 'phim-bo' },
      { name: 'Phim Điện Ảnh', slug: 'phim-le' },
      { name: 'Phim Hoạt Hình', slug: 'hoat-hinh' },
    ];
  }

  async listCategories(): Promise<any[]> {
    try {
      const response = await fetchJson(`${this.apiUrl}/the-loai`);
      return response?.data?.items || [];
    } catch (e) {
      console.error('Failed to fetch categories:', e);
      return [
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Tình Cảm', slug: 'tinh-cam' },
        { name: 'Hài Hước', slug: 'hai-huoc' },
        { name: 'Kinh Dị', slug: 'kinh-di' },
        { name: 'Phiêu Lưu', slug: 'phieu-luu' },
      ];
    }
  }

  async listCountries(): Promise<any[]> {
    try {
      const response = await fetchJson(`${this.apiUrl}/quoc-gia`);
      return response?.data?.items || [];
    } catch (e) {
      console.error('Failed to fetch countries:', e);
      return [
        { name: 'Việt Nam', slug: 'viet-nam' },
        { name: 'Hàn Quốc', slug: 'han-quoc' },
        { name: 'Trung Quốc', slug: 'trung-quoc' },
        { name: 'Mỹ', slug: 'my' },
        { name: 'Nhật Bản', slug: 'nhat-ban' },
      ];
    }
  }

  async getList(isCategory: boolean | null | undefined, slug: string | null | undefined, index = 1): Promise<any> {
    if (isCategory === true && slug) return this.byCategory(slug, index);
    if (isCategory === false && slug) return this.byTopic(slug, index);
    return this.newAdding(index);
  }

  async newAdding(index = 1): Promise<any> {
    try {
      const data = await fetchJson(`${this.apiUrl}/danh-sach/phim-moi-cap-nhat-v2?page=${index}&limit=20`);
      return [data.items, data.pagination];
    } catch (e) {
      console.error('Failed to fetch new additions:', e);
      return [this.getFallbackMovies(20), this.getFallbackPagination()];
    }
  }

  async search(query: string, index = 1): Promise<any> {
    try {
      if (!query || query.trim() === '') {
        return [[], { currentPage: 1, totalPages: 1, totalItems: 0 }];
      }
      const url = `${this.apiUrl}/v1/api/tim-kiem?keyword=${encodeURIComponent(query)}&limit=20&page=${index}`;
      const data = await fetchJson(url, { noCache: true });
      if (!data || !data.data) return [[], { currentPage: 1, totalPages: 1, totalItems: 0 }];
      const items = data.data.items || [];
      const pagination = data.data.params?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 };
      return [items, pagination];
    } catch (e) {
      console.error('Search API error:', e);
      return [[], { currentPage: 1, totalPages: 1, totalItems: 0 }];
    }
  }

  async searchSuggest(query: string, limit = 6): Promise<any[]> {
    try {
      if (!query || query.trim().length < 2) return [];
      const url = `${this.apiUrl}/v1/api/tim-kiem?keyword=${encodeURIComponent(query.trim())}&limit=${limit}`;
      const data = await fetchJson(url, { noCache: true });
      return data?.data?.items || [];
    } catch {
      return [];
    }
  }

  async byCategory(slug: string, index = 1): Promise<any> {
    try {
      const data = await fetchJson(`${this.apiUrl}/v1/api/the-loai/${slug}?page=${index}&limit=20`);
      return [data.data.items, data.data.params.pagination];
    } catch (e) {
      console.error(`Failed to fetch category ${slug}:`, e);
      return [this.getFallbackMovies(20), this.getFallbackPagination()];
    }
  }

  async byTopic(slug: string, index = 1): Promise<any> {
    try {
      const data = await fetchJson(`${this.apiUrl}/v1/api/danh-sach/${slug}?page=${index}&limit=20`);
      return [data.data.items, data.data.params.pagination];
    } catch (e) {
      console.error(`Failed to fetch topic ${slug}:`, e);
      return [this.getFallbackMovies(20), this.getFallbackPagination()];
    }
  }

  async getTopicItems(slug: string, limit = 6): Promise<any[]> {
    try {
      const data = await fetchJson(`${this.apiUrl}/v1/api/danh-sach/${slug}?page=1&limit=${limit}`);
      return (data.data.items || []).slice(0, limit);
    } catch {
      return [];
    }
  }

  async getFilteredList(params: {
    typeList?: string; page?: number; sortField?: string; sortType?: string;
    sortLang?: string; category?: string; country?: string; year?: number; limit?: number;
  }): Promise<any> {
    try {
      const { typeList = 'phim-bo', page = 1, sortField = 'modified.time', sortType = 'desc',
        sortLang = 'vietsub', category, country, year, limit = 10 } = params;
      let url = `${this.apiUrl}/v1/api/danh-sach/${typeList}?page=${page}&sort_field=${sortField}&sort_type=${sortType}&limit=${limit}`;
      if (sortLang) url += `&sort_lang=${sortLang}`;
      if (category) url += `&category=${category}`;
      if (country) url += `&country=${country}`;
      if (year) url += `&year=${year}`;
      const data = await fetchJson(url);
      return [data.data.items, data.data.params.pagination];
    } catch (e) {
      console.error('Failed to fetch filtered list:', e);
      return [this.getFallbackMovies(params.limit || 10), this.getFallbackPagination()];
    }
  }

  async getRecommended(movie: any): Promise<any[]> {
    try {
      const requests: Promise<any>[] = [];
      if (movie.category?.[0]?.slug) requests.push(this.byCategory(movie.category[0].slug, 1));
      if (movie.country?.[0]?.slug) requests.push(this.getFilteredList({ country: movie.country[0].slug, limit: 10 }));
      if (movie.year) requests.push(this.getFilteredList({ year: movie.year, limit: 10 }));
      if (movie.type) requests.push(this.byTopic(movie.type, 1));
      const results = await Promise.allSettled(requests);
      let allMovies: any[] = [];
      results.forEach((r) => {
        if (r.status === 'fulfilled') allMovies = [...allMovies, ...(r.value[0] || [])];
      });
      return Array.from(new Map(allMovies.map((m) => [m.slug, m])).values())
        .filter((m) => m.slug !== movie.slug)
        .sort(() => Math.random() - 0.5);
    } catch (e) {
      console.error('Failed to fetch recommendations:', e);
      return [];
    }
  }
}
