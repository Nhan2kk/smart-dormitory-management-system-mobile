import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { AppHeader, Button, Card, EmptyState, FooterBar, IconBadge, InfoRow, Screen } from "../../shared/ui";
import { notificationKindMeta, NotificationRepository } from "./notifications.mock";

export function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, l } = useI18n();
  const { tones } = useTheme();
  const styles = useStyles();
  const item = NotificationRepository.find(String(id));

  if (!item)
    return (
      <Screen header={<AppHeader title={t("notifications.title")} />}>
        <EmptyState icon="search-outline" title={t("common.notFound")} />
      </Screen>
    );

  const kind = notificationKindMeta[item.kind];
  const link = item.link;
  return (
    <Screen
      header={<AppHeader title={t("notifications.detail")} />}
      footer={
        link ? (
          <FooterBar>
            <Button label={l(link.label)} icon="arrow-forward" iconPosition="right" onPress={() => router.push(link.href)} style={{ flex: 1 }} />
          </FooterBar>
        ) : undefined
      }
    >
      <View style={[styles.banner, { backgroundColor: tones[kind.tone].bg }]}>
        <IconBadge icon={kind.icon} tone={kind.tone} size={56} rounded="circle" />
        <Text style={[styles.kind, { color: tones[kind.tone].fg }]}>{t(`notifications.kind.${item.kind}`)}</Text>
      </View>
      <Text style={styles.title}>{l(item.title)}</Text>
      <Text style={styles.meta}>
        {l(item.sender)} · {Formatter.dateTime(item.sentAt)}
      </Text>
      <Text style={styles.content}>{l(item.content)}</Text>
      <Card style={{ paddingVertical: spacing.xs, marginTop: spacing.xxl }}>
        <InfoRow label={t("notifications.level")} value={t(`notifications.priority.${item.priority}`)} />
        <InfoRow label={t("notifications.source")} value={t(`notifications.sources.${item.source}`)} />
        <InfoRow label={t("notifications.sender")} value={l(item.sender)} divider={false} />
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  banner: { alignItems: "center", paddingVertical: spacing.xl, borderRadius: radius.xl, gap: spacing.sm },
  kind: { fontWeight: "800", fontSize: 13 },
  title: { ...font.title, marginTop: spacing.xl },
  meta: { ...font.caption, fontSize: 13, marginTop: spacing.sm },
  content: { ...font.body, fontSize: 16, lineHeight: 25, color: colors.inkSoft, marginTop: spacing.lg },
}));
