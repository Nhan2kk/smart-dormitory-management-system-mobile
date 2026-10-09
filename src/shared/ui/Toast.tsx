import { Ionicons } from "@expo/vector-icons";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, Tone, useTheme } from "../theme";
import { Glass } from "./Glass";

type ToastMessage = { id: number; text: string; tone: Tone };
type ToastContextValue = { notify: (text: string, tone?: Tone) => void };

const ToastContext = createContext<ToastContextValue | null>(null);
const nativeDriver = Platform.OS !== "web";

const icons: Partial<Record<Tone, keyof typeof Ionicons.glyphMap>> = {
  success: "checkmark-circle",
  danger: "alert-circle",
  warning: "warning",
  info: "information-circle",
};

/** Thông báo nổi (toast) — dùng cho mọi phản hồi thao tác và lỗi từ API. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { tones, shadow } = useTheme();
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((text: string, tone: Tone = "success") => {
    setMessage({ id: Date.now(), text, tone });
  }, []);

  // Chạy hiệu ứng sau khi toast đã mount để giá trị Animated gắn đúng vào view.
  const messageId = message?.id;
  useEffect(() => {
    if (!messageId) return;
    if (timer.current) clearTimeout(timer.current);
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: nativeDriver,
      friction: 8,
    }).start();
    timer.current = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: 220,
        useNativeDriver: nativeDriver,
      }).start(() => setMessage(null));
    }, 2800);
  }, [messageId, progress]);

  const value = useMemo(() => ({ notify }), [notify]);
  const palette = message ? tones[message.tone] : tones.success;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message && (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[
            styles.wrap,
            {
              top: insets.top + 8,
              opacity: progress,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-24, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Glass
            variant="photo"
            strong
            intensity={60}
            style={[styles.toast, shadow(3)]}
          >
            <View style={[styles.icon, { backgroundColor: palette.bg }]}>
              <Ionicons
                name={icons[message.tone] ?? "notifications"}
                size={18}
                color={palette.fg}
              />
            </View>
            <Text style={styles.text}>{message.text}</Text>
          </Glass>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast phải nằm trong ToastProvider");
  return context;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 18,
    borderRadius: radius.lg,
    maxWidth: 480,
    backgroundColor: "rgba(20,14,10,0.6)",
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    lineHeight: 19,
  },
});
