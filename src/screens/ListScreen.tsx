import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Dimensions,
  RefreshControl,
  type ListRenderItem,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import MovieCard from "../components/MovieCard";
import Header, { RootStackParamList } from "../components/Header";
import { colors } from "../lib/theme";
import { MovieItem } from "../types";
import {
  useCategories,
  useNewMoviesInfinite,
  useMoviesByCategoryInfinite,
  useMoviesByTopicInfinite,
  movieKeys,
} from "../hooks/use-movies";

const PAGE_SIZE = 20;

/** FlatList virtualization tuning. Cards are rendered in 3 columns so we
 *  size the render window in whole rows. `windowSize: 3` keeps ~3 viewports
 *  worth of rows mounted; everything else is recycled. */
const INITIAL_ROWS = 3;        // 3 rows × 3 cols = 9 cards on first paint
const MAX_BATCH_ROWS = 2;      // additional rows per render batch
const WINDOW_SIZE = 3;         // viewport multiplier for mounted rows

export default function ListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "List">>();
  const { title, mode, slug } = route.params;

  const queryClient = useQueryClient();
  const { data: categories } = useCategories();

  // Always call all three hooks (React rules). Only one will be enabled at
  // a time, the other two stay idle and resolve to empty pages.
  const categoryQ = useMoviesByCategoryInfinite(mode === "category" ? slug ?? "" : "");
  const topicQ = useMoviesByTopicInfinite(mode === "topic" ? slug ?? "" : "");
  const newQ = useNewMoviesInfinite();

  const q =
    mode === "category" ? categoryQ : mode === "topic" ? topicQ : newQ;

  // Flatten the page window into a single deduped array. `capPages` in the
  // hook already bounds the number of pages, so this stays O(MAX_PAGES * 20).
  const items = useMemo<MovieItem[]>(() => {
    const seen = new Set<string>();
    const out: MovieItem[] = [];
    for (const page of q.data?.pages ?? []) {
      for (const m of page[0] ?? []) {
        if (!m?.slug || seen.has(m.slug)) continue;
        seen.add(m.slug);
        out.push(m);
      }
    }
    return out;
  }, [q.data]);

  const onEndReached = useCallback(() => {
    if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
  }, [q.hasNextPage, q.isFetchingNextPage, q]);

  // On pull-to-refresh we only re-fetch the first page; pages 2+ stay
  // cached so the user doesn't see the visible list reset to empty. We do
  // this by trimming the cache down to just page 1 before calling
  // `refetch()` — once page 1's fresh data lands, the user can scroll
  // forward again to lazily load the rest.
  const onRefresh = useCallback(() => {
    if (!slug && mode !== "new") return;
    const queryKey =
      mode === "category"
        ? movieKeys.list({ type: "category", slug })
        : mode === "topic"
        ? movieKeys.list({ type: "topic", slug })
        : movieKeys.list({ type: "new" });
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old?.pages?.length) return old;
      return { pages: [old.pages[0]], pageParams: [old.pageParams[0]] };
    });
    q.refetch();
  }, [q, queryClient, mode, slug]);

  const openMovie = useCallback(
    (s: string) => navigation.navigate("Watch", { slug: s }),
    [navigation]
  );

  const cardWidth = (Dimensions.get("window").width - 24 - 16) / 3;
  const isInitialLoading = q.isLoading && items.length === 0;
  const isRefreshing = q.isFetching && !q.isFetchingNextPage;

  const renderItem: ListRenderItem<MovieItem> = useCallback(
    ({ item }) => <MovieCard movie={item} onPress={openMovie} width={cardWidth} />,
    [openMovie, cardWidth]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header categories={categories ?? []} />
      <View style={styles.listHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>
      {isInitialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.slug}
          numColumns={3}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.content}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
            />
          }
          // ── Virtualization tuning ──────────────────────────────────────
          // These three props keep memory + render cost flat regardless of
          // how many pages have been accumulated. `removeClippedSubviews`
          // unmounts rows that scroll off-screen; `initialNumToRender` and
          // `maxToRenderPerBatch` cap how many rows mount per frame.
          removeClippedSubviews
          initialNumToRender={INITIAL_ROWS * 3}
          maxToRenderPerBatch={MAX_BATCH_ROWS * 3}
          windowSize={WINDOW_SIZE}
          updateCellsBatchingPeriod={50}
          ListFooterComponent={
            q.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={styles.footer} />
            ) : !q.hasNextPage && items.length > 0 ? (
              <Text style={styles.endText}>Đã hết danh sách.</Text>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>Không có phim nào.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  listHeader: { paddingHorizontal: 12, paddingVertical: 10 },
  backBtn: { marginBottom: 6 },
  backText: { color: colors.textMuted, fontSize: 13 },
  title: { color: colors.text, fontSize: 18, fontWeight: "800" },
  column: { justifyContent: "space-between", paddingHorizontal: 12 },
  content: { paddingBottom: 40 },
  center: { padding: 40, alignItems: "center" },
  footer: { marginVertical: 16 },
  endText: {
    color: colors.textMuted,
    textAlign: "center",
    marginVertical: 24,
    fontSize: 12,
  },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 60, fontSize: 14 },
});
