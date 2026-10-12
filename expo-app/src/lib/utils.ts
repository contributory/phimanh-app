export function stripHtml(html?: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatYear(year?: number | string): string {
  if (!year) return "";
  const y = Number(String(year).split(",")[0]);
  return isNaN(y) ? String(year) : String(y);
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms = 500) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
