import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";
import { WebView } from "react-native-webview";
import { colors } from "../lib/theme";
import VideoControls, { type PlayerStatus } from "./VideoControls";

interface Props {
  /** Direct HLS/MP4 stream URL (played natively with expo-video) */
  uri?: string | null;
  /** Embed page URL rendered in a WebView (fallback / embed servers) */
  embedUri?: string | null;
  onEnded?: () => void;
}

/** How often (in seconds) `timeUpdate` fires — gives smooth progress without
 *  forcing a 60 fps re-render. */
const TIME_UPDATE_INTERVAL = 0.25;

export default function VideoPlayer({ uri, embedUri, onEnded }: Props) {
  const [failed, setFailed] = useState(false);

  const source: VideoSource | null = uri ? { uri } : null;

  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = TIME_UPDATE_INTERVAL;
    if (source) p.play();
  });

  // Mirrored state from the player — updated via subscriptions so the UI
  // re-renders on status/time/play changes without polling.
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Subscribe to player events.
  useEffect(() => {
    if (!player) return;

    const statusSub = player.addListener("statusChange", (event) => {
      setStatus(event.status as PlayerStatus);
      if (event.status === "error") setFailed(true);
    });

    const playingSub = player.addListener("playingChange", (event) => {
      setPlaying(event.isPlaying);
    });

    const endSub = player.addListener("playToEnd", () => {
      setPlaying(false);
      onEnded?.();
    });

    // The `timeUpdate` event fires at `timeUpdateEventInterval` cadence and
    // includes the latest `currentTime`. We also pick up `duration` here,
    // since it becomes available only after source load.
    const timeSub = player.addListener("timeUpdate", (event: any) => {
      if (typeof event.currentTime === "number") setCurrentTime(event.currentTime);
    });

    // Snapshot initial values (events may have fired before subscription).
    setStatus(player.status as PlayerStatus);
    setPlaying(player.playing);
    if (isFinite(player.duration)) setDuration(player.duration);

    return () => {
      statusSub.remove();
      playingSub.remove();
      endSub.remove();
      timeSub.remove();
    };
  }, [player, onEnded]);

  // Pick up duration once the source finishes loading.
  useEffect(() => {
    if (!player) return;
    if (status === "readyToPlay" || status === "playing" || status === "paused") {
      if (isFinite(player.duration) && player.duration > 0) setDuration(player.duration);
    }
  }, [player, status]);

  // Track the player's fullscreen state via the documented event (when the
  // platform exposes it). The icon needs to reflect the actual state, not
  // just the last toggle.
  useEffect(() => {
    if (!player) return;
    // The event name in the SDK is `fullscreenChange`; if it's not present
    // we silently no-op and the icon stays in its last known state.
    const anyPlayer = player as any;
    if (typeof anyPlayer.addListener !== "function") return;
    let sub: { remove: () => void } | undefined;
    try {
      sub = anyPlayer.addListener("fullscreenChange", (e: any) => {
        if (e && typeof e.isFullscreen === "boolean") setIsFullscreen(e.isFullscreen);
      });
    } catch {
      // Event not supported in this SDK — ignore.
    }
    return () => {
      try {
        sub?.remove?.();
      } catch {
        /* noop */
      }
    };
  }, [player]);

  // ---- Imperative control handlers ----
  const handleTogglePlay = useCallback(() => {
    if (!player) return;
    if (player.playing) player.pause();
    else player.play();
  }, [player]);

  const handleSeek = useCallback(
    (time: number) => {
      if (!player) return;
      const total = player.duration && isFinite(player.duration) ? player.duration : time;
      const clamped = Math.max(0, Math.min(time, total));
      player.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [player]
  );

  const handleSkip = useCallback(
    (delta: number) => {
      if (!player) return;
      const target = (player.currentTime || 0) + delta;
      handleSeek(target);
    },
    [player, handleSeek]
  );

  const handleToggleFullscreen = useCallback(() => {
    if (!player) return;
    const anyPlayer = player as any;
    if (typeof anyPlayer.isFullscreen === "boolean" && anyPlayer.isFullscreen) {
      anyPlayer.isFullscreen = false;
      setIsFullscreen(false);
    } else {
      anyPlayer.isFullscreen = true;
      setIsFullscreen(true);
    }
  }, [player]);

  // ---- Render paths ----
  if (uri && !failed) {
    return (
      <View style={styles.container}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          // Custom controls live in a sibling overlay below; the native ones
          // would only add visual noise on top of ours.
          nativeControls={false}
          fullscreenOptions={{
            enable: true,
            orientation: "landscape",
            autoExitOnRotate: true,
          }}
          allowsPictureInPicture
        />
        <VideoControls
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          status={status}
          isFullscreen={isFullscreen}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          onToggleFullscreen={handleToggleFullscreen}
          onSkip={handleSkip}
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
