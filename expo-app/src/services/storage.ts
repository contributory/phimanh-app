import AsyncStorage from "@react-native-async-storage/async-storage";
import { MovieItem } from "../types";

const RECENT_KEY = "recently-watched";
const MAX_RECENT = 20;

export interface RecentItem extends MovieItem {
  watchedAt: number;
  episode?: string;
}

export async function getRecentlyWatched(): Promise<RecentItem[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

export async function addRecentlyWatched(movie: MovieItem, episode?: string): Promise<RecentItem[]> {
  try {
    const list = await getRecentlyWatched();
    const item: RecentItem = { ...movie, watchedAt: Date.now(), episode };
    const next = [item, ...list.filter((m) => m.slug !== movie.slug)].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export async function clearRecentlyWatched(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENT_KEY);
  } catch {}
}
