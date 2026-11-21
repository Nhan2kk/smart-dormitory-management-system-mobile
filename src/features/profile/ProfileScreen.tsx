import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { ReactNode, useMemo, useState } from "react";
import { AvatarService } from "../../services/avatar.service";
import { WebPushService } from "../../services/web-push.service";
import { WebPushEnableResult } from "../../enums/web-push.enum";
import { errorMessage } from "../../shared/api";
import { Platform, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { Photos } from "../../shared/images";
import { usePreferences } from "../../shared/preferences";
import { makeStyles, radius, spacing, TAB_BAR_SPACE, useTheme } from "../../shared/theme";
import { Avatar, Backdrop, BottomSheet, Card, CircleButton, IconName, ListRow, PhotoBackground, Touchable, useToast } from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { useDebts } from "../debts/useDebts";
import { requestStats } from "../requests/requestModel";
import { useMyRequests } from "../requests/useMyRequests";
import { useResidency } from "../residency/useResidency";
import { AvatarPicker } from "./AvatarPicker";
import { useProfile } from "./useProfile";

/** Tab Cá nhân: hồ sơ, tài khoản, lưu trú, tuỳ chọn và hỗ trợ (bố cục kiểu trang Settings). */
export function ProfileScreen() {
  const { user, request, updateUser } = useAuth();
  const avatarService = useMemo(() => new AvatarService(request), [request]);
  const webPush = useMemo(() => new WebPushService(request), [request]);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarUrl = user?.avatarUrl ?? null;
  const { notify } = useToast();
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  const prefs = usePreferences();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const remainingDays = useResidency().overview?.remainingDays() ?? null;
  const unpaidDebt = useDebts().ledger?.totalUnpaid() ?? 0;
  const { profile } = useProfile();
  const name = profile?.fullName || user?.fullName || "";
  const [avatarSheet, setAvatarSheet] = useState(false);
  const processingRequests = requestStats(useMyRequests().requests ?? []).processing;
  const go =(href: Href) => () => router.push(href);

  const pickAvatar = async (source: "camera" | "library") => {
    setAvatarSheet(false);
    const result = await AvatarPicker.pick(source);
    if (!result) return;
    if ("error" in result) {
      notify(result.error === "permission" ? t("profile.permissionDenied", { target: t(source === "camera" ? "profile.camera" : "profile.library") }) : t("profile.avatarTooLarge"), "warning");
      return;
    }
    // Upload lên server để ảnh theo tài khoản (web + mọi thiết bị), không chỉ lưu trên máy này.
    setAvatarBusy(true);
    try {
      const saved = await avatarService.change(result.uri);
      await updateUser({ avatarUrl: saved.avatarUrl });
      notify(t("profile.avatarUpdated"));
    } catch (error) {
      notify(errorMessage(error), "danger");
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarSheet(false);
    setAvatarBusy(true);
    try {
      const saved = await avatarService.remove();
      await updateUser({ avatarUrl: saved.avatarUrl });
      notify(t("profile.avatarRemoved"));
    } catch (error) {
      notify(errorMessage(error), "danger");
    } finally {
      setAvatarBusy(false);
    }
  };

  const switchControl = (value: boolean, onChange: (value: boolean) => void, label: string) => (
    <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#FFFFFF" accessibilityLabel={label} />
  );

  return (
    <View style={styles.root}>
      <Backdrop />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: TAB_BAR_SPACE, paddingHorizontal: spacing.xl }}>
        <View style={styles.topBar}>
          <CircleButton icon="chevron-back" label={t("common.back")} onPress={() => (router.canGoBack() ? router.back() : router.navigate("/"))} />
        </View>
        {/* Tiêu đề + ảnh vòm */}
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.eyebrow}>{t("profile.eyebrow")}</Text>
            <Text style={styles.heroTitle} accessibilityRole="header">
              {t("profile.heroTitle")}
            </Text>
            <Text style={styles.heroBody}>{t("profile.heroBody")}</Text>
          </View>
          <View>
            <PhotoBackground source={Photos.warmLobby(500)} style={styles.arch} />
            <Touchable onPress={() => router.navigate("/")} accessibilityLabel={t("tabs.home")} style={[styles.homeBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="home" size={18} color={colors.onPrimary} />
            </Touchable>
          </View>
        </View>

        {/* Thẻ hồ sơ */}
        <Card style={styles.profileCard}>
          <Touchable onPress={() => !avatarBusy && setAvatarSheet(true)} accessibilityLabel={t("profile.changeAvatar")} accessibilityState={{ busy: avatarBusy }}>
            <Avatar initials={Formatter.initials(name)} uri={avatarUrl} size={58} ring={false} />
            <View style={[styles.camera, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={11} color={colors.onPrimary} />
            </View>
          </Touchable>
          <Touchable onPress={go("/profile-edit")} accessibilityLabel={t("profile.personalTitle")} style={styles.profileInfo} pressScale={0.98}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.role}>{profile?.className ? t("profile.studentRole", { className: profile.className }) : t("profile.student")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Touchable>
        </Card>
        <View style={styles.stats}>
          <Stat value={remainingDays != null ? `${remainingDays}` : "—"} label={t("profile.stayDays")} />
          <Stat value={Formatter.compactCurrency(unpaidDebt)} label={t("profile.debt")} />
          <Stat value={`${processingRequests}`} label={t("profile.processing")} />
        </View>

        <Section title={t("profile.sectionAccount")}>
          <Row icon="person-outline" title={t("profile.personalTitle")} subtitle={t("profile.infoSub")} onPress={go("/profile-edit")} divider />
          <Row icon="shield-checkmark-outline" title={t("profile.security")} subtitle={t("profile.securitySub")} onPress={go({ pathname: "/profile-edit", params: { tab: "account" } })} divider />
          <Row icon="notifications-outline" title={t("profile.notifications")} subtitle={t("profile.notificationsSub")} onPress={go("/notifications")} divider />
          <Row
            icon={isDark ? "moon-outline" : "sunny-outline"}
            title={t("profile.darkMode")}
            subtitle={t("profile.darkModeSub")}
            right={switchControl(isDark, (value) => prefs.update({ mode: value ? "dark" : "light" }), t("profile.darkMode"))}
          />
        </Section>

        <Section title={t("profile.sectionStay")}>
          <Row icon="id-card-outline" title={t("residency.title")} subtitle={t("profile.residencySub")} onPress={go("/residency-record")} divider />
          <Row icon="key-outline" title={t("checkIn.title")} subtitle={t("profile.checkInSub")} onPress={go("/check-in")} divider />
          <Row icon="clipboard-outline" title={t("registration.title")} subtitle={t("profile.registerSub")} onPress={go("/register-dorm")} divider />
          <Row icon="wallet-outline" title={t("profile.debtsTitle")} subtitle={t("profile.debtsSub")} onPress={go("/debts")} />
        </Section>

        <Section title={t("profile.sectionPreferences")}>
          <Row icon="globe-outline" title={t("profile.language")} subtitle={prefs.language === "vi" ? t("settings.vietnamese") : t("settings.english")} onPress={go("/settings")} divider />
          <Row
            icon="color-palette-outline"
            title={t("profile.themeRow")}
            subtitle={`${t(`settings.presets.${prefs.preset}`)}${prefs.glass ? ` · ${t("settings.glass")}` : ""}`}
            onPress={go("/settings")}
            divider
          />
          <Row
            icon="phone-portrait-outline"
            title={t("profile.push")}
            subtitle={t("profile.pushSub")}
            right={switchControl(
              // Bản web: chỉ coi là bật khi trình duyệt đã cấp quyền thông báo.
              Platform.OS === "web" ? prefs.push && WebPushService.granted : prefs.push,
              (value) => {
                if (Platform.OS !== "web") {
                  prefs.update({ push: value });
                  notify(value ? t("profile.pushOn") : t("profile.pushOff"), "info");
                  return;
                }
                if (!value) {
                  prefs.update({ push: false });
                  void webPush.disable();
                  notify(t("profile.pushOff"), "info");
                  return;
                }
                // Gọi ngay trong sự kiện bấm: iOS chỉ cho xin quyền thông báo khi người dùng thao tác.
                webPush
                  .enable()
                  .then((result) => {
                    if (result === WebPushEnableResult.Enabled) {
                      prefs.update({ push: true });
                      notify(t("profile.pushOn"), "success");
                    } else if (result === WebPushEnableResult.Denied) notify(t("profile.pushDenied"), "danger");
                    else if (result === WebPushEnableResult.ServerDisabled) notify(t("profile.pushServerOff"), "danger");
                    else notify(t("profile.pushUnsupported"), "info");
                  })
                  .catch((error) => notify(errorMessage(error), "danger"));
              },
              t("profile.push"),
            )}
          />
        </Section>

        <Section title={t("profile.sectionSupport")}>
          <Row icon="help-circle-outline" title={t("profile.helpCenter")} subtitle={t("profile.helpCenterSub")} onPress={go("/assistant")} />
        </Section>

        <Text style={styles.version}>SDMS · {t("profile.version")} 1.0.0</Text>
      </ScrollView>

      <BottomSheet visible={avatarSheet} onClose={() => setAvatarSheet(false)} title={t("profile.changeAvatar")} subtitle={t("profile.avatarHint")}>
        <Card style={{ paddingVertical: spacing.xs }}>
          <ListRow icon="camera-outline" tone="primary" title={t("profile.takePhoto")} divider onPress={() => pickAvatar("camera")} />
          <ListRow icon="images-outline" tone="info" title={t("profile.pickPhoto")} divider={!!avatarUrl} onPress={() => pickAvatar("library")} />
          {avatarUrl && (
            <ListRow
              icon="trash-outline"
              title={t("profile.removePhoto")}
              destructive
              chevron={false}
              onPress={() => void removeAvatar()}
            />
          )}
        </Card>
      </BottomSheet>

    </View>
  );
}

/** Nhóm cài đặt: tiêu đề kèm đường kẻ mảnh, bên dưới là thẻ chứa các dòng. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionLine} />
      </View>
      <Card style={{ paddingVertical: spacing.xs }}>{children}</Card>
    </View>
  );
}

function Row(props: { icon: IconName; title: string; subtitle?: string; onPress?: () => void; right?: ReactNode; divider?: boolean }) {
  return <ListRow tone="primary" chevron={!!props.onPress && !props.right} {...props} />;
}

function Stat({ value, label }: { value: string; label: string }) {
  const styles = useStyles();
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </Card>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  topBar: { flexDirection: "row", marginBottom: spacing.md },
  root: { flex: 1, backgroundColor: colors.background },
  hero: { flexDirection: "row", alignItems: "flex-end", gap: spacing.md, marginBottom: spacing.xl },
  heroText: { flex: 1, paddingBottom: spacing.sm },
  eyebrow: { ...font.caption, fontSize: 13, fontWeight: "700", color: colors.primary, letterSpacing: 0.4 },
  heroTitle: { ...font.serif, fontSize: 27, lineHeight: 33, marginTop: 6 },
  heroBody: { ...font.body, fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: spacing.sm },
  arch: { width: 118, height: 160, borderTopLeftRadius: 59, borderTopRightRadius: 59, borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  homeBadge: { position: "absolute", left: -14, top: 18, width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: colors.background },
  profileCard: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  profileInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 48 },
  camera: { position: "absolute", right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.background },
  name: { ...font.heading, fontSize: 18 },
  role: { ...font.caption, fontSize: 13, marginTop: 2 },
  stats: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  stat: { flex: 1, alignItems: "center", paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
  statLabel: { ...font.caption, marginTop: 2 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.xxl, marginBottom: spacing.md },
  sectionTitle: { ...font.heading, fontSize: 16 },
  sectionLine: { width: 32, height: 1.5, borderRadius: 1, backgroundColor: colors.border },
  version: { ...font.caption, textAlign: "center", marginTop: spacing.xl },
}));
