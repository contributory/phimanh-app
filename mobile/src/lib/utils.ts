import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  const entities: Record<string, string> = {
    "&quot;": '"',
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };
  return text.replace(/&[a-z0-9#]+;/gi, (m) => entities[m] || m);
}

export function stripHtml(text: string): string {
  if (!text) return "";
  return decodeHtmlEntities(text)
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function placeholderUrl(): string {
  return `${import.meta.env.BASE_URL}placeholder-movie.png`;
}

export function imageUrl(value?: string): string {
  if (!value) return placeholderUrl();
  if (value.startsWith("http")) return value;
  if (value.startsWith("/")) return `${import.meta.env.BASE_URL}${value.slice(1)}`;
  return `https://phimimg.com/${value}`;
}
