import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { errorMessage } from "../../shared/api";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { AppHeader, Button, Card, EmptyState, FooterBar, IconBadge, InfoRow, Screen, useToast } from "../../shared/ui";
import { notificationHref, notificationKindMeta } from "./notificationMeta";
import { useNotifications } from "./NotificationsProvider";

export function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { tones } = useTheme();
  const { notify } = useToast();
  const styles = useStyles();
  const { items, markRead, acknowledge } = useNotifications();
  const [acknowledging, setAcknowledging] = useState(false);
  const item = items?.find((entry) => entry.id === String(id));

  // Mở thông báo từ đường khác (vd. trang chủ) cũng tính là đã đọc.
  useEffect(() => {
    if (item && !item.read) markRead(item.id);
  }, [item, markRead]);

  if (!item)
    return (
      <Screen header={<AppHeader title={t("notifications.title")} />}>
        <EmptyState art="search" icon="search-outline" title={t("common.notFound")} />
      </Screen>
    );

  const kind = notificationKindMeta[item.kind];
  const href = notificationHref(item.targetPath);
  const needsAck = item.requiresAcknowledgement && !item.acknowledgedAt;
  const sender = item.sender ?? t(`notifications.sources.${item.source}`);

  const confirm = async () => {
    setAcknowledging(true);
    try {
      await acknowledge(item.id);
      notify(t("notifications.acknowledged"));
    } catch (reason) {
      notify(errorMessage(reason), "danger");
    } finally {
      setAcknowledging(false);
    }
  };

  return (
    <Screen
      header={<AppHeader title={t("notifications.detail")} />}
      footer={
        href || needsAck ? (
          <FooterBar>
            {needsAck && <Button label={t("notifications.acknowledge")} icon="checkmark" variant={href ? "ghost" : "primary"} loading={acknowledging} onPress={confirm} style={{ flex: 1 }} />}
            {href && <Button label={t("notifications.open")} icon="arrow-forward" iconPosition="right" onPress={() => router.push(href)} style={{ flex: 1 }} />}
          </FooterBar>
        ) : undefined
      }
    >
      <View style={[styles.banner, { backgroundColor: tones[kind.tone].bg }]}>
        <IconBadge icon={kind.icon} tone={kind.tone} size={56} rounded="circle" />
        <Text style={[styles.kind, { color: tones[kind.tone].fg }]}>{t(`notifications.kind.${item.kind}`)}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>
        {sender} · {Formatter.dateTime(item.sentAt)}
      </Text>
      <Text style={styles.content}>{item.content}</Text>
      <Card style={{ paddingVertical: spacing.xs, marginTop: spacing.xxl }}>
        <InfoRow label={t("notifications.level")} value={t(`notifications.priority.${item.priority}`)} />
        <InfoRow label={t("notifications.source")} value={t(`notifications.sources.${item.source}`)} />
        <InfoRow label={t("notifications.sender")} value={sender} divider={false} />
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
