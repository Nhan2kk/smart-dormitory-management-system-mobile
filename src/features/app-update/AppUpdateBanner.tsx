import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppVersionService } from "../../services/app-version.service";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { radius, useTheme } from "../../shared/theme";
import { Touchable } from "../../shared/ui";

/** Kiểm tra lại định kỳ khi app đang mở, và mỗi lần quay lại app (không quá 1 lần / phút). */
const PERIODIC_MS = 30 * 60 * 1000;
const MIN_GAP_MS = 60 * 1000;
const nativeDriver = Platform.OS !== "web";

/**
 * Bản web: báo "Đã có phiên bản mới" khi máy chủ có bản deploy mới, cùng kiểu với toast của app (thẻ tối bo
 * góc ở trên cùng). Không tự tải lại để không làm mất biểu mẫu đang nhập; người dùng bấm "Tải lại".
 */
export function AppUpdateBanner() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { colors, tones, shadow } = useTheme();
  const service = useMemo(() => new AppVersionService(), []);
  const [available, setAvailable] = useState<string | null>(null);
  const dismissed = useRef<string | null>(null);
  const lastCheck = useRef(0);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!AppVersionService.supported) return;
    const check = () => {
      const now = Date.now();
      if (now - lastCheck.current < MIN_GAP_MS) return;
      lastCheck.current = now;
      void service.newerVersion().then((latest) => {
        if (latest && latest !== dismissed.current) setAvailable(latest);
      });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    check();
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(check, PERIODIC_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [service]);

  useEffect(() => {
    if (!available) return;
    progress.setValue(0);
    Animated.spring(progress, { toValue: 1, useNativeDriver: nativeDriver, friction: 8 }).start();
  }, [available, progress]);

  if (!available) return null;

  const dismiss = () => {
    dismissed.current = available;
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: nativeDriver }).start(() =>
      setAvailable(null),
    );
  };

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.wrap,
        {
          top: insets.top + 8,
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
        },
      ]}
    >
      {/* Nền đặc thay cho kính mờ: Safari iPhone vẽ hỏng backdrop-filter ở phần tử nổi. */}
      <View style={[styles.card, shadow(3)]}>
        <View style={[styles.icon, { backgroundColor: tones.info.bg }]}>
          <Ionicons name="refresh" size={17} color={tones.info.fg} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title}>{t("appUpdate.title")}</Text>
          <Text style={styles.body}>{t("appUpdate.body")}</Text>
        </View>
        <Touchable
          onPress={AppVersionService.reload}
          accessibilityLabel={t("appUpdate.reload")}
          style={[styles.reload, { backgroundColor: colors.primary }]}
          pressScale={0.94}
        >
          <Text style={[styles.reloadText, { color: colors.onPrimary }]}>{t("appUpdate.reload")}</Text>
        </Touchable>
        <Touchable onPress={dismiss} accessibilityLabel={t("common.close")} style={styles.close} pressScale={0.9}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.75)" />
        </Touchable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, alignItems: "center", zIndex: 1001 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    maxWidth: 480,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: radius.lg,
    backgroundColor: "rgba(20,14,10,0.92)",
  },
  icon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  texts: { flex: 1, gap: 2 },
  title: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", lineHeight: 19 },
  body: { color: "rgba(255,255,255,0.78)", fontSize: 12.5, fontWeight: "500", lineHeight: 17 },
  reload: { paddingHorizontal: 14, height: 34, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  reloadText: { fontSize: 13, fontWeight: "700" },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
