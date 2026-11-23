import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { Card, Touchable } from "../../shared/ui";

/** Thẻ mời bật thông báo đẩy: chuông lớn bên trái, tiêu đề, mô tả, nút bật và nút ẩn ở góc. */
export function PushPromptCard({ onEnable, onDismiss }: { onEnable: () => void; onDismiss: () => void }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Card style={styles.card}>
      <View style={[styles.art, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="notifications" size={34} color={colors.primary} />
        <View style={[styles.toggle, { backgroundColor: colors.surface }]}>
          <Ionicons name="notifications-outline" size={11} color={colors.primary} />
          <View style={[styles.switch, { backgroundColor: colors.primary }]}>
            <View style={styles.knob} />
          </View>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{t("notifications.enablePushTitle")}</Text>
        <Text style={styles.text}>{t("notifications.enablePushBody")}</Text>
        <Touchable onPress={onEnable} accessibilityLabel={t("notifications.enablePush")} pressScale={0.96}>
          <View style={[styles.button, { backgroundColor: colors.primary }]}>
            <Ionicons name="notifications-outline" size={16} color={colors.onPrimary} />
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{t("notifications.enablePush")}</Text>
          </View>
        </Touchable>
      </View>
      <Touchable onPress={onDismiss} accessibilityLabel={t("common.close")} style={styles.close}>
        <View style={[styles.closeCircle, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="close" size={16} color={colors.muted} />
        </View>
      </Touchable>
    </Card>
  );
}

const useStyles = makeStyles(({ font }) => ({
  card: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingRight: spacing.xl },
  art: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  toggle: { position: "absolute", right: -6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 4, borderRadius: radius.sm },
  switch: { width: 18, height: 10, borderRadius: 5, justifyContent: "center", alignItems: "flex-end", paddingHorizontal: 1 },
  knob: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  body: { flex: 1, gap: 4 },
  title: { ...font.heading, fontSize: 16 },
  text: { ...font.caption, fontSize: 13, lineHeight: 18 },
  button: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 9, borderRadius: radius.pill },
  buttonText: { fontSize: 13, fontWeight: "700" },
  close: { position: "absolute", top: spacing.sm, right: spacing.sm },
  closeCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
}));
