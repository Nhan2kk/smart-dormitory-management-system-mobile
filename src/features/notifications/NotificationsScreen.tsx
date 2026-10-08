import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing } from "../../shared/theme";
import { AppHeader, Card, ChipGroup, CircleButton, EmptyState, GroupLabel, IconBadge, Screen, useToast } from "../../shared/ui";
import { AppNotification, notificationKindMeta, NotificationRepository } from "./notifications.mock";

type Filter = "all" | "unread" | "important" | "announcement";

const isRecent = (item: AppNotification) => Formatter.now.getTime() - new Date(item.sentAt).getTime() < 3 * 86_400_000;

export function NotificationsScreen() {
  const { notify } = useToast();
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const [readIds, setReadIds] = useState<string[]>([]);
  const items = NotificationRepository.all().map((item) => ({ ...item, read: item.read || readIds.includes(item.id) }));
  const unread = items.filter((item) => !item.read).length;
  const filtered = items.filter((item) =>
    filter === "unread" ? !item.read : filter === "important" ? item.priority !== "NORMAL" : filter === "announcement" ? item.source === "ANNOUNCEMENT" : true,
  );
  const recent = filtered.filter(isRecent);
  const earlier = filtered.filter((item) => !isRecent(item));
  const open = (id: string) => setReadIds((ids) => [...ids, id]);

  return (
    <Screen
      header={
        <AppHeader
          title={t("notifications.title")}
          subtitle={unread ? t("notifications.unread", { count: unread }) : t("notifications.allRead")}
          right={
            <CircleButton
              icon="checkmark-done"
              label={t("notifications.markAll")}
              onPress={() => {
                setReadIds(items.map((item) => item.id));
                notify(t("notifications.markedAll"));
              }}
            />
          }
        />
      }
    >
      <ChipGroup<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: t("notifications.all") },
          { value: "unread", label: t("notifications.unreadFilter"), count: unread },
          { value: "important", label: t("notifications.important") },
          { value: "announcement", label: t("notifications.fromManagement") },
        ]}
      />
      {filtered.length === 0 ? (
        <EmptyState icon="notifications-off-outline" title={t("notifications.emptyTitle")} description={t("notifications.emptyBody")} />
      ) : (
        <>
          {recent.length > 0 && <Group title={t("notifications.recent")} items={recent} onOpen={open} />}
          {earlier.length > 0 && <Group title={t("notifications.earlier")} items={earlier} onOpen={open} />}
        </>
      )}
    </Screen>
  );
}

function Group({ title, items, onOpen }: { title: string; items: AppNotification[]; onOpen: (id: string) => void }) {
  const styles = useStyles();
  const { t, l } = useI18n();
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
                router.push(`/notifications/${item.id}`);
              }}
              accessibilityLabel={`${item.read ? "" : t("notifications.unreadPrefix")}${l(item.title)}`}
              variant={item.read ? "default" : "warm"}
              style={styles.item}
            >
              <IconBadge icon={kind.icon} tone={kind.tone} size={44} rounded="circle" />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !item.read && { fontWeight: "800" }]} numberOfLines={2}>
                    {l(item.title)}
                  </Text>
                  {!item.read && <View style={styles.dot} />}
                </View>
                <Text style={styles.body} numberOfLines={2}>
                  {l(item.body)}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.time}>{Formatter.relative(item.sentAt)}</Text>
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
