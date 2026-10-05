# PhimẢnh Mobile — Ionic + Capacitor (Android)

Port của web Next.js sang **Ionic + Capacitor** để cài file APK lên Android.
**Giữ nguyên giao diện** (copy `app/globals.css` + class Tailwind gốc của từng component).

## Cấu trúc

```
mobile/
  src/
    App.tsx            # IonApp + HashRouter (file://) + nút Back Android + StatusBar + offline banner
    main.tsx           # entry: Ionic CSS + theme web gốc + mobile.css
    pages/             # Home, ListPage (category/topic/country/year/filter/search/new/recently/foryou), Watch
    components/        # Header, Footer, HeroSection, MovieSection, MovieCard, MovieGrid,
                       # MovieDescription, EpisodeSelector, VideoPlayer (HLS), EmbedPlayer,
                       # Pagination, FilterPanel, RecentlyWatched, LoadingSpinner
    services/          # phimapi.ts, movie-list.ts, foryou.ts (gọi thẳng https://phimapi.com)
                       # http.ts (cache in-memory + retry + timeout, thay `next: revalidate`)
                       # storage.ts (Capacitor Preferences + localStorage, giữ nguyên key web cũ)
    lib/               # utils.ts (imageUrl/placeholder relative), user-experience.ts (lịch sử/progress/tập)
    theme/             # globals.css (copy nguyên bản web) + mobile.css (safe-area Android)
  capacitor.config.ts  # appId net.phimanh.app, webDir dist, allowMixedContent + cleartext cho HLS
  android/             # native project (đã `cap add android`), đã khai báo INTERNET +
                       # usesCleartextTraffic + network_security_config cho stream http://
```

## Những chỗ cần backend đã sửa cho mobile

| Web (Next.js) | Mobile (Ionic/Capacitor) |
|---|---|
| `fetch(..., { next: { revalidate } })` — chỉ chạy trên Next server | `services/http.ts`: cache in-memory 10 phút + retry 5xx/network + timeout 15s |
| `generateMetadata`, `sitemap.ts`, `robots.ts`, SEO/GTM/structured-data | Bỏ (app native không cần SEO web); giữ `<title>` + meta trong `index.html` |
| `next/link`, `useRouter/usePathname/useSearchParams` (next/navigation) | `react-router-dom` (`Link`, `useNavigate`, `useLocation`, `useSearchParams`); dùng **HashRouter** để chạy trên `file:///android_asset` |
| `next/image`, `next/font/google` (Roboto), MUI, GSAP, dplayer/video.js, js-cookie | `<img loading="lazy">` + `imageUrl()`, font hệ thống, Tailwind + CSS transition, `hls.js` + `<video controls playsInline>`, `storage.ts` thay cookie |
| `localStorage` trực tiếp rải rác | Gom qua `services/storage.ts`: **Capacitor Preferences (persist trên Android)** + localStorage + memory fallback, giữ nguyên key cũ (`recentlyWatched`, `playbackProgress`, `lastEpisode_*`...) nên không mất dữ liệu |
| Player web | `VideoPlayer`: HLS qua `hls.js` (tự resume từ progress, tự recover khi mạng chập chờn, throttle ghi progress 5s/lần), fullscreen có fallback `webkitEnterFullscreen`; `EmbedPlayer`: iframe + nút back |
| Nút Back / status bar / mất mạng | `App.tsx`: xử lý nút Back vật lý (hết history thì thoát app), StatusBar nền `#070707`, banner offline qua `@capacitor/network` |

## Chạy thử (web preview)

```bash
cd mobile
npm install
npm run dev      # http://localhost:8100
```

## Build APK (cần Android Studio / JDK + Android SDK trên máy build)

```bash
cd mobile
npm run build        # tsc + vite build -> dist/
npx cap sync android # copy dist -> android/app/src/main/assets/public
```

Mở bằng Android Studio rồi build:

- `mobile/android` → **Build > Build Bundle(s) / APK(s) > Build APK(s)**
- Hoặc CLI (khi đã có SDK + gradle wrapper):
  ```bash
  cd mobile/android
  ./gradlew assembleDebug   # APK ở app/build/outputs/apk/debug/app-debug.apk
  ```
- Cài lên máy: copy `app-debug.apk` vào điện thoại và cài (cho phép "Install unknown apps").
- Ký release: tạo keystore rồi **Build > Generate Signed Bundle / APK**.

Lưu ý: lần đầu mở Android Studio sẽ yêu cầu cài Android SDK Platform + Build-Tools (máy làm task này chưa có SDK nên chỉ dừng ở `cap sync` — verify `vite build` + `tsc --noEmit` đều pass).
