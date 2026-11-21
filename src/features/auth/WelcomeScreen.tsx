import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { Photos } from "../../shared/images";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { Button, Glass, IconName, PhotoBackground } from "../../shared/ui";
import { useAuth } from "./AuthProvider";
import { LanguageToggle } from "./LanguageToggle";

export function WelcomeScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  if (user) return <Redirect href="/" />;

  const highlights: { icon: IconName; label: string }[] = [
    { icon: "qr-code-outline", label: t("auth.highlightQr") },
    { icon: "flash-outline", label: t("auth.highlightIot") },
    { icon: "sparkles-outline", label: t("auth.highlightAi") },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <PhotoBackground source={Photos.welcome()} anchor="center" style={styles.photo}>
        <View style={[styles.top, { paddingTop: insets.top + spacing.md }]}>
          <Glass variant="photo" style={styles.brand}>
            <View style={styles.logo}>
              <Image source={require("../../../assets/brand-logo.png")} style={{ width: 20, height: 20 }} resizeMode="contain" />
            </View>
            <Text style={styles.brandText}>SDMS</Text>
          </Glass>
          <LanguageToggle />
        </View>
        <View style={styles.pills}>
          {highlights.map((item) => (
            <Glass key={item.label} variant="photo" style={styles.pill}>
              <Ionicons name={item.icon} size={14} color={colors.white} />
              <Text style={styles.pillText}>{item.label}</Text>
            </Glass>
          ))}
        </View>
      </PhotoBackground>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.headline}>
          {t("auth.welcomeTitle1")}
          {"\n"}
          <Text style={{ color: colors.primary }}>{t("auth.welcomeTitle2")}</Text>
        </Text>
        <Text style={styles.body}>{t("auth.welcomeBody")}</Text>
        <Button label={t("auth.getStarted")} icon="arrow-forward" iconPosition="right" onPress={() => router.push("/login")} style={{ marginTop: spacing.xxl }} />
        <Text style={styles.note}>{t("auth.welcomeNote")}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  photo: { flex: 1, minHeight: 320, justifyContent: "space-between", paddingBottom: 56 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 5, paddingRight: 14, height: 42, borderRadius: radius.pill },
  logo: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  brandText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.xl },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 34, borderRadius: radius.pill },
  pillText: { fontSize: 12, fontWeight: "700", color: colors.white },
  sheet: { marginTop: -36, backgroundColor: colors.background, borderTopLeftRadius: radius.xl + 10, borderTopRightRadius: radius.xl + 10, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl + 4 },
  headline: { ...font.display, fontSize: 32, lineHeight: 40 },
  body: { ...font.body, fontSize: 16, lineHeight: 23, marginTop: spacing.md },
  note: { ...font.caption, textAlign: "center", marginTop: spacing.md },
}));
