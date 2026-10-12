import React from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import { MovieItem } from "../types";
import MovieCard from "./MovieCard";
import { colors } from "../lib/theme";

interface Props {
  title: string;
  movies: MovieItem[] | undefined;
  loading?: boolean;
  onMoviePress: (slug: string) => void;
  horizontal?: boolean;
}

export default function MovieSection({ title, movies, loading, onMoviePress, horizontal = true }: Props) {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!movies?.length) return null;

  if (horizontal) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {movies.map((m) => (
            <MovieCard key={m.slug} movie={m} onPress={onMoviePress} width={130} />
          ))}
        </ScrollView>
      </View>
    );
  }

  const cardWidth = (Dimensions.get("window").width - 24 - 20) / 3;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.grid}>
        {movies.map((m) => (
          <MovieCard key={m.slug} movie={m} onPress={onMoviePress} width={cardWidth} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 18 },
  title: {
    color: colors.text, fontSize: 17, fontWeight: "700",
    marginBottom: 10, paddingHorizontal: 12,
    borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 8, marginLeft: 4,
  },
  row: { paddingHorizontal: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 12 },
});
