import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import type { TranslationKey } from "../../shared/i18n/types";
import { makeStyles, radius, spacing, Tone, useTheme } from "../../shared/theme";
import { AppHeader, Button, Card, ChipGroup, CircleButton, EmptyState, IconBadge, IconName, Screen, LoadErrorCard } from "../../shared/ui";
import { RequestAction, RequestKind } from "../../enums/request.enum";
import type { StudentRequest } from "../../models/request.model";
import { requestKindMeta, requestStats, requestStatusTone } from "./requestModel";
import { useMyRequests } from "./useMyRequests";

type Filter = "all" | RequestKind;

const actionHint: Partial<Record<RequestAction, TranslationKey>> = {
  confirmRepair: "requests.needsConfirm",
  pay: "requests.needsPayment",
  checkIn: "requests.needsCheckIn",
};

/** Icon trên nhãn trạng thái theo tông: xong là dấu tích, bị từ chối là dấu X, còn lại là đồng hồ. */
const statusIcon: Partial<Record<Tone, IconName>> = {
  success: "checkmark-circle-outline",
  danger: "close-circle-outline",
  neutral: "remove-circle-outline",
};

/** Danh sách ngắn thì hiện thêm lời nhắn cuối danh sách để màn hình không trống trải. */
const SHORT_LIST = 3;

/** Tab Yêu cầu: thống kê theo trạng thái, lọc theo loại và danh sách yêu cầu của sinh viên. */
export function RequestsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>("all");
  const { requests, error, loading, reload } = useMyRequests();
  const all = useMemo(() => requests ?? [], [requests]);
  const stats = requestStats(all);
  const list = useMemo(() => (filter === "all" ? all : all.filter((request) => request.kind === filter)), [all, filter]);
  const count = (kind: RequestKind) => all.filter((request) => request.kind === kind).length;
  const create = () => router.push("/request/new");

  return (
    <Screen inTabs header={<AppHeader title={t("requests.title")} right={<CircleButton icon="add" label={t("requests.create")} onPress={create} />} />}>
      <StatsCard
        items={[
          { value: stats.total, label: t("requests.total"), icon: "document-text-outline", tone: "primary" },
          { value: stats.processing, label: t("requests.processing"), icon: "time-outline", tone: "warning" },
          { value: stats.done, label: t("requests.done"), icon: "checkmark-circle", tone: "success" },
          { value: stats.rejected, label: t("requests.rejected"), icon: "close-circle", tone: "danger" },
        ]}
      />

      <View style={{ marginVertical: spacing.lg }}>
        <ChipGroup<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("requests.all"), icon: "grid-outline", count: all.length },
            { value: "supportMaintenance", label: t("requests.kind.supportMaintenance"), icon: "construct-outline", count: count("supportMaintenance") },
            { value: "roomTransfer", label: t("requests.kind.roomTransfer"), icon: "swap-horizontal-outline", count: count("roomTransfer") },
            { value: "roomCheckout", label: t("requests.kind.roomCheckout"), icon: "exit-outline", count: count("roomCheckout") },
          ]}
        />
      </View>

      {error && (
        <View style={{ marginBottom: spacing.lg }}>
          <LoadErrorCard message={error} onRetry={reload} />
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : list.length === 0 ? (
        <EmptyState
          art="search"
          icon="document-text-outline"
          title={t("requests.emptyTitle")}
          description={t("requests.emptyBody")}
          action={<Button label={t("requests.create")} icon="add" size="md" onPress={create} />}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {list.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
          {list.length < SHORT_LIST && <EmptyState art="search" icon="clipboard-outline" title={t("requests.noMoreTitle")} description={t("requests.noMoreBody")} />}
        </View>
      )}
    </Screen>
  );
}

type StatItem = { value: number; label: string; icon: IconName; tone: Tone };

