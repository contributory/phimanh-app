import { useEffect } from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { hydrateStorage } from './services/storage';
import Home from './pages/Home';
import ListPage from './pages/ListPage';
import Watch from './pages/Watch';

setupIonicReact({ mode: 'md' });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Xu ly nut Back vat ly tren Android: lui trang, het lich su thi thoat app.
function HardwareBackHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    let sub: any = null;
    CapApp.addListener('backButton', ({ canGoBack }: any) => {
      if (canGoBack) navigate(-1);
      else CapApp.exitApp();
    }).then((s) => { sub = s; });
    return () => { sub?.remove?.(); };
  }, [navigate]);
  return null;
}

export default function App() {
  useEffect(() => {
    // Giu status bar dong bo voi theme den cua web.
    StatusBar.setBackgroundColor({ color: '#070707' }).catch(() => {});
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

    // Migrate du lieu web cu (localStorage) + Preferences native ve store hybrid.
    hydrateStorage(['recentlyWatched', 'watchedMovies', 'favoriteMovies', 'playbackProgress']).catch(() => {});
    Preferences.keys()
      .then(({ keys }) => hydrateStorage(keys.filter((k) => k.startsWith('lastEpisode'))))
      .catch(() => {});

    // Canh bao mat mang (player/stream can Internet).
    let sub: any = null;
    Network.addListener('networkStatusChange', (s) => {
      const el = document.getElementById('offline-banner');
      if (el) el.style.display = s.connected ? 'none' : 'flex';
    }).then((lis) => { sub = lis; });
    Network.getStatus().then((s) => {
      const el = document.getElementById('offline-banner');
      if (el) el.style.display = s.connected ? 'none' : 'flex';
    }).catch(() => {});
    return () => { sub?.remove?.(); };
  }, []);

  return (
    <IonApp>
      <div
        id="offline-banner"
        style={{ display: 'none' }}
        className="fixed inset-x-0 top-0 z-[200] items-center justify-center bg-red-700 px-4 py-2 text-center text-xs font-semibold text-white"
      >
        Mất kết nối mạng — kiểm tra Wi-Fi/4G để tiếp tục xem phim
      </div>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <HardwareBackHandler />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/watch" element={<Watch />} />
            <Route path="/search" element={<ListPage kind="search" />} />
            <Route path="/filter" element={<ListPage kind="filter" />} />
            <Route path="/new-updates" element={<ListPage kind="new" />} />
            <Route path="/recently" element={<ListPage kind="recently" />} />
            <Route path="/foryou" element={<ListPage kind="foryou" />} />
            <Route path="/category/:slug" element={<ListPage kind="category" />} />
            <Route path="/topic/:slug" element={<ListPage kind="topic" />} />
            <Route path="/country/:slug" element={<ListPage kind="country" />} />
            <Route path="/year/:slug" element={<ListPage kind="year" />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </HashRouter>
      </QueryClientProvider>
    </IonApp>
  );
}
