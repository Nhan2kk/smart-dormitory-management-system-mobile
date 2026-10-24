import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import type { TranslationKey } from "../../shared/i18n/types";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { AppHeader, Button, Callout, Card, ChipGroup, CircleButton, EmptyState, Glass, IconBadge, Screen, StatusBadge } from "../../shared/ui";
import { RequestAction, RequestKind } from "../../enums/request.enum";
import { requestKindMeta, requestStats, requestStatusTone } from "./requestModel";
import { useMyRequests } from "./useMyRequests";

type Filter = "all" | RequestKind;

const actionHint: Partial<Record<RequestAction, TranslationKey>> = {
  confirmRepair: "requests.needsConfirm",
  pay: "requests.needsPayment",
  checkIn: "requests.needsCheckIn",
};

export function RequestsScreen() {
  const { t, l } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const [filter, setFilter] = useState<Filter>("all");
  const { requests, error, loading, reload } = useMyRequests();
  const all = useMemo(() => requests ?? [], [requests]);
  const stats = requestStats(all);
  const list = useMemo(() => (filter === "all" ? all : all.filter((request) => request.kind === filter)), [all, filter]);
  const count = (kind: RequestKind) => all.filter((request) => request.kind === kind).length;

  return (
    <Screen inTabs header={<AppHeader title={t("requests.title")} right={<CircleButton icon="add" label={t("requests.create")} onPress={() => router.push("/request/new")} />} />}>
      <Glass strong style={styles.stats}>
        <Stat value={stats.total} label={t("requests.total")} color={colors.ink} />
        <Stat value={stats.processing} label={t("requests.processing")} color={colors.warning} />
        <Stat value={stats.done} label={t("requests.done")} color={colors.success} />
        <Stat value={stats.rejected} label={t("requests.rejected")} color={colors.danger} />
      </Glass>

      <View style={{ marginVertical: spacing.lg }}>
        <ChipGroup<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("requests.all"), count: all.length },
            { value: "supportMaintenance", label: t("requests.kind.supportMaintenance"), icon: "construct-outline", count: count("supportMaintenance") },
            { value: "roomTransfer", label: t("requests.kind.roomTransfer"), icon: "swap-horizontal-outline", count: count("roomTransfer") },
            { value: "roomCheckout", label: t("requests.kind.roomCheckout"), icon: "exit-outline", count: count("roomCheckout") },
          ]}
        />
      </View>

      {error && (
        <View style={{ marginBottom: spacing.lg }}>
          <Callout tone="danger" icon="cloud-offline-outline" action={<Button label={t("common.retry")} size="md" variant="secondary" onPress={reload} />}>
            {error}
          </Callout>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : list.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title={t("requests.emptyTitle")}
          description={t("requests.emptyBody")}
          action={<Button label={t("requests.create")} icon="add" size="md" onPress={() => router.push("/request/new")} />}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {list.map((request) => {
            const kind = requestKindMeta[request.kind];
            const hint = request.action ? actionHint[request.action] : undefined;
            return (
              <Card
                key={request.id}
                onPress={() => router.push({ pathname: "/request/[id]", params: { id: request.id, kind: request.kind } })}
                accessibilityLabel={`${l(request.title)}, ${t(`requests.status.${request.status}`)}`}
              >
                <View style={styles.head}>
                  <IconBadge icon={kind.icon} tone={kind.tone} size={42} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kind}>
                      {t(`requests.kind.${request.kind}`)} · {request.id}
                    </Text>
                    <Text style={styles.title} numberOfLines={2}>
                      {l(request.title)}
                    </Text>
                  </View>
                </View>
                {request.summary && (
                  <Text style={styles.summary} numberOfLines={2}>
                    {l(request.summary)}
                  </Text>
                )}
                <View style={styles.foot}>
                  {request.requestType === "term_end" && <StatusBadge label={t("requests.termEnd")} tone="violet" />}
                  <StatusBadge label={t(`requests.status.${request.status}`)} tone={requestStatusTone[request.status]} />
                  <View style={styles.time}>
                    <Ionicons name="time-outline" size={14} color={colors.muted} />
                    <Text style={styles.timeText}>{Formatter.date(request.submittedAt)}</Text>
                  </View>
                </View>
                {hint && (
                  <View style={styles.action}>
                    <Ionicons name="hand-left-outline" size={16} color={colors.primary} />
                    <Text style={styles.actionText}>{t(hint)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  stats: { flexDirection: "row", borderRadius: radius.lg, paddingVertical: spacing.lg },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { ...font.caption },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  kind: { ...font.caption },
  title: { ...font.label, fontSize: 16, marginTop: 2 },
  summary: { ...font.body, fontSize: 14, marginTop: spacing.md },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  time: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { ...font.caption },
  action: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.md, backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  actionText: { flex: 1, color: colors.primary, fontWeight: "700", fontSize: 13 },
}));
