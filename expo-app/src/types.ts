export interface MovieItem {
  id?: string;
  slug: string;
  name: string;
  origin_name?: string;
  name_en?: string;
  avatar?: string;
  poster_url?: string;
  thumb_url?: string;
  year?: number | string;
  type?: string;
  quality?: string;
  lang?: string;
  category?: { name: string; slug: string }[];
  country?: { name: string; slug: string }[];
  content?: string;
  modified?: { time?: number };
}

export interface Pagination {
  currentPage: number;
  prevPage?: number;
  nextPage?: number;
  totalPages: number;
  totalItems?: number;
}

export interface EpisodeItem {
  id?: string;
  name: string;
  slug?: string;
  video?: string;
  link?: string;
  server_id?: number;
}

export interface ServerData {
  server_id?: number;
  is_default?: boolean;
  parsing_server_id?: number | null;
  server_name: string;
  server_data: EpisodeItem[];
}

export interface MovieDetail extends MovieItem {
  content?: string;
  current_episode?: { num: string; server_id?: string };
  episodes?: EpisodeItem[];
  movie?: any;
}

export interface WatchResult {
  movie: MovieDetail;
  server: ServerData[];
}

export interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
}

export type MovieListResult = [MovieItem[], Pagination];
