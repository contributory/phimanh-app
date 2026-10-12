import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { colors } from "../lib/theme";

interface Props {
  /** Direct HLS/MP4 stream URL (played natively with expo-video) */
  uri?: string | null;
  /** Embed page URL rendered in a WebView (fallback / embed servers) */
  embedUri?: string | null;
  onEnded?: () => void;
}

export default function VideoPlayer({ uri, embedUri, onEnded }: Props) {
  const [failed, setFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const source: VideoSource | null = uri ? { uri } : null;

  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    if (source) p.play();
  });

  // ---- Player event subscriptions ----
  useEffect(() => {
    if (!player) return;

    const statusSub = player.addListener("statusChange", (event) => {
      if (event.status === "error") setFailed(true);
    });

    const endSub = player.addListener("playToEnd", () => {
      onEnded?.();
    });

    // The native fullscreen UI (invoked by the platform controls) emits
    // `fullscreenChange` on the player. We mirror it into local state so a
    // useEffect can lock the device orientation.
    let fullscreenSub: { remove: () => void } | undefined;
    try {
      const anyPlayer = player as any;
      if (typeof anyPlayer.addListener === "function") {
        fullscreenSub = anyPlayer.addListener(
          "fullscreenChange",
          (e: any) => {
            if (e && typeof e.isFullscreen === "boolean") {
              setIsFullscreen(e.isFullscreen);
            }
          }
        );
      }
    } catch {
      // Event not supported on this platform — ignore.
    }

    return () => {
      statusSub.remove();
      endSub.remove();
      try {
        fullscreenSub?.remove?.();
      } catch {
        /* noop */
      }
    };
  }, [player, onEnded]);

  // ---- Orientation + status bar synced to fullscreen state ----
  useEffect(() => {
    let cancelled = false;
    const apply = async () => {
      try {
        if (isFullscreen) {
          // Lock to any landscape variant (regular + reverse) so the user
          // can flip the device either way. Hide the status bar for an
          // immersive experience.
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE
          );
          StatusBar.setHidden(true, "fade");
        } else {
          // Restore the app's default orientation (portrait per app.json).
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT
          );
          StatusBar.setHidden(false, "fade");
        }
      } catch {
        // `expo-screen-orientation` is a no-op on web and can throw on
        // platforms that don't support locking. Swallow.
      }
    };
    if (!cancelled) apply();
    return () => {
      cancelled = true;
    };
  }, [isFullscreen]);

  // Make sure we never leave the app in landscape if the user navigates
  // away while the video is in fullscreen.
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT
      ).catch(() => {});
      StatusBar.setHidden(false, "fade");
    };
  }, []);

  // ---- Render paths ----
  if (uri && !failed) {
    return (
      <View style={styles.container}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          // `fullscreenOptions.enable: true` is what wires up the working
          // fullscreen toggle in the platform's native controls. The
          // orientation hint makes the player default to landscape, and our
          // fullscreenChange listener actually locks the device orientation
          // so the whole app rotates.
          fullscreenOptions={{
            enable: true,
            orientation: "landscape",
            autoExitOnRotate: true,
          }}
          allowsPictureInPicture
        />
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
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  errorText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
