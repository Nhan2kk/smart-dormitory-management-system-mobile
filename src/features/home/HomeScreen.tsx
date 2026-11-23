import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StudentStage } from "../../enums/student-stage.enum";
import { BarChart } from "../../shared/charts/BarChart";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import type { TranslationKey } from "../../shared/i18n/types";
import { Photos } from "../../shared/images";
import {
  makeStyles,
  radius,
  spacing,
  TAB_BAR_SPACE,
  useTheme,
  withAlpha,
} from "../../shared/theme";
import {
  Backdrop,
  Button,
  Card,
  CircleButton,
  Gradient,
  IconBadge,
  IconName,
  PhotoBackground,
  SectionHeader,
  StatusBadge,
  Touchable,
} from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { useDebts } from "../debts/useDebts";
import { useNotifications } from "../notifications/NotificationsProvider";
import {
  requestKindMeta,
  requestStats,
  requestStatusTone,
} from "../requests/requestModel";
import { useMyRequests } from "../requests/useMyRequests";
import { useResidency } from "../residency/useResidency";
import { UtilityUsage } from "../utilities/UtilityUsage";
import { useUtilities } from "../utilities/useUtilities";
import { useStudentStage } from "./useStudentStage";

/** Nút chính dưới thẻ "Chỗ ở của tôi": đổi theo giai đoạn đăng ký → nhận phòng → đang ở. */
const primaryActions: Record<StudentStage, { label: TranslationKey; icon: IconName; href: Href }> = {
  [StudentStage.Register]: { label: "home.ctaRegister", icon: "clipboard-outline", href: "/register-dorm" },
  [StudentStage.CheckIn]: { label: "home.ctaCheckIn", icon: "key-outline", href: "/check-in" },
  [StudentStage.Resident]: { label: "home.createRequest", icon: "add", href: "/request/new" },
};

