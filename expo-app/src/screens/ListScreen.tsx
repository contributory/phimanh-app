import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet, Dimensions } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import MovieCard from "../components/MovieCard";
import Header, { RootStackParamList } from "../components/Header";
import { colors } from "../lib/theme";
import { useCategories, useMoviesByCategory, useMoviesByTopic, useNewMovies } from "../hooks/use-movies";

const PAGE_SIZE = 20;

export default function ListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "List">>();
  const { title, mode, slug } = route.params;

  const [page, setPage] = useState(1);
  const { data: categories } = useCategories();

  const categoryQuery = useMoviesByCategory(mode === "category" ? slug ?? "" : "", page);
  const topicQuery = useMoviesByTopic(mode === "topic" ? slug ?? "" : "", page);
  const newQuery = useNewMovies(mode === "new" || mode === "recently" ? page : 0 || page);

  const baseQuery =
    mode === "category" ? categoryQuery : mode === "topic" ? topicQuery : newQuery;

  const items = (baseQuery.data?.[0] ?? []).slice(0, page * PAGE_SIZE);
  const pagination = baseQuery.data?.[1];
  const canLoadMore = !pagination || pagination.currentPage < pagination.totalPages;

  const onEndReached = useCallback(() => {
    if (canLoadMore && !baseQuery.isFetching) setPage((p) => p + 1);
  }, [canLoadMore, baseQuery.isFetching]);

  const openMovie = useCallback(
    (s: string) => navigation.navigate("Watch", { slug: s }),
    [navigation]
  );

  const cardWidth = (Dimensions.get("window").width - 24 - 16) / 3;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header categories={categories ?? []} />
      <View style={styles.listHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>
      {baseQuery.isLoading && page === 1 ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => `${item.slug}-${i}`}
          numColumns={3}
          columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 12 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <MovieCard movie={item} onPress={openMovie} width={cardWidth} />}
          ListFooterComponent={
            baseQuery.isFetching && page > 1 ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
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
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 60, fontSize: 14 },
});
