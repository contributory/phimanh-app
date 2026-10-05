import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronDown, Clock3, Menu, Search, X } from "lucide-react";
import { imageUrl } from "@/lib/utils";
import PhimApi from "@/services/phimapi";

interface HeaderProps {
  categories?: { slug: string; name: string }[];
  countries?: { slug: string; name: string }[];
  topics?: { slug: string; name: string }[];
}

const phimApi = new PhimApi();

export default function Header({ categories = [], countries = [], topics = [] }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [params] = useSearchParams();
  const urlQuery = params.get("query") || params.get("keyword") || "";
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setShowSidebar(false);
  }, [pathname]);

  useEffect(() => {
    if (showSearch) setTimeout(() => inputRef.current?.focus(), 60);
  }, [showSearch]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const items = await phimApi.searchSuggest(searchQuery.trim(), 6);
        setSuggestions(items || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!showSidebar) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showSidebar]);

  const isActiveLink = (href: string) => pathname === href;
  const isActiveTopic = (slug: string) =>
    pathname === `/topic/${slug}` || pathname === `/category/${slug}`;

  const closeSearch = () => {
    setShowSearch(false);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const runSearch = () => {
    if (!searchQuery.trim()) return;
    closeSearch();
    navigate(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
  };

  const openSuggestion = (movie: any) => {
    if (!movie?.slug) return;
    closeSearch();
    navigate(`/watch?slug=${movie.slug}`);
  };

  return (
    <>
      <div aria-hidden="true" className="h-16 w-full shrink-0" />
      <nav
        className={`fixed inset-x-0 top-0 z-[100] w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-white/[0.06] bg-[#070707]/90 backdrop-blur-xl"
            : "bg-gradient-to-b from-black/75 via-black/35 to-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between px-4 md:px-8 lg:px-10">
          <div className="flex items-center gap-10">
            <button onClick={() => navigate("/")} className="flex cursor-pointer items-center" aria-label="Trang chủ">
              <span className="text-[22px] font-bold tracking-[-0.04em] text-white transition-opacity duration-200 hover:opacity-80">
                PHIMANH
              </span>
            </button>

            <div className="hidden items-center gap-7 lg:flex">
              <Link
                to="/new-updates"
                className={`text-sm font-medium transition-colors ${isActiveLink("/new-updates") ? "text-white" : "text-zinc-400 hover:text-white"}`}
              >
                Mới nhất
              </Link>
              <Link
                to="/foryou"
                className={`text-sm font-medium transition-colors ${isActiveLink("/foryou") ? "text-white" : "text-zinc-400 hover:text-white"}`}
              >
                Dành cho bạn
              </Link>
              <div className="group/dropdown relative">
                <button
                  className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                    topics.some((t) => isActiveTopic(t.slug)) ? "text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>Danh mục</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-hover/dropdown:rotate-180" />
                </button>
                <div className="invisible absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-white/[0.08] bg-zinc-950/95 py-2 opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-200 group-hover/dropdown:visible group-hover/dropdown:opacity-100">
                  {topics.map((topic) => (
                    <Link
                      key={topic.slug}
                      to={`/topic/${topic.slug}`}
                      className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActiveTopic(topic.slug)
                          ? "bg-white/[0.06] text-white"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      {topic.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                to="/recently"
                className={`text-sm font-medium transition-colors ${isActiveLink("/recently") ? "text-white" : "text-zinc-400 hover:text-white"}`}
              >
                Tiếp tục xem
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Tìm kiếm"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowSidebar(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.08] hover:text-white lg:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {showSearch && (
        <>
          <button
            aria-label="Đóng tìm kiếm"
            onClick={closeSearch}
            className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm"
          />
          <div className="fixed inset-x-0 top-0 z-[160] px-4 pt-4">
            <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch();
                }}
                className="p-3"
              >
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3">
                  <Search className="h-4 w-4 shrink-0 text-zinc-500" />
                  <input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") closeSearch();
                    }}
                    placeholder="Tìm phim..."
                    className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-[15px] font-medium text-white outline-none placeholder:text-zinc-500 sm:text-base"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
                      aria-label="Xóa từ khóa"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!searchQuery.trim()}
                    className="hidden h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-35 sm:flex"
                  >
                    Tìm kiếm
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-zinc-500">
                  <span>Nhập ít nhất 2 ký tự để xem gợi ý</span>
                  <span className="hidden sm:inline">Enter để tìm · Esc để đóng</span>
                </div>
              </form>

              {showSuggestions && suggestions.length > 0 && (
                <div className="border-t border-white/[0.07] p-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    Gợi ý
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {suggestions.map((movie: any) => (
                      <button
                        key={movie.slug}
                        type="button"
                        onClick={() => openSuggestion(movie)}
                        className="flex min-w-0 items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-white/[0.055]"
                      >
                        <img
                          src={imageUrl(movie.poster_url || movie.thumb_url)}
                          alt=""
                          className="h-14 w-10 shrink-0 rounded-md bg-zinc-900 object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-zinc-100">{movie.name}</span>
                          <span className="mt-1 block truncate text-xs text-zinc-500">
                            {[movie.origin_name, movie.year].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-white/[0.07] p-3 sm:hidden">
                <button
                  type="button"
                  onClick={runSearch}
                  disabled={!searchQuery.trim()}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black disabled:opacity-35"
                >
                  Tìm kiếm
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile drawer (port tu sidebar.tsx, Tailwind + CSS transition) */}
      <button
        aria-label="Đóng menu"
        onClick={() => setShowSidebar(false)}
        className={`fixed inset-0 z-[190] bg-black/65 backdrop-blur-sm transition-opacity duration-300 ${
          showSidebar ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Điều hướng"
        aria-hidden={!showSidebar}
        className={`fixed bottom-0 left-0 top-0 z-[200] flex w-[92vw] max-w-[390px] flex-col border-r border-white/[0.08] bg-[#090909]/95 shadow-[30px_0_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-transform duration-300 ease-out ${
          showSidebar ? "translate-x-0" : "pointer-events-none -translate-x-full"
        }`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-white/[0.07] px-4">
          <div>
            <div className="text-[17px] font-bold tracking-[-0.04em] text-white">PHIMANH</div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">Điều hướng</div>
          </div>
          <button
            type="button"
            onClick={() => setShowSidebar(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Đóng sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {[
              { href: "/", label: "Trang chủ" },
              { href: "/foryou", label: "Dành cho bạn" },
              { href: "/new-updates", label: "Mới cập nhật" },
              { href: "/recently", label: "Tiếp tục xem" },
            ].map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setShowSidebar(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-white/[0.09] text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          {topics.length > 0 && (
            <section className="mt-6 border-t border-white/[0.06] pt-5">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Danh mục nổi bật
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {topics.map((t) => (
                  <Link
                    key={t.slug}
                    to={`/topic/${t.slug}`}
                    onClick={() => setShowSidebar(false)}
                    className="rounded-lg border border-white/[0.05] px-2 py-2 text-center text-[11px] font-medium text-zinc-500 transition hover:border-white/10 hover:bg-white/[0.05] hover:text-zinc-200"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {categories.length > 0 && (
            <section className="mt-6 border-t border-white/[0.06] pt-5">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Thể loại</p>
              <div className="flex flex-wrap gap-1.5 px-1">
                {categories.slice(0, 24).map((c) => (
                  <Link
                    key={c.slug}
                    to={`/category/${c.slug}`}
                    onClick={() => setShowSidebar(false)}
                    className="rounded-full border border-white/[0.07] px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {countries.length > 0 && (
            <section className="mt-6 border-t border-white/[0.06] pt-5">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Quốc gia</p>
              <div className="flex flex-wrap gap-1.5 px-1">
                {countries.slice(0, 20).map((c) => (
                  <Link
                    key={c.slug}
                    to={`/country/${c.slug}`}
                    onClick={() => setShowSidebar(false)}
                    className="rounded-full border border-white/[0.07] px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-4 py-3 text-[10px] leading-4 text-zinc-700">
          Nội dung được tổ chức theo thể loại, quốc gia và năm để truy cập nhanh hơn.
        </div>
      </aside>
    </>
  );
}
