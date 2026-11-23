import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { errorMessage } from "../../shared/api";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { AppHeader, Button, Callout, Card, ChipGroup, CircleButton, EmptyState, GroupLabel, IconBadge, Screen, useToast } from "../../shared/ui";
import { AppNotification } from "../../models/notification.model";
import { notificationKindMeta } from "./notificationMeta";
import { useNotifications } from "./NotificationsProvider";
import { PushPromptCard } from "./PushPromptCard";
import { usePushNotifications } from "./usePushNotifications";

type Filter = "all" | "unread" | "important" | "announcement";

const isRecent = (item: AppNotification) => Date.now() - new Date(item.sentAt).getTime() < 3 * 86_400_000;

export function NotificationsScreen() {
  const { notify } = useToast();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { items, unreadCount, error, reload, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const push = usePushNotifications();
  const [pushDismissed, setPushDismissed] = useState(false);
  const all = items ?? [];
  const filtered = all.filter((item) =>
    filter === "unread" ? !item.read : filter === "important" ? item.priority !== "NORMAL" : filter === "announcement" ? item.source === "ANNOUNCEMENT" : true,
  );
  const recent = filtered.filter(isRecent);
  const earlier = filtered.filter((item) => !isRecent(item));

  return (
    <Screen
      header={
        <AppHeader
          title={t("notifications.title")}
          subtitle={unreadCount ? t("notifications.unread", { count: unreadCount }) : t("notifications.allRead")}
          right={
            <CircleButton
              icon="checkmark-done"
              label={t("notifications.markAll")}
              onPress={() =>
                markAllRead()
                  .then(() => notify(t("notifications.markedAll")))
                  .catch((reason: unknown) => notify(errorMessage(reason), "danger"))
              }
            />
          }
        />
      }
    >
      {/* Bản web chưa bật thông báo đẩy: mời bật ngay tại đây để không phải vào tab Cá nhân. */}
      {Platform.OS === "web" && !push.enabled && !pushDismissed && (
        <View style={{ marginBottom: spacing.lg }}>
          <PushPromptCard onEnable={() => push.setEnabled(true)} onDismiss={() => setPushDismissed(true)} />
        </View>
      )}
      <ChipGroup<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: t("notifications.all") },
          { value: "unread", label: t("notifications.unreadFilter"), count: unreadCount },
          { value: "important", label: t("notifications.important") },
          { value: "announcement", label: t("notifications.fromManagement") },
        ]}
      />
      {error && (
        <View style={{ marginTop: spacing.lg }}>
          <Callout tone="danger" icon="cloud-offline-outline" action={<Button label={t("common.retry")} size="md" variant="secondary" onPress={reload} />}>
            {error}
          </Callout>
        </View>
      )}
      {items === null && !error ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : filtered.length === 0 ? (
        <EmptyState art="search" icon="notifications-off-outline" title={t("notifications.emptyTitle")} description={t("notifications.emptyBody")} />
      ) : (
        <>
          {recent.length > 0 && <Group title={t("notifications.recent")} items={recent} onOpen={markRead} />}
          {earlier.length > 0 && <Group title={t("notifications.earlier")} items={earlier} onOpen={markRead} />}
        </>
      )}
    </Screen>
  );
}

function Group({ title, items, onOpen }: { title: string; items: AppNotification[]; onOpen: (id: string) => void }) {
  const styles = useStyles();
  const { t } = useI18n();
  return (
    <View>
      <GroupLabel>{title}</GroupLabel>
      <View style={{ gap: spacing.sm }}>
        {items.map((item) => {
          const kind = notificationKindMeta[item.kind];
          return (
            <Card
              key={item.id}
              onPress={() => {
                onOpen(item.id);
                router.push({ pathname: "/notifications/[id]", params: { id: item.id } });
              }}
              accessibilityLabel={`${item.read ? "" : t("notifications.unreadPrefix")}${item.title}`}
              variant={item.read ? "default" : "warm"}
              style={styles.item}
            >
              <IconBadge icon={kind.icon} tone={kind.tone} size={44} rounded="circle" />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !item.read && { fontWeight: "800" }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {!item.read && <View style={styles.dot} />}
                </View>
                <Text style={styles.body} numberOfLines={2}>
                  {item.content}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.time}>{Formatter.relative(item.sentAt, new Date())}</Text>
                  {item.priority !== "NORMAL" && (
                    <Text style={[styles.priority, item.priority === "URGENT" && styles.urgent]}>{t(`notifications.priority.${item.priority}`)}</Text>
                  )}
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  item: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  titleRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  title: { ...font.label, fontSize: 15, flex: 1, lineHeight: 20 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginTop: 5 },
  body: { ...font.body, fontSize: 13, lineHeight: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 2 },
  time: { ...font.caption },
  priority: { fontSize: 11, fontWeight: "700", color: colors.warning, backgroundColor: colors.warningSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, overflow: "hidden" },
  urgent: { color: colors.danger, backgroundColor: colors.dangerSoft },
}));
