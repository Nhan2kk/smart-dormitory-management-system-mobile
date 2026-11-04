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
                tone: tones.violet,
              },
              {
                kind: "staff",
                icon: "headset",
                label: t("chat.management"),
                tone: tones.success,
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
                  style={styles.option}
                  accessibilityLabel={option.label}
                  onPress={() => choose(option.kind)}
                  pressScale={0.92}
                >
                  <View style={[styles.label, shadow(2)]}>
                    <Text style={styles.labelText}>{option.label}</Text>
                    {option.kind === "staff" && info && (
                      <Text style={styles.status}>
                        {info.isWorkingHours
                          ? t("chat.working")
                          : t("chat.offHours", {
                              time: new Date(
                                info.nextOpenAt,
                              ).toLocaleTimeString(
                                lang === "en" ? "en-GB" : "vi-VN",
                                {
                                  timeZone: info.timezone,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              ),
                            })}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: option.tone.fg },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={23}
                      color={colors.onPrimary}
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
    gap: 18,
    alignItems: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    width: 310,
    maxWidth: "100%",
  },
  label: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexShrink: 1,
  },
  labelText: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  status: { color: colors.muted, fontSize: 10, marginTop: 3 },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
