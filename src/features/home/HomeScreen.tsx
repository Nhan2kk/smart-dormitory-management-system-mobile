import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart } from "../../shared/charts/BarChart";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import type { TranslationKey } from "../../shared/i18n/types";
import { Photos } from "../../shared/images";
import { makeStyles, radius, spacing, TAB_BAR_SPACE, Tone, useTheme, withAlpha } from "../../shared/theme";
import { Backdrop, BottomSheet, Button, Card, CircleButton, Glass, Gradient, IconBadge, IconName, PhotoBackground, SectionHeader, StatusBadge, Touchable } from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { DebtRepository } from "../debts/debts.mock";
import { useNotifications } from "../notifications/NotificationsProvider";
import { ProfileRepository } from "../profile/profile.mock";
import { requestKindMeta, requestStats, requestStatusTone } from "../requests/requestModel";
import { useMyRequests } from "../requests/useMyRequests";
import { useResidency } from "../residency/useResidency";
import { UtilityUsage } from "../utilities/utilityModel";
import { useUtilities } from "../utilities/useUtilities";

const services: { key: TranslationKey; icon: IconName; href: Href; tone: Tone }[] = [
  { key: "home.service.register", icon: "clipboard-outline", href: "/register-dorm", tone: "violet" },
  { key: "home.service.checkIn", icon: "key-outline", href: "/check-in", tone: "success" },
  { key: "home.service.residency", icon: "id-card-outline", href: "/residency-record", tone: "info" },
  { key: "home.service.debts", icon: "wallet-outline", href: "/debts", tone: "warning" },
  { key: "home.service.utilities", icon: "flash-outline", href: "/utilities", tone: "primary" },
  { key: "home.service.support", icon: "construct-outline", href: "/request/create/supportMaintenance", tone: "danger" },
  { key: "home.service.assistant", icon: "sparkles-outline", href: "/assistant", tone: "violet" },
  { key: "home.service.notifications", icon: "notifications-outline", href: "/notifications", tone: "info" },
];

