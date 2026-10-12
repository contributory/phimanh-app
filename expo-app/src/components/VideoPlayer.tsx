import React, { useCallback, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
// @ts-ignore -- expo-av exposes Video as default export (class component)
import { Video, ResizeMode } from "expo-av";
import { WebView } from "react-native-webview";
import { colors } from "../lib/theme";

interface Props {
  /** Direct HLS/MP4 stream URL (played natively with expo-av) */
  uri?: string | null;
  /** Embed page URL rendered in a WebView (fallback / embed servers) */
  embedUri?: string | null;
  onEnded?: () => void;
}

export default function VideoPlayer({ uri, embedUri, onEnded }: Props) {
  const videoRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const onPlaybackStatusUpdate = useCallback(
    (s: any) => {
      if (!s.isLoaded && s.error) setFailed(true);
      if (s.isLoaded && s.didJustFinish) onEnded?.();
    },
    [onEnded]
  );

  const toggleFullscreen = useCallback(async () => {
    try {
      if (isFullscreen) await videoRef.current?.dismissFullscreenPlayer();
      else await videoRef.current?.presentFullscreenPlayer();
      setIsFullscreen((v) => !v);
    } catch {
      setIsFullscreen((v) => !v);
    }
  }, [isFullscreen]);

  // Native HLS playback preferred; fall back to WebView embed on error.
  if (uri && !failed) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreen]}>
        <Video
          ref={videoRef}
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          useNativeControls
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />
        {!isFullscreen && (
          <TouchableOpacity style={styles.fsButton} onPress={toggleFullscreen}>
            <Text style={styles.fsText}>⛶</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (embedUri) {
    return (
      <View style={styles.container}>
        <WebView
          source={{ uri: embedUri }}
          style={StyleSheet.absoluteFill}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={["*"]}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={colors.primary} />
        {failed && !embedUri ? (
          <Text style={styles.errorText}>Không tải được tập phim này.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: Dimensions.get("window").width,
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },
  fullscreen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    zIndex: 999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  errorText: { color: "#fff", fontSize: 12, marginTop: 8, textAlign: "center", paddingHorizontal: 16 },
  fsButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 6,
  },
  fsText: { color: "#fff", fontSize: 18 },
});
