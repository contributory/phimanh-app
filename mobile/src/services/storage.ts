// Mobile storage: Capacitor Preferences (persist tren Android) + fallback localStorage (web preview).
// Giu nguyen key cu cua ban web de du lieu khong mat khi chuyen doi.

import { Preferences } from '@capacitor/preferences';

const memoryFallback = new Map<string, string>();
let useNative = false;
try {
  useNative = typeof (Preferences as any)?.get === 'function';
} catch {
  useNative = false;
}

export async function storageGet(key: string): Promise<string | null> {
  if (useNative) {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch { /* fallback */ }
  }
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v;
  } catch { /* ignore */ }
  return memoryFallback.get(key) ?? null;
}

export async function storageSet(key: string, value: string): Promise<void> {
  memoryFallback.set(key, value);
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
  if (useNative) {
    try { await Preferences.set({ key, value }); } catch { /* ignore */ }
  }
}

export async function storageRemove(key: string): Promise<void> {
  memoryFallback.delete(key);
  try { localStorage.removeItem(key); } catch { /* ignore */ }
  if (useNative) {
    try { await Preferences.remove({ key }); } catch { /* ignore */ }
  }
}

// Dong bo (cho render lan dau): doc tu localStorage/memory ngay lap tuc.
export function storageGetSync(key: string, fallback = ''): string {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v;
  } catch { /* ignore */ }
  return memoryFallback.get(key) ?? fallback;
}

export function storageSetSync(key: string, value: string): void {
  memoryFallback.set(key, value);
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
  // Ghi native o background (khong block UI)
  if (useNative) Preferences.set({ key, value }).catch(() => {});
}

export function storageRemoveSync(key: string): void {
  memoryFallback.delete(key);
  try { localStorage.removeItem(key); } catch { /* ignore */ }
  if (useNative) Preferences.remove({ key }).catch(() => {});
}

// Migrate du lieu Preferences -> localStorage/memory khi app khoi dong (de UI doc sync duoc).
export async function hydrateStorage(keys: string[]): Promise<void> {
  if (!useNative) return;
  await Promise.all(
    keys.map(async (key) => {
      try {
        const { value } = await Preferences.get({ key });
        if (value !== null) {
          memoryFallback.set(key, value);
          try { localStorage.setItem(key, value); } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }),
  );
}
