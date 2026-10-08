import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { CircleButton, IconBadge, Touchable } from "../../shared/ui";
import { RequestKind, requestKindMeta } from "./requestModel";

const kinds: RequestKind[] = ["supportMaintenance", "roomTransfer", "roomCheckout"];

/** Bảng chọn loại yêu cầu, mở từ nút “+” giữa thanh tab. */
export function CreateRequestSheet() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [slide] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(slide, { toValue: 1, useNativeDriver: Platform.OS !== "web", friction: 9, tension: 70 }).start();
  }, [slide]);

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: slide }]}>
        <Pressable style={styles.backdrop} onPress={() => router.back()} accessibilityLabel={t("common.close")} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl, transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }] }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} accessibilityRole="header">
              {t("requests.sheetTitle")}
            </Text>
            <Text style={styles.subtitle}>{t("requests.sheetSubtitle")}</Text>
          </View>
          <CircleButton icon="close" label={t("common.close")} onPress={() => router.back()} />
        </View>
        <View style={{ gap: spacing.md }}>
          {kinds.map((kind) => {
            const meta = requestKindMeta[kind];
            return (
              <Touchable key={kind} onPress={() => router.replace(`/request/create/${kind}`)} accessibilityLabel={t(`requests.kind.${kind}`)} style={styles.option} pressScale={0.98}>
                <IconBadge icon={meta.icon} tone={meta.tone} size={52} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.optionTitle}>{t(`requests.kind.${kind}`)}</Text>
                  <Text style={styles.optionBody}>{t(`requests.kindDescription.${kind}`)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </Touchable>
            );
          })}
        </View>
        <Touchable onPress={() => router.replace("/assistant")} accessibilityLabel={t("requests.askAiFirst")} style={styles.ai}>
          <Ionicons name="sparkles" size={18} color={colors.violet} />
          <Text style={styles.aiText}>{t("requests.askAiFirst")}</Text>
        </Touchable>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl + 6, borderTopRightRadius: radius.xl + 6, paddingHorizontal: spacing.xl, width: "100%", maxWidth: 560, alignSelf: "center" },
  handle: { alignSelf: "center", width: 42, height: 5, borderRadius: 3, backgroundColor: colors.border, marginTop: 10 },
  head: { flexDirection: "row", alignItems: "center", paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  title: { ...font.title },
  subtitle: { ...font.body, fontSize: 14, color: colors.muted, marginTop: 2 },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  optionTitle: { ...font.heading, fontSize: 16 },
  optionBody: { ...font.body, fontSize: 13, lineHeight: 18 },
  ai: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: spacing.lg, paddingVertical: spacing.md },
  aiText: { color: colors.violet, fontWeight: "700", fontSize: 14 },
}));
