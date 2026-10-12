import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/theme";

/** Player status values exposed by `expo-video`. */
export type PlayerStatus =
  | "idle"
  | "loading"
  | "readyToPlay"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export interface VideoControlsProps {
  /** Whether the video is currently playing. */
  playing: boolean;
  /** Current playback time in seconds. */
  currentTime: number;
  /** Total video duration in seconds. */
  duration: number;
  /** Current player status. */
  status: PlayerStatus;
  /** Whether the player entered fullscreen mode. */
  isFullscreen?: boolean;
  /** Called when the user taps the play/pause button. */
  onTogglePlay: () => void;
  /** Called when the user seeks to a new time (in seconds). */
  onSeek: (timeSeconds: number) => void;
  /** Called when the user taps the fullscreen toggle. */
  onToggleFullscreen: () => void;
  /** Called when the user taps the ±10s skip buttons. */
  onSkip: (deltaSeconds: number) => void;
}

/** Hide the controls after this many ms of inactivity. */
const AUTO_HIDE_MS = 3000;
/** Auto-hide is disabled while the user is dragging the seek bar. */
const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

export default function VideoControls({
  playing,
  currentTime,
  duration,
  status,
  isFullscreen,
  onTogglePlay,
  onSeek,
  onToggleFullscreen,
  onSkip,
}: VideoControlsProps) {
  // Always show when paused/loading/ended; auto-hide 3s after the last interaction while playing.
  const [visible, setVisible] = useState(true);
  const [barWidth, setBarWidth] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the time the user last interacted so the auto-hide can reset.
  const lastInteractionRef = useRef<number>(Date.now());

  const show = useCallback(() => {
    lastInteractionRef.current = Date.now();
    setVisible(true);
    Animated.timing(fade, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      // Only hide while actively playing. Paused/buffering/ended states keep
      // the controls visible so the user can resume or seek.
      setVisible((prev) => {
        if (playing && status === "playing") {
          Animated.timing(fade, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }).start();
          return false;
        }
        return prev;
      });
    }, AUTO_HIDE_MS);
  }, [fade, playing, status]);

  // Re-schedule the auto-hide whenever visibility or play state changes.
  useEffect(() => {
    if (visible && playing && status === "playing") {
      scheduleHide();
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [visible, playing, status, scheduleHide]);

  // Force-show the controls when paused/loading/ended regardless of timer.
  useEffect(() => {
    if (!playing || status === "loading" || status === "ended" || status === "error") {
      show();
    }
  }, [playing, status, show]);

  // Tap on the video area toggles controls.
  const handleTap = useCallback(() => {
    if (visible) {
      // If controls are visible, a tap hides them (except when paused, where
      // we instead resume playback — a common video player convention).
      if (!playing) {
        onTogglePlay();
        return;
      }
      setVisible(false);
      Animated.timing(fade, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      show();
    }
  }, [visible, playing, fade, show, onTogglePlay]);

  // ---- Seek bar ----
  // Use a PanResponder so the user can both tap anywhere on the bar AND drag
  // the thumb. We measure the bar's width onLayout, then translate the
  // touch X-coordinate into a time.
  const seekingRef = useRef(false);
  const seekRatioRef = useRef(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          seekingRef.current = true;
          show();
          if (barWidth > 0) {
            const x = Math.max(0, Math.min(barWidth, e.nativeEvent.locationX));
            seekRatioRef.current = x / barWidth;
            onSeek(seekRatioRef.current * duration);
          }
        },
        onPanResponderMove: (e, gesture) => {
          if (!seekingRef.current) return;
          if (barWidth > 0) {
            const x = Math.max(0, Math.min(barWidth, e.nativeEvent.locationX));
            seekRatioRef.current = x / barWidth;
            onSeek(seekRatioRef.current * duration);
          }
        },
        onPanResponderRelease: () => {
          seekingRef.current = false;
        },
        onPanResponderTerminate: () => {
          seekingRef.current = false;
        },
      }),
    [barWidth, duration, onSeek, show]
  );

  const onBarLayout = useCallback((e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  }, []);

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  // ---- Derived UI state ----
  const isLoading = status === "loading" || status === "idle";
  const isError = status === "error";
  const showCenterPlay = !playing && !isLoading && !isError;

  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={handleTap}
    >
      {/* Backdrop gradient — kept permanently so the seek bar stays readable
          even when controls are technically hidden. The overlay fades together
          with the rest of the controls. */}
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[
          styles.backdropTop,
          { opacity: fade },
        ]}
      />
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[
          styles.backdropBottom,
          { opacity: fade },
        ]}
      />

      {/* Top fade with title-area affordance */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.topBar,
          { opacity: fade },
        ]}
      >
        <View style={styles.topRight}>
          {/* Right-aligned fullscreen button keeps symmetry with the bottom
              fullscreen button. */}
          <Pressable
            onPress={onToggleFullscreen}
            hitSlop={12}
            style={styles.iconBtn}
            accessibilityLabel="Toàn màn hình"
          >
            <Ionicons
              name={isFullscreen ? "contract" : "expand"}
              size={22}
              color="#fff"
            />
          </Pressable>
        </View>
      </Animated.View>

      {/* Center area: big play button or loader */}
      <Animated.View
        pointerEvents="none"
        style={[styles.center, { opacity: fade }]}
      >
        {isLoading ? (
          <View style={styles.centerBubble}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Đang tải…</Text>
          </View>
        ) : isError ? (
          <View style={styles.centerBubble}>
            <Ionicons name="alert-circle" size={36} color={colors.primary} />
            <Text style={styles.errorText}>Không phát được video</Text>
          </View>
        ) : showCenterPlay ? (
          <Pressable
            onPress={onTogglePlay}
            hitSlop={20}
            style={({ pressed }) => [
              styles.centerBubble,
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
            accessibilityLabel="Phát"
          >
            <Ionicons name="play" size={42} color="#fff" />
          </Pressable>
        ) : null}
      </Animated.View>

      {/* Skip ±10s side buttons */}
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[styles.skipRow, { opacity: fade }]}
      >
        <Pressable
          onPress={() => onSkip(-10)}
          hitSlop={12}
          style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
          accessibilityLabel="Lùi 10 giây"
        >
          <Ionicons name="play-skip-back" size={18} color="#fff" />
          <Text style={styles.skipText}>10s</Text>
        </Pressable>
        <Pressable
          onPress={() => onSkip(10)}
          hitSlop={12}
          style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
          accessibilityLabel="Tới 10 giây"
        >
          <Text style={styles.skipText}>10s</Text>
          <Ionicons name="play-skip-forward" size={18} color="#fff" />
        </Pressable>
      </Animated.View>

      {/* Bottom bar: seek + time + controls */}
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[styles.bottomBar, { opacity: fade }]}
      >
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View
          style={styles.seekBar}
          onLayout={onBarLayout}
          {...panResponder.panHandlers}
        >
          <View style={styles.seekTrack} />
          <View
            style={[
              styles.seekFill,
              { width: `${progress * 100}%` },
            ]}
          />
          <View
            style={[
              styles.seekThumb,
              { left: `${progress * 100}%` },
            ]}
          />
        </View>

        <View style={styles.controlsRow}>
          <Pressable
            onPress={onTogglePlay}
            hitSlop={12}
            style={({ pressed }) => [styles.playBtn, pressed && styles.pressed]}
            accessibilityLabel={playing ? "Tạm dừng" : "Phát"}
          >
            <Ionicons name={playing ? "pause" : "play"} size={20} color="#fff" />
          </Pressable>
          <View style={styles.controlsSpacer} />
          <Pressable
            onPress={onToggleFullscreen}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityLabel="Toàn màn hình"
          >
            <Ionicons
              name={isFullscreen ? "contract" : "expand"}
              size={20}
              color="#fff"
            />
          </Pressable>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const BAR_HEIGHT = 56;
const THUMB_SIZE = 14;

const styles = StyleSheet.create({
  backdropTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  backdropBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  centerBubble: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#fff", fontSize: 11, marginTop: 6, opacity: 0.85 },
  errorText: { color: "#fff", fontSize: 12, marginTop: 6, opacity: 0.9 },
  skipRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: BAR_HEIGHT + 90,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 28,
  },
  skipBtn: {
    width: 56,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  skipText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 8,
  },
  timeRow: { flexDirection: "row", justifyContent: "space-between" },
  timeText: { color: "#fff", fontSize: 11, fontVariant: ["tabular-nums"], opacity: 0.9 },
  seekBar: {
    height: 28,
    justifyContent: "center",
    marginVertical: 2,
  },
  seekTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  seekFill: {
    position: "absolute",
    left: 0,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.primary,
  },
  seekThumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginLeft: -THUMB_SIZE / 2,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  controlsRow: { flexDirection: "row", alignItems: "center", height: 32 },
  playBtn: {
    width: 36,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(229,9,20,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlsSpacer: { flex: 1 },
  iconBtn: {
    width: 36,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.6, transform: [{ scale: 0.96 }] },
});
