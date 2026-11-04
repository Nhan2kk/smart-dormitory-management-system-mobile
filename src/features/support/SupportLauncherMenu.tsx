import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, useTheme } from "../../shared/theme";
import { Touchable } from "../../shared/ui";
import { useSupportChatState } from "../chat/SupportChatProvider";

const nativeDriver = Platform.OS !== "web";
export function SupportLauncherMenu({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const { colors, tones, shadow } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { unread, info, allowed } = useSupportChatState();
  const [mounted, setMounted] = useState(visible);
  const [reduce, setReduce] = useState(false);
  const [overlay] = useState(() => new Animated.Value(0));
  const [turn] = useState(() => new Animated.Value(0));
  const [options] = useState(() => [
    new Animated.Value(0),
    new Animated.Value(0),
  ]);
  if (visible && !mounted) setMounted(true);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    const toValue = visible ? 1 : 0;
    const transitions = options.map((value) =>
      visible && !reduce
        ? Animated.spring(value, {
            toValue,
            friction: 6,
            useNativeDriver: nativeDriver,
          })
        : Animated.timing(value, {
            toValue,
            duration: reduce ? 100 : 120,
            useNativeDriver: nativeDriver,
          }),
    );
    const animation = Animated.parallel([
      Animated.timing(overlay, {
        toValue,
        duration: visible ? 180 : 120,
        useNativeDriver: nativeDriver,
      }),
      reduce
        ? Animated.timing(turn, {
            toValue,
            duration: 100,
            useNativeDriver: nativeDriver,
          })
        : Animated.spring(turn, {
            toValue,
            friction: 6,
            useNativeDriver: nativeDriver,
          }),
      Animated.stagger(
        visible && !reduce ? 60 : 0,
        visible ? transitions : [...transitions].reverse(),
      ),
    ]);
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, reduce, options, overlay, turn]);
  const choose = (kind: "ai" | "staff") => {
    onClose();
    router.push(kind === "ai" ? "/assistant" : "/chat");
  };
  const staffStatus = info
    ? info.isWorkingHours
      ? t("chat.working")
      : t("chat.offHours", {
          time: new Date(info.nextOpenAt).toLocaleTimeString(
            lang === "en" ? "en-GB" : "vi-VN",
            { timeZone: info.timezone, hour: "2-digit", minute: "2-digit" },
          ),
        })
    : "";
  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root} accessibilityViewIsModal>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlay }]}>
          <BlurView
            intensity={30}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            accessibilityLabel={t("common.close")}
            onPress={onClose}
            style={styles.overlay}
          />
        </Animated.View>
        <View
          pointerEvents="box-none"
          style={[
            styles.actions,
            { bottom: Math.max(insets.bottom - 6, 12) + 82 },
          ]}
        >
          {(
            [
              {
                kind: "ai",
                icon: "sparkles",
                label: t("chat.ai"),
                description: t("chat.aiSubtitle"),
              },
              {
                kind: "staff",
                icon: "headset",
                label: t("chat.management"),
                description: staffStatus,
              },
            ] as const
          ).map((option, index) =>
            option.kind === "staff" && !allowed ? null : (
              <Animated.View
                key={option.kind}
                style={{
                  opacity: options[index],
                  transform: reduce
                    ? []
                    : [
                        {
                          translateY: options[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [24, 0],
                          }),
                        },
                        {
                          scale: options[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.6, 1],
                          }),
                        },
                      ],
                }}
              >
                <Touchable
                  style={[styles.option, shadow(2)]}
                  accessibilityLabel={`${option.label}${option.description ? `, ${option.description}` : ""}`}
                  onPress={() => choose(option.kind)}
                  pressScale={0.96}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons
                      name={option.icon}
                      size={21}
                      color={colors.primary}
                    />
                    {option.kind === "staff" && unread > 0 && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: tones.danger.fg },
                        ]}
                      >
                        <Text style={styles.badgeText}>
                          {Math.min(unread, 99)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.label}>
                    <Text style={styles.labelText} numberOfLines={1}>
                      {option.label}
                    </Text>
                    {!!option.description && (
                      <View style={styles.statusRow}>
                        {option.kind === "staff" && info && (
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor: info.isWorkingHours
                                  ? tones.success.fg
                                  : tones.warning.fg,
                              },
                            ]}
                          />
                        )}
                        <Text style={styles.status} numberOfLines={1}>
                          {option.description}
                        </Text>
                      </View>
                    )}
                  </View>
                </Touchable>
              </Animated.View>
            ),
          )}
        </View>
        <View
          style={[
            styles.center,
            { bottom: Math.max(insets.bottom - 6, 12) + 7 },
          ]}
        >
          <Touchable
            accessibilityLabel={t("common.close")}
            onPress={onClose}
            style={[styles.main, shadow(2)]}
          >
            <Animated.View
              style={{
                position: "absolute",
                opacity: turn.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
                transform: reduce
                  ? []
                  : [
                      {
                        rotate: turn.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "135deg"],
                        }),
                      },
                    ],
              }}
            >
              <Ionicons name="chatbubbles" size={25} color={colors.onPrimary} />
            </Animated.View>
            <Animated.View style={{ opacity: turn }}>
              <Ionicons name="close" size={27} color={colors.onPrimary} />
            </Animated.View>
          </Touchable>
        </View>
      </View>
    </Modal>
  );
}
const useStyles = makeStyles(({ colors }) => ({
  root: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay, opacity: 0.6 },
  actions: {
    position: "absolute",
    left: 20,
    right: 20,
    gap: 10,
    alignItems: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: 264,
    maxWidth: "100%",
    minHeight: 58,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: 30,
    padding: 8,
    paddingRight: 14,
  },
  label: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  labelText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  status: { color: colors.muted, fontSize: 11, lineHeight: 15, flexShrink: 1 },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  main: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.onPrimary, fontSize: 10, fontWeight: "800" },
}));
