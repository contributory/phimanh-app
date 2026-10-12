import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import Header, { RootStackParamList } from "../components/Header";
import MovieSection from "../components/MovieSection";
import { colors } from "../lib/theme";
import { stripHtml, formatYear } from "../lib/utils";
import {
  useCategories,
  useNewMovies,
  useMoviesByTopic,
  useRecommendedMovies,
} from "../hooks/use-movies";

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();

  const { data: categories } = useCategories();
  const { data: newData, isLoading, refetch } = useNewMovies(1);
  const [newItems] = newData ?? [[], null];

  const featured = newItems?.[0];
  const { data: recommended } = useRecommendedMovies(featured);

  const boQuery = useMoviesByTopic("phim-bo", 1);
  const leQuery = useMoviesByTopic("phim-le", 1);
  const hoatHinhQuery = useMoviesByTopic("hoat-hinh", 1);

  const openMovie = useCallback(
    (slug: string) => navigation.navigate("Watch", { slug }),
    [navigation]
  );

  const onRefresh = useCallback(() => {
    refetch();
    boQuery.refetch();
    leQuery.refetch();
    hoatHinhQuery.refetch();
  }, [refetch, boQuery, leQuery, hoatHinhQuery]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header categories={categories ?? []} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Hero */}
        {featured ? (
          <TouchableOpacity activeOpacity={0.9} onPress={() => openMovie(featured.slug)}>
            <View style={{ height: width * 0.62 }}>
              {(featured.thumb_url || featured.avatar) && (
                <Image
                  source={{ uri: featured.thumb_url || featured.avatar }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              )}
              <LinearGradient
                colors={["transparent", "rgba(10,10,15,0.85)", colors.background]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle} numberOfLines={2}>{featured.name}</Text>
                <Text style={styles.heroMeta} numberOfLines={1}>
                  {[
                    featured.type === "phim-bo" ? "Bộ dài tập" : featured.type === "phim-le" ? "Điện ảnh" : featured.type,
                    formatYear(featured.year),
                    featured.quality,
                    featured.lang,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                {!!featured.content && (
                  <Text style={styles.heroDesc} numberOfLines={3}>
                    {stripHtml(featured.content)}
                  </Text>
                )}
                <View style={styles.watchBtn}>
                  <Text style={styles.watchBtnText}>▶ Xem ngay</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.loadingHero}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        <MovieSection
          title="Phim mới cập nhật"
          movies={newItems?.slice(1)}
          loading={isLoading}
          onMoviePress={openMovie}
        />
        <MovieSection
          title="Gợi ý cho bạn"
          movies={recommended?.slice(0, 20)}
          loading={!recommended}
          onMoviePress={openMovie}
        />
        <MovieSection
          title="Phim Bộ"
          movies={boQuery.data?.[0]}
          loading={boQuery.isLoading}
          onMoviePress={openMovie}
        />
        <MovieSection
          title="Phim lẻ"
          movies={leQuery.data?.[0]}
          loading={leQuery.isLoading}
          onMoviePress={openMovie}
        />
        <MovieSection
          title="Hoạt hình"
          movies={hoatHinhQuery.data?.[0]}
          loading={hoatHinhQuery.isLoading}
          onMoviePress={openMovie}
        />
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  heroContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  heroMeta: { color: colors.accent, fontSize: 13, marginTop: 4, fontWeight: "600" },
  heroDesc: { color: colors.textMuted, fontSize: 12, marginTop: 6, lineHeight: 17 },
  watchBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  watchBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  loadingHero: { height: 220, alignItems: "center", justifyContent: "center" },
});