/** Trang chủ kiểu "smart home": tiêu đề lớn, ảnh toà nhà hoà vào nền, thẻ "Chỗ ở của tôi" nổi lên trên ảnh. */
export function HomeScreen() {
  const { user } = useAuth();
  const { t, l } = useI18n();
  const { colors, glass, isDark } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const name = user?.fullName ?? "";
  // Lời chào theo buổi và ngày hiện tại trên máy; tên gọi là 2 chữ cuối của họ tên.
  const now = new Date();
  const callName = Formatter.callName(name);
  const residency = useResidency();
  const residence = residency.overview;
  const primaryAction = primaryActions[useStudentStage(residency.loading || residency.error ? null : !!residence)];
  const remainingDays = residence?.remainingDays() ?? null;
  const loadedUsage = useUtilities().usage;
  // Chưa nhận phòng: hiện "—", không vẽ số 0 giả.
  const usage = loadedUsage?.notCheckedIn ? null : loadedUsage;
  const today = usage?.series("day") ?? null;
  const week = usage?.series("week") ?? null;
  const debts = useDebts().ledger;
  const debt = debts?.totalUnpaid() ?? 0;
  const unread = useNotifications().unreadCount;
  const myRequests = useMyRequests().requests ?? [];
  const processing = requestStats(myRequests).processing;
  const requests = myRequests.slice(0, 3);
  const open = (href: Href) => () => router.push(href);

  return (
    <View style={styles.root}>
      <Backdrop ambient={false} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
      >
        {/* Thanh trên + tiêu đề */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.topBar}>
            <CircleButton
              icon="notifications-outline"
              label={t("home.notificationsLabel", { count: unread })}
              badge={unread}
              onPress={open("/notifications")}
            />
          </View>
          <Text style={[styles.dateLine, glass && { color: colors.inkSoft }]}>
            {Formatter.weekdayLong(now)}, {Formatter.date(now)}
          </Text>
          <Text style={styles.headline} accessibilityRole="header">
            {Formatter.greeting(now.getHours())}
            {callName ? `, ${callName}` : ""} 👋
          </Text>
        </View>

        {/* Ảnh toà nhà hoà vào nền ở trên và dưới */}
        {/* Chế độ kính: ảnh bo góc nổi trên nền mờ; mặc định: ảnh tràn viền hoà vào màu nền */}
        <PhotoBackground
          source={Photos.dormDusk()}
          anchor="center"
          style={[styles.photo, glass && styles.photoGlass]}
        >
          {!glass && (
            <Gradient
              colors={[colors.background, withAlpha(colors.background, 0)]}
              direction="vertical"
              eased
              style={styles.fadeTop}
            />
          )}
          {!glass && (
            <Gradient
              colors={[withAlpha(colors.background, 0), colors.background]}
              direction="vertical"
              eased
              style={styles.fadeBottom}
            />
          )}
        </PhotoBackground>

        {/* Thẻ nổi: mặc định chuyển dần xuống màu nền; chế độ kính tách dưới ảnh để không lộ mép cắt ngang qua các ô. */}
        <Gradient
          colors={
            glass
              ? [colors.glassStrong, colors.glass]
              : // Thẻ "Chỗ ở của tôi": trên trắng, dưới chuyển dần về màu nền dùng chung.
                [isDark ? colors.surface : "#FFFFFF", colors.background]
          }
          direction="vertical"
          eased
          style={[styles.sheet, glass && styles.sheetGlass]}
        >
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{t("home.myPlace")}</Text>
            <Touchable
              onPress={open("/residency-record")}
              accessibilityLabel={t("common.seeAll")}
              style={styles.viewAll}
            >
              <Text style={styles.viewAllText}>{t("common.seeAll")}</Text>
            </Touchable>
          </View>
          <View style={styles.tiles}>
            <Tile
              active
              icon="bed-outline"
              title={t("home.roomTile", {
                room: residence?.location.room ?? "—",
              })}
              subtitle={
                residence?.stayStartDate && residence.expiryDate ? `${t("residency.expectedEnd")}: ${Formatter.date(residence.expiryDate)}` : remainingDays != null
                  ? t("home.roomTileSub", { days: remainingDays })
                  : t("home.roomTileNone")
              }
              action="arrow-forward"
              onPress={open(residence ? "/residency-record" : "/register-dorm")}
            />
            <Tile
              icon="flash-outline"
              title={t("home.powerTile")}
              subtitle={
                today
                  ? `${Formatter.decimal(today.electricityTotal)} kWh`
                  : "— kWh"
              }
              action="power"
              onPress={() => router.navigate("/utilities")}
            />
            <Tile
              icon="wallet-outline"
              title={t("home.debtTile")}
              subtitle={Formatter.currency(debt)}
              subtitleColor={debts?.hasOverdue() ? colors.danger : undefined}
              onPress={open("/debts")}
            />
            <Tile
              icon="document-text-outline"
              title={t("home.requestTile")}
              subtitle={t("home.requestTileSub", { count: processing })}
              onPress={() => router.navigate("/requests")}
            />
          </View>
          <Button
            label={t(primaryAction.label)}
            icon={primaryAction.icon}
            onPress={open(primaryAction.href)}
            style={{ marginTop: spacing.lg }}
          />
        </Gradient>

        <View style={styles.body}>
          {/* Điện nước */}
          <SectionHeader
            title={t("home.todayUsage")}
            action={t("common.details")}
            onAction={() => router.navigate("/utilities")}
          />
          <Card
            onPress={() => router.navigate("/utilities")}
            accessibilityLabel={t("utilities.title")}
          >
            <View style={styles.usageRow}>
              <UsageStat
                icon="flash"
                color={colors.primary}
                label={t("utilities.electricity")}
                value={today ? Formatter.decimal(today.electricityTotal) : "—"}
                unit="kWh"
                change={today?.changePercent.electricity ?? null}
              />
              <View style={styles.usageDivider} />
              <UsageStat
                icon="water"
                color={colors.info}
                label={t("utilities.water")}
                value={today ? Formatter.decimal(today.waterTotal, 2) : "—"}
                unit="m³"
                change={today?.changePercent.water ?? null}
              />
            </View>
            {week && (
              <>
                <Text style={styles.caption}>{t("home.weekChart")}</Text>
                <View style={{ marginTop: spacing.sm }}>
                  <BarChart
                    values={week.electricity}
                    labels={week.labels.map((date) =>
                      Formatter.weekday(UtilityUsage.dateOf(date)),
                    )}
                    height={64}
                  />
                </View>
              </>
            )}
          </Card>

          {/* Yêu cầu gần đây */}
          <SectionHeader
            title={t("home.recentRequests")}
            action={t("common.seeAll")}
            onAction={() => router.navigate("/requests")}
          />
          <View style={{ gap: spacing.md }}>
            {requests.map((request) => {
              const kind = requestKindMeta[request.kind];
              return (
                <Card
                  key={request.id}
                  onPress={open({
                    pathname: "/request/[id]",
                    params: { id: request.id, kind: request.kind },
                  })}
                  accessibilityLabel={l(request.title)}
                  style={styles.request}
                >
                  <IconBadge icon={kind.icon} tone={kind.tone} size={46} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.requestTitle} numberOfLines={1}>
                      {l(request.title)}
                    </Text>
                    <View style={styles.requestMeta}>
                      <StatusBadge
                        label={t(`requests.status.${request.status}`)}
                        tone={requestStatusTone[request.status]}
                      />
                      <Text style={styles.caption}>
                        {Formatter.relative(request.submittedAt, new Date())}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.muted}
                  />
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
    <Touchable
      onPress={onPress}
      accessibilityLabel={`${title}, ${subtitle}`}
      style={[styles.tile, active && styles.tileActive]}
      pressScale={0.96}
    >
      <View style={styles.tileRow}>
        <Ionicons
          name={icon}
          size={24}
          color={active ? colors.primary : colors.ink}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.tileTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text
            style={[
              styles.tileSub,
              subtitleColor ? { color: subtitleColor } : null,
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      {action && (
        <View
          style={[
            styles.tileAction,
            active && { backgroundColor: colors.surface },
          ]}
        >
          <Ionicons name={action} size={16} color={colors.primary} />
        </View>
      )}
    </Touchable>
  );
}

function UsageStat({
  icon,
  color,
  label,
  value,
  unit,
  change,
}: {
  icon: IconName;
  color: string;
  label: string;
  value: string;
  unit: string;
  change: number | null;
}) {
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
        <Text style={[styles.usageChange, { color: colors.muted }]}>
          {t("utilities.noPrevious")}
        </Text>
      ) : (
        <Text
          style={[
            styles.usageChange,
            { color: up ? colors.danger : colors.success },
          ]}
        >
          {up ? "▲" : "▼"} {t("home.vsYesterday", { value: Math.abs(change) })}
        </Text>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ colors, font, shadow }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, zIndex: 2 },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  dateLine: {
    ...font.body,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: colors.muted,
  },
  headline: {
    fontSize: 28,
    lineHeight: 38,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  photo: { height: 320, marginTop: -55 },
  photoGlass: {
    height: 230,
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
  },
  fadeTop: { position: "absolute", top: 0, left: 0, right: 0, height: 150 },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 170,
  },
  sheet: {
    marginTop: -90,
    marginHorizontal: spacing.lg,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    padding: spacing.lg,
    paddingBottom: 0,
    borderTopWidth: 1,
    borderColor: withAlpha("#FFFFFF", 0.6),
  },
  sheetGlass: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.xl + 4,
    paddingBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  sheetHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sheetTitle: { ...font.heading, fontSize: 16 },
  viewAll: { paddingVertical: 6, paddingLeft: spacing.md },
  viewAllText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  tile: {
    width: "48%",
    minHeight: 92,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    justifyContent: "space-between",
  },
  tileActive: { backgroundColor: colors.primarySoft },
  tileRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  tileTitle: { ...font.label, fontSize: 14 },
  tileSub: {
    ...font.caption,
    fontSize: 13,
    marginTop: 2,
    color: colors.inkSoft,
  },
  tileAction: {
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  body: { paddingHorizontal: spacing.xl },
  caption: { ...font.caption },
  usageRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: spacing.lg,
  },
  usageDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  usageHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  usageLabel: {
    ...font.caption,
    fontSize: 13,
    color: colors.inkSoft,
    fontWeight: "600",
  },
  usageValue: { fontSize: 24, fontWeight: "800", color: colors.ink },
  usageUnit: { fontSize: 13, fontWeight: "600", color: colors.muted },
  usageChange: { fontSize: 12, fontWeight: "600" },
  request: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 14,
  },
  requestTitle: { ...font.label, fontSize: 15 },
  requestMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
}));
