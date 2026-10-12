import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { MovieItem } from "../types";
import { colors } from "../lib/theme";
import { formatYear } from "../lib/utils";

interface Props {
  movie: MovieItem;
  onPress: (slug: string) => void;
  width?: number;
}

const POSTER_RATIO = 2 / 3;

export default function MovieCard({ movie, onPress, width = 150 }: Props) {
  const height = width / POSTER_RATIO;
  const poster = movie.avatar || movie.poster_url || movie.thumb_url;
  const episodeLabel = (movie as any).current_episode?.name;

  return (
    <Pressable
      onPress={() => onPress(movie.slug)}
      style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={{ width, height }}>
        {poster ? (
          <Image
            source={{ uri: poster }}
            style={styles.poster}
            resizeMode="cover"
            accessibilityLabel={movie.name}
          />
        ) : (
          <View style={[styles.poster, styles.placeholder]}>
            <Text style={styles.placeholderText}>{movie.name?.slice(0, 2)?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.badgeTop}>
          <Text style={styles.badgeText}>{movie.quality || "HD"}</Text>
        </View>
        {!!movie.lang && (
          <View style={styles.badgeLang}>
            <Text style={styles.badgeText}>{movie.lang}</Text>
          </View>
        )}
        {!!episodeLabel && (
          <View style={styles.badgeEpisode}>
            <Text style={styles.badgeText} numberOfLines={1}>{episodeLabel}</Text>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {movie.name}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {[formatYear(movie.year), movie.category?.[0]?.name].filter(Boolean).join(" · ")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: 10, marginBottom: 12 },
  poster: { width: "100%", height: "100%", borderRadius: 10, backgroundColor: colors.surfaceLight },
  placeholder: { alignItems: "center", justifyContent: "center" },
  placeholderText: { color: colors.textMuted, fontSize: 22, fontWeight: "700" },
  badgeTop: {
    position: "absolute", top: 6, left: 6,
    backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeLang: {
    position: "absolute", top: 6, right: 6,
    backgroundColor: "rgba(229,9,20,0.85)", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeEpisode: {
    position: "absolute", bottom: 6, right: 6, maxWidth: "80%",
    backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  title: { color: colors.text, fontSize: 13, fontWeight: "600", marginTop: 6 },
  meta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});
