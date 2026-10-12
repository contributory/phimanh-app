import React from "react";
import { View, Text, FlatList, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getRecentlyWatched } from "../services/storage";
import MovieCard from "../components/MovieCard";
import Header, { RootStackParamList } from "../components/Header";
import { colors } from "../lib/theme";
import { useCategories } from "../hooks/use-movies";

export default function RecentlyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: categories } = useCategories();
  const { data: items } = useQuery({
    queryKey: ["recently-watched"],
    queryFn: () => getRecentlyWatched(),
  });

  const cardWidth = (Dimensions.get("window").width - 24 - 16) / 3;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header categories={categories ?? []} />
      <Text style={styles.title}>Xem gần đây</Text>
      <FlatList
        data={items ?? []}
        keyExtractor={(m, i) => `${m.slug}-${i}`}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MovieCard movie={item} onPress={(s) => navigation.navigate("Watch", { slug: s })} width={cardWidth} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có phim nào được xem gần đây.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 18, fontWeight: "800", padding: 14 },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 60, fontSize: 14 },
});
