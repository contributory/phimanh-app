// Port cua lib/user-experience.ts: dung storage hybrid (Preferences native + localStorage)
// de lich su xem / progress / tap dang xem van chay tren Android.

import { storageGetSync, storageRemoveSync, storageSetSync } from '../services/storage';

export interface Movie {
  slug: string;
  name: string;
  poster_url?: string;
  [key: string]: any;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = storageGetSync(key, '');
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    storageSetSync(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

export function getWatchedMovies(): Movie[] {
  return readJson<Movie[]>('watchedMovies', []);
}

export function addWatchedMovie(movie: Movie): void {
  if (!movie?.slug) return;
  const movies = getWatchedMovies();
  if (!movies.find((m) => m.slug === movie.slug)) {
    movies.push(movie);
    writeJson('watchedMovies', movies);
  }
}

export function getFavoriteMovies(): Movie[] {
  return readJson<Movie[]>('favoriteMovies', []);
}

export function toggleFavoriteMovie(movie: Movie): void {
  if (!movie?.slug) return;
  let movies = getFavoriteMovies();
  if (movies.find((m) => m.slug === movie.slug)) {
    movies = movies.filter((m) => m.slug !== movie.slug);
  } else {
    movies.push(movie);
  }
  writeJson('favoriteMovies', movies);
}

export function getRecentlyWatched(): Movie[] {
  try {
    return readJson<Movie[]>('recentlyWatched', []);
  } catch {
    return [];
  }
}

export function pushRecentlyWatched(movie: Movie): void {
  if (!movie?.slug) return;
  const list = getRecentlyWatched().filter((m) => m.slug !== movie.slug);
  list.unshift(movie);
  writeJson('recentlyWatched', list.slice(0, 20));
}

interface PlaybackProgressEntry {
  time: number;
  duration: number;
  videoUrl?: string;
  updatedAt: number;
}

type PlaybackProgressStore = Record<string, number | PlaybackProgressEntry>;

const getPlaybackProgressStore = (): PlaybackProgressStore =>
  readJson<PlaybackProgressStore>('playbackProgress', {});

const clearSavedEpisode = (slug: string) => {
  storageRemoveSync(`lastEpisode_${slug}`);
  storageRemoveSync(`lastEpisodeIndex_${slug}`);
};

export function getPlaybackProgress(slug: string, videoUrl?: string): number {
  if (!slug) return 0;
  const entry = getPlaybackProgressStore()[slug];
  if (!entry) return 0;
  if (typeof entry === 'number') return entry;
  if (videoUrl && entry.videoUrl && entry.videoUrl !== videoUrl) return 0;
  return entry.time || 0;
}

export function hasPlaybackProgress(slug: string): boolean {
  if (!slug) return false;
  const entry = getPlaybackProgressStore()[slug];
  if (!entry) return false;
  return typeof entry === 'number' ? entry > 0 : entry.time > 0;
}

export function savePlaybackProgress(
  slug: string,
  time: number,
  duration: number,
  options: { isFinalEpisode?: boolean; videoUrl?: string } = {},
): void {
  if (!slug || !Number.isFinite(time) || !Number.isFinite(duration) || time <= 0 || duration <= 0) return;
  const progress = getPlaybackProgressStore();
  const remaining = Math.max(duration - time, 0);
  if (options.isFinalEpisode && remaining <= 300) {
    delete progress[slug];
    writeJson('playbackProgress', progress);
    clearSavedEpisode(slug);
    return;
  }
  progress[slug] = { time, duration, videoUrl: options.videoUrl, updatedAt: Date.now() };
  writeJson('playbackProgress', progress);
}

export function clearPlaybackProgress(slug: string, clearEpisodeState = false): void {
  if (!slug) return;
  const progress = getPlaybackProgressStore();
  if (progress[slug]) {
    delete progress[slug];
    writeJson('playbackProgress', progress);
  }
  if (clearEpisodeState) clearSavedEpisode(slug);
}

export function saveLastEpisode(slug: string, serverIndex: number, episodeIndex: number, label?: string) {
  if (!slug) return;
  storageSetSync(`lastEpisodeIndex_${slug}`, JSON.stringify({ serverIndex, episodeIndex, label: label ?? '' }));
}

export function getLastEpisode(slug: string): { serverIndex: number; episodeIndex: number; label?: string } | null {
  if (!slug) return null;
  return readJson(`lastEpisodeIndex_${slug}`, null);
}
