import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import VideoPlayer from "../components/VideoPlayer";
import MovieSection from "../components/MovieSection";
import Header, { RootStackParamList } from "../components/Header";
import { colors } from "../lib/theme";
import { stripHtml, formatYear } from "../lib/utils";
import { useMovieDetail, useRecommendedMovies, useCategories } from "../hooks/use-movies";
import api from "../services/phimapi";
import { addRecentlyWatched } from "../services/storage";

type EpisodeRef = { server: number; episode: number };

export default function WatchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Watch">>();
  const slug = route.params.slug;

  const { data: categories } = useCategories();
  const { data, isLoading } = useMovieDetail(slug);
  const movie = data?.movie;
  const servers = data?.server ?? [];

  const [current, setCurrent] = useState<EpisodeRef>({ server: 0, episode: 0 });
  const [streamUri, setStreamUri] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const { data: recommended } = useRecommendedMovies(movie);

  const currentEpisodes = useMemo(
    () => servers[current.server]?.server_data ?? [],
    [servers, current.server]
  );
  const currentEpisode = currentEpisodes[current.episode];

  // Default to the "thuyết minh" server if available (mirrors web behavior)
  useEffect(() => {
    if (!servers.length) return;
    const idx = servers.findIndex((s) => s.server_name?.toLowerCase().includes("thuyết minh"));
    if (idx >= 0) setCurrent({ server: idx, episode: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, !!servers.length]);

  // Resolve playable stream when episode changes
  useEffect(() => {
    let cancelled = false;
    const ep = servers[current.server]?.server_data?.[current.episode];
    if (!ep) {
      setStreamUri(null);
      return;
    }
    if (ep.link) {
      setStreamUri(ep.link);
      return;
    }
    if (ep.video) {
      setResolving(true);
      api
        .getEpisodeStream(ep.video)
        .then((link) => {
          if (!cancelled) setStreamUri(link);
        })
        .finally(() => {
          if (!cancelled) setResolving(false);
        });
      return () => {
        cancelled = true;
      };
    }
    setStreamUri(null);
  }, [servers, current.server, current.episode]);

  // Record recently watched + update header title
  useEffect(() => {
    if (movie?.slug && !String(movie.slug).startsWith("fallback")) {
      addRecentlyWatched(movie, currentEpisode?.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie?.slug]);

  const goNext = useCallback(() => {
    const eps = servers[current.server]?.server_data ?? [];
    if (current.episode < eps.length - 1) {
      setCurrent((c) => ({ ...c, episode: c.episode + 1 }));
      return true;
    }
    if (current.server < servers.length - 1 && servers[current.server + 1]?.server_data?.length) {
      setCurrent({ server: current.server + 1, episode: 0 });
      return true;
    }
    return false;
  }, [servers, current]);

  const onEnded = useCallback(() => {
    if (!goNext()) navigation.goBack();
  }, [goNext, navigation]);

  if (isLoading || !movie) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const isFallback = String(movie.slug).startsWith("fallback");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header categories={categories ?? []} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Player */}
        {currentEpisode?.video ? (
          <VideoPlayer uri={streamUri} embedUri={currentEpisode.video} onEnded={onEnded} />
        ) : (
          <View style={styles.noPlayer}>
            <Text style={styles.noPlayerText}>
              {isFallback ? "Không tìm thấy thông tin phim." : resolving ? "Đang tải tập phim…" : "Không có nguồn phát cho tập này."}
            </Text>
            {resolving && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}
          </View>
        )}

        {/* Title & meta */}
        <View style={styles.info}>
          <Text style={styles.title}>{movie.name}</Text>
          {!!movie.origin_name && (
            <Text style={styles.originName}>{movie.origin_name}</Text>
          )}
          <Text style={styles.metaRow}>
            {[
              movie.type === "phim-bo" ? "Bộ dài tập" : movie.type === "phim-le" ? "Phim lẻ" : movie.type,
              formatYear(movie.year),
              movie.quality,
              movie.lang,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <View style={styles.tagRow}>
            {movie.category?.slice(0, 4).map((c) => (
              <TouchableOpacity
                key={c.slug}
                style={styles.tag}
                onPress={() => navigation.navigate("List", { title: c.name, mode: "category", slug: c.slug })}
              >
                <Text style={styles.tagText}>{c.name}</Text>
              </TouchableOpacity>
            ))}
            {movie.country?.slice(0, 2).map((c) => (
              <TouchableOpacity
                key={`country-${c.slug}`}
                style={[styles.tag, { borderColor: colors.accent }]}
                onPress={() => navigation.navigate("List", { title: c.name, mode: "category", slug: "" })}
              >
                <Text style={styles.tagText}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {!!movie.content && (
            <Text style={styles.description} numberOfLines={6}>
              {stripHtml(movie.content)}
            </Text>
          )}
        </View>

        {/* Server / episode pickers */}
        {servers.length > 0 && (
          <View style={styles.servers}>
            <Text style={styles.sectionTitle}>Máy chủ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {servers.map((s, i) => (
                <TouchableOpacity
                  key={`${s.server_name}-${i}`}
                  style={[styles.serverBtn, current.server === i && styles.serverActive]}
                  onPress={() => setCurrent({ server: i, episode: 0 })}
                >
                  <Text style={[styles.serverText, current.server === i && { color: "#fff" }]}>
                    {s.server_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {currentEpisodes.length > 1 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
                  Tập {currentEpisode?.name} / {currentEpisodes.length}
                </Text>
                <View style={styles.epGrid}>
                  {currentEpisodes.map((ep, i) => (
                    <TouchableOpacity
                      key={ep.slug ?? i}
                      style={[styles.epBtn, current.episode === i && styles.serverActive]}
                      onPress={() => setCurrent((c) => ({ ...c, episode: i }))}
                    >
                      <Text style={[styles.epText, current.episode === i && { color: "#fff" }]}>
                        {ep.name?.replace(/[^0-9]/g, "") || i + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <MovieSection
          title="Phim liên quan"
          movies={recommended?.slice(0, 20)}
          loading={!recommended}
          onMoviePress={(s) => navigation.push("Watch", { slug: s })}
        />
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  noPlayer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  noPlayerText: { color: colors.textMuted, fontSize: 13, textAlign: "center", paddingHorizontal: 20 },
  info: { padding: 14 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  originName: { color: colors.textMuted, fontSize: 13, marginTop: 2, fontStyle: "italic" },
  metaRow: { color: colors.accent, fontSize: 13, marginTop: 6, fontWeight: "600" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { color: colors.textMuted, fontSize: 11 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 12 },
  servers: { paddingHorizontal: 14 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: 8 },
  serverBtn: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serverActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  serverText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  epGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  epBtn: {
    minWidth: 44,
    alignItems: "center",
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  epText: { color: colors.text, fontSize: 12, fontWeight: "600" },
});
