import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import MovieCard from "../components/MovieCard";
import { RootStackParamList } from "../components/Header";
import { colors } from "../lib/theme";
import { useSearchMovies } from "../hooks/use-movies";
import { debounce } from "../lib/utils";

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Search">>();

  const [text, setText] = useState(route.params?.initial ?? "");
  const [query, setQuery] = useState(text);

  const debouncedSetQuery = useMemo(() => debounce((q: string) => setQuery(q), 500), []);

  useEffect(() => {
    debouncedSetQuery(text);
  }, [text, debouncedSetQuery]);

  const { data, isFetching } = useSearchMovies(query, 1);
  const items = data?.[0] ?? [];

  const cardWidth = (Dimensions.get("window").width - 24 - 16) / 3;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <TextInput
          autoFocus
          style={styles.input}
          placeholder="Tìm phim, diễn viên…"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          returnKeyType="search"
        />
      </View>
      {isFetching && query ? (
        <View style={{ padding: 30, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.slug}
          numColumns={3}
          columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 12 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <MovieCard movie={item} onPress={(s) => navigation.navigate("Watch", { slug: s })} width={cardWidth} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {query ? "Không tìm thấy phim phù hợp." : "Nhập từ khóa để tìm phim."}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  bar: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  backText: { color: colors.text, fontSize: 22, paddingHorizontal: 4 },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    color: colors.text,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 60, fontSize: 14 },
});