/** Thống kê: bốn thẻ nhỏ gọn, mỗi thẻ có icon tròn cạnh con số và nhãn bên dưới. */
function StatsCard({ items }: { items: StatItem[] }) {
  const styles = useStyles();
  const { tones } = useTheme();
  return (
    <View style={styles.stats}>
      {items.map((item) => (
        <Card key={item.label} style={styles.stat}>
          <View style={styles.statTop}>
            <IconBadge icon={item.icon} tone={item.tone} size={22} rounded="circle" />
            <Text style={[styles.statValue, { color: item.tone === "primary" ? undefined : tones[item.tone].fg }]}>{item.value}</Text>
          </View>
          <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>
            {item.label}
          </Text>
        </Card>
      ))}
    </View>
  );
}

/** Một yêu cầu: viền trái theo trạng thái, icon loại kèm chấm trạng thái, ngày gửi và lối vào chi tiết. */
function RequestCard({ request }: { request: StudentRequest }) {
  const { t, l } = useI18n();
  const { colors, tones } = useTheme();
  const styles = useStyles();
  const kind = requestKindMeta[request.kind];
  const tone = tones[requestStatusTone[request.status]];
  const hint = request.action ? actionHint[request.action] : undefined;
  return (
    <Card
      onPress={() => router.push({ pathname: "/request/[id]", params: { id: request.id, kind: request.kind } })}
      accessibilityLabel={`${l(request.title)}, ${t(`requests.status.${request.status}`)}`}
      style={[styles.card, { borderLeftColor: tone.fg }]}
    >
      <View style={styles.head}>
        <View>
          <IconBadge icon={kind.icon} tone={kind.tone} size={56} />
          <View style={[styles.dot, { backgroundColor: tone.fg, borderColor: colors.surface }]} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.kind} numberOfLines={1}>
            {t(`requests.kind.${request.kind}`)} · {request.id}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {l(request.title)}
          </Text>
          <View style={styles.meta}>
            <View style={styles.badges}>
              {request.requestType === "term_end" && (
                <View style={[styles.status, { backgroundColor: tones.violet.bg }]}>
                  <Text style={[styles.statusText, { color: tones.violet.fg }]}>{t("requests.termEnd")}</Text>
                </View>
              )}
              <View style={[styles.status, { backgroundColor: tone.bg }]}>
                <Ionicons name={statusIcon[requestStatusTone[request.status]] ?? "time-outline"} size={14} color={tone.fg} />
                <Text style={[styles.statusText, { color: tone.fg }]} numberOfLines={1}>
                  {t(`requests.status.${request.status}`)}
                </Text>
              </View>
            </View>
            <View style={styles.date}>
              <Ionicons name="calendar-outline" size={14} color={colors.muted} />
              <Text style={styles.dateText}>{Formatter.date(request.submittedAt)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Ionicons name={hint ? "hand-left-outline" : "information-circle"} size={18} color={colors.primary} />
        <Text style={[styles.footerText, hint && { color: colors.primary, fontWeight: "700" }]} numberOfLines={1}>
          {t(hint ?? "requests.viewDetail")}
        </Text>
        <View style={[styles.chevron, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>
      </View>
    </Card>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: { flex: 1, alignItems: "center", gap: 2, paddingVertical: spacing.sm + 2, paddingHorizontal: 4, borderRadius: radius.md },
  statTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
  statLabel: { ...font.caption, fontSize: 11 },
  // Viền trái theo trạng thái: dùng border của chính thẻ nên bo cong theo góc thẻ.
  card: { borderLeftWidth: 4 },
  head: { flexDirection: "row", gap: spacing.md },
  headText: { flex: 1, minWidth: 0 },
  dot: { position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  kind: { ...font.caption },
  title: { ...font.label, fontSize: 17, marginTop: 2 },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginTop: spacing.sm },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, flexShrink: 1 },
  status: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  statusText: { fontSize: 12, fontWeight: "700" },
  date: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { ...font.caption },
  footer: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1 },
  footerText: { ...font.body, fontSize: 14, flex: 1 },
  chevron: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
}));