/** Trang chủ kiểu "smart home": tiêu đề lớn, ảnh toà nhà hoà vào nền, thẻ "Chỗ ở của tôi" nổi lên trên ảnh. */
export function HomeScreen() {
  const { user } = useAuth();
  const { t, l } = useI18n();
  const { colors, glass } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const name = user?.fullName || ProfileRepository.get().fullName;
  const residence = useResidency().overview;
  const remainingDays = residence?.remainingDays() ?? null;
  const usage = useUtilities().usage;
  const today = usage?.series("day") ?? null;
  const week = usage?.series("week") ?? null;
  const debt = DebtRepository.totalUnpaid();
  const unread = useNotifications().unreadCount;
  const myRequests = useMyRequests().requests ?? [];
  const processing = requestStats(myRequests).processing;
  const requests = myRequests.slice(0, 3);
  const open = (href: Href) => () => router.push(href);

  return (
    <View style={styles.root}>
      <Backdrop ambient={false} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
        {/* Thanh trên + tiêu đề */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.topBar}>
            <CircleButton icon="menu-outline" label={t("home.menu")} onPress={() => setMenuOpen(true)} />
            <CircleButton icon="notifications-outline" label={t("home.notificationsLabel", { count: unread })} badge={unread} onPress={open("/notifications")} />
          </View>
          <Text style={styles.headline} accessibilityRole="header">
            {t("home.heroLine1")}
            {"\n"}
            <Text style={{ color: colors.primary }}>{t("home.heroLine2")}</Text>
          </Text>
          <Text style={styles.subline}>
            {Formatter.greeting()}, {name.split(" ").slice(-1)[0]} 👋{"\n"}
            {t("home.heroBody")}
          </Text>
        </View>

        {/* Ảnh toà nhà hoà vào nền ở trên và dưới */}
        {/* Chế độ kính: ảnh bo góc nổi trên nền mờ; mặc định: ảnh tràn viền hoà vào màu nền */}
        <PhotoBackground source={Photos.dormDusk()} anchor="center" style={[styles.photo, glass && styles.photoGlass]}>
          {!glass && <Gradient colors={[colors.background, withAlpha(colors.background, 0)]} direction="vertical" style={styles.fadeTop} />}
          {!glass && <Gradient colors={[withAlpha(colors.background, 0), colors.background]} direction="vertical" style={styles.fadeBottom} />}
        </PhotoBackground>

        {/* Thẻ nổi: trắng ở trên, chuyển dần xuống màu nền ở dưới */}
        <Gradient colors={glass ? [colors.glassStrong, withAlpha(colors.background, 0)] : [colors.surface, colors.background]} direction="vertical" style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{t("home.myPlace")}</Text>
            <Touchable onPress={open("/residency-record")} accessibilityLabel={t("common.seeAll")} style={styles.viewAll}>
              <Text style={styles.viewAllText}>{t("common.seeAll")}</Text>
            </Touchable>
          </View>
          <View style={styles.tiles}>
            <Tile
              active
              icon="bed-outline"
              title={t("home.roomTile", { room: residence?.location.room ?? "—" })}
              subtitle={remainingDays != null ? t("home.roomTileSub", { days: remainingDays }) : t("home.roomTileNone")}
              action="arrow-forward"
              onPress={open("/residency-record")}
            />
            <Tile icon="flash-outline" title={t("home.powerTile")} subtitle={today ? `${Formatter.decimal(today.electricityTotal)} kWh` : "— kWh"} action="power" onPress={() => router.navigate("/utilities")} />
            <Tile icon="wallet-outline" title={t("home.debtTile")} subtitle={Formatter.currency(debt)} subtitleColor={DebtRepository.hasOverdue() ? colors.danger : undefined} onPress={open("/debts")} />
            <Tile icon="document-text-outline" title={t("home.requestTile")} subtitle={t("home.requestTileSub", { count: processing })} onPress={() => router.navigate("/requests")} />
          </View>
          <Button label={t("home.createRequest")} icon="add" onPress={open("/request/new")} style={{ marginTop: spacing.lg }} />
        </Gradient>

        <View style={styles.body}>
          {/* Tiện ích nhanh */}
          <SectionHeader title={t("home.quickServices")} action={t("common.seeAll")} onAction={() => setMenuOpen(true)} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroller} contentContainerStyle={styles.quickRow}>
            {services.map((service) => (
              <Touchable key={service.key} onPress={open(service.href)} accessibilityLabel={t(service.key)} style={styles.quick} pressScale={0.92}>
                <Glass strong style={styles.quickIcon}>
                  <Ionicons name={service.icon} size={22} color={colors.ink} />
                </Glass>
                <Text style={styles.quickLabel} numberOfLines={2}>
                  {t(service.key)}
                </Text>
              </Touchable>
            ))}
          </ScrollView>

          {/* Điện nước */}
          <SectionHeader title={t("home.todayUsage")} action={t("common.details")} onAction={() => router.navigate("/utilities")} />
          <Card onPress={() => router.navigate("/utilities")} accessibilityLabel={t("utilities.title")}>
            <View style={styles.usageRow}>
              <UsageStat icon="flash" color={colors.primary} label={t("utilities.electricity")} value={today ? Formatter.decimal(today.electricityTotal) : "—"} unit="kWh" change={today?.changePercent.electricity ?? null} />
              <View style={styles.usageDivider} />
              <UsageStat icon="water" color={colors.info} label={t("utilities.water")} value={today ? Formatter.decimal(today.waterTotal, 2) : "—"} unit="m³" change={today?.changePercent.water ?? null} />
            </View>
            {week && (
              <>
                <Text style={styles.caption}>{t("home.weekChart")}</Text>
                <View style={{ marginTop: spacing.sm }}>
                  <BarChart values={week.electricity} labels={week.labels.map((date) => Formatter.weekday(UtilityUsage.dateOf(date)))} height={64} />
                </View>
              </>
            )}
          </Card>

          {/* Yêu cầu gần đây */}
          <SectionHeader title={t("home.recentRequests")} action={t("common.seeAll")} onAction={() => router.navigate("/requests")} />
          <View style={{ gap: spacing.md }}>
            {requests.map((request) => {
              const kind = requestKindMeta[request.kind];
              return (
                <Card key={request.id} onPress={open({ pathname: "/request/[id]", params: { id: request.id, kind: request.kind } })} accessibilityLabel={l(request.title)} style={styles.request}>
                  <IconBadge icon={kind.icon} tone={kind.tone} size={46} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.requestTitle} numberOfLines={1}>
                      {l(request.title)}
                    </Text>
                    <View style={styles.requestMeta}>
                      <StatusBadge label={t(`requests.status.${request.status}`)} tone={requestStatusTone[request.status]} />
                      <Text style={styles.caption}>{Formatter.relative(request.submittedAt, new Date())}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Card>
              );
            })}
          </View>

          {/* Trợ lý AI */}
          <Touchable onPress={open("/assistant")} accessibilityLabel={t("home.askAi")} pressScale={0.98} style={{ marginTop: spacing.xxl }}>
            <PhotoBackground source={Photos.studyDesk()} style={styles.ai}>
              <Glass variant="photo" strong style={styles.aiGlass}>
                <View style={styles.aiIcon}>
                  <Ionicons name="sparkles" size={22} color={colors.primaryLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiTitle}>{t("home.askAi")}</Text>
                  <Text style={styles.aiBody}>{t("home.askAiBody")}</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={34} color={colors.primaryLight} />
              </Glass>
            </PhotoBackground>
          </Touchable>
        </View>
      </ScrollView>

      {/* Menu tất cả dịch vụ */}
      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)} title={t("home.menuTitle")}>
        <View style={styles.menuGrid}>
          {services.map((service) => (
            <Touchable
              key={service.key}
              onPress={() => {
                setMenuOpen(false);
                router.push(service.href);
              }}
              accessibilityLabel={t(service.key)}
              style={styles.menuItem}
              pressScale={0.92}
            >
              <IconBadge icon={service.icon} tone={service.tone} size={52} />
              <Text style={styles.quickLabel} numberOfLines={2}>
                {t(service.key)}
              </Text>
            </Touchable>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

/** Ô trong thẻ "Chỗ ở của tôi" — giống ô thiết bị của mẫu smart home. */
function Tile({
  icon,
  title,
  subtitle,
  subtitleColor,
  active,
  action,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  subtitleColor?: string;
  active?: boolean;
  action?: IconName;
  onPress: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Touchable onPress={onPress} accessibilityLabel={`${title}, ${subtitle}`} style={[styles.tile, active && styles.tileActive]} pressScale={0.96}>
      <View style={styles.tileRow}>
        <Ionicons name={icon} size={24} color={active ? colors.primary : colors.ink} />
        <View style={{ flex: 1 }}>
          <Text style={styles.tileTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.tileSub, subtitleColor ? { color: subtitleColor } : null]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
      {action && (
        <View style={[styles.tileAction, active && { backgroundColor: colors.surface }]}>
          <Ionicons name={action} size={16} color={colors.primary} />
        </View>
      )}
    </Touchable>
  );
}

function UsageStat({ icon, color, label, value, unit, change }: { icon: IconName; color: string; label: string; value: string; unit: string; change: number | null }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const up = (change ?? 0) >= 0;
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <View style={styles.usageHead}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={styles.usageLabel}>{label}</Text>
      </View>
      <Text style={styles.usageValue}>
        {value} <Text style={styles.usageUnit}>{unit}</Text>
      </Text>
      {change == null ? (
        <Text style={[styles.usageChange, { color: colors.muted }]}>{t("utilities.noPrevious")}</Text>
      ) : (
        <Text style={[styles.usageChange, { color: up ? colors.danger : colors.success }]}>
          {up ? "▲" : "▼"} {t("home.vsYesterday", { value: Math.abs(change) })}
        </Text>
      )}
    </View>
  );
}

const white = "#FFFFFF";

const useStyles = makeStyles(({ colors, font, shadow }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, zIndex: 2 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
  headline: { fontSize: 36, lineHeight: 42, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
  subline: { ...font.body, fontSize: 15, lineHeight: 22, marginTop: spacing.md, maxWidth: 300 },
  photo: { height: 300, marginTop: -24 },
  photoGlass: { marginTop: spacing.xl, marginHorizontal: spacing.lg, borderRadius: radius.xl },
  fadeTop: { position: "absolute", top: 0, left: 0, right: 0, height: 130 },
  fadeBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 120 },
  sheet: {
    marginTop: -90,
    marginHorizontal: spacing.lg,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderColor: withAlpha("#FFFFFF", 0.6),
  },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  sheetTitle: { ...font.heading, fontSize: 16 },
  viewAll: { paddingVertical: 6, paddingLeft: spacing.md },
  viewAllText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  tiles: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  tile: { width: "48%", minHeight: 92, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.surfaceMuted, justifyContent: "space-between" },
  tileActive: { backgroundColor: colors.primarySoft },
  tileRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  tileTitle: { ...font.label, fontSize: 14 },
  tileSub: { ...font.caption, fontSize: 13, marginTop: 2, color: colors.inkSoft },
  tileAction: { alignSelf: "flex-end", width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", marginTop: spacing.sm },
  body: { paddingHorizontal: spacing.xl },
  caption: { ...font.caption },
  quickScroller: { marginHorizontal: -spacing.xl, flexGrow: 0 },
  quickRow: { gap: spacing.md, paddingHorizontal: spacing.xl },
  quick: { width: 72, alignItems: "center", gap: 8 },
  quickIcon: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 12, fontWeight: "600", color: colors.inkSoft, textAlign: "center", lineHeight: 15 },
  usageRow: { flexDirection: "row", alignItems: "stretch", marginBottom: spacing.lg },
  usageDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  usageHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  usageLabel: { ...font.caption, fontSize: 13, color: colors.inkSoft, fontWeight: "600" },
  usageValue: { fontSize: 24, fontWeight: "800", color: colors.ink },
  usageUnit: { fontSize: 13, fontWeight: "600", color: colors.muted },
  usageChange: { fontSize: 12, fontWeight: "600" },
  request: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 14 },
  requestTitle: { ...font.label, fontSize: 15 },
  requestMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  ai: { borderRadius: radius.lg, padding: spacing.sm },
  aiGlass: { borderRadius: radius.md + 2, padding: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.md },
  aiIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  aiTitle: { color: white, fontSize: 16, fontWeight: "800" },
  aiBody: { color: "rgba(255,255,255,0.82)", fontSize: 13, marginTop: 2 },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg, paddingBottom: spacing.md },
  menuItem: { width: "25%", alignItems: "center", gap: 8 },
}));

