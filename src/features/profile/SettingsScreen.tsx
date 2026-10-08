import { Ionicons } from "@expo/vector-icons";
import { Switch, Text, View } from "react-native";
import { useI18n } from "../../shared/i18n/I18nProvider";
import type { Language } from "../../shared/i18n/types";
import { Photos } from "../../shared/images";
import { usePreferences } from "../../shared/preferences";
import { GlassLevel, makeStyles, PresetName, PRESETS, radius, spacing, ThemeMode, useTheme, WallpaperName } from "../../shared/theme";
import { AppHeader, Button, Card, FormSection, Glass, IconName, ListRow, PhotoBackground, Screen, SegmentedControl, Touchable, useToast } from "../../shared/ui";

const presets: PresetName[] = ["sunset", "lavender", "sage", "forest", "lagoon", "fresh"];
const wallpapers: WallpaperName[] = ["lobby", "campus", "dorm", "room"];

/** Cài đặt giao diện: bộ chủ đề, sáng/tối, kính trong suốt, ngôn ngữ — áp dụng ngay, lưu trên thiết bị. */
export function SettingsScreen() {
  const { t } = useI18n();
  const { notify } = useToast();
  const { colors, isDark } = useTheme();
  const prefs = usePreferences();
  const styles = useStyles();

  return (
    <Screen header={<AppHeader title={t("settings.title")} />}>
      <Text style={styles.sectionLabel}>{t("settings.preview")}</Text>
      <PhotoBackground source={Photos.grandLobby(800)} shade style={styles.preview}>
        <Glass variant="photo" style={styles.previewGlass}>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewTitle}>{t("settings.previewCard")}</Text>
            <Text style={styles.previewBody}>{t("settings.previewBody")}</Text>
          </View>
          <View style={[styles.previewButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
          </View>
        </Glass>
      </PhotoBackground>

      <FormSection title={t("settings.theme")} hint={t("settings.themeHint")}>
        <View style={styles.presets}>
          {presets.map((name) => {
            const palette = PRESETS[name][isDark ? "dark" : "light"];
            const selected = prefs.preset === name;
            return (
              <Touchable
                key={name}
                onPress={() => prefs.update({ preset: name })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t(`settings.presets.${name}`)}
                style={[styles.preset, { backgroundColor: palette.background, borderColor: selected ? palette.primary : palette.border }]}
              >
                <View style={[styles.mini, { backgroundColor: palette.surface }]}>
                  <View style={[styles.miniLine, { backgroundColor: palette.ink, width: "60%" }]} />
                  <View style={[styles.miniLine, { backgroundColor: palette.muted, width: "40%", opacity: 0.6 }]} />
                  <View style={[styles.miniButton, { backgroundColor: palette.primary }]} />
                </View>
                <View style={styles.presetFoot}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.presetName, { color: palette.ink }]}>{t(`settings.presets.${name}`)}</Text>
                    <Text style={[styles.presetHint, { color: palette.muted }]} numberOfLines={1}>
                      {t(`settings.presetHints.${name}`)}
                    </Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={20} color={palette.primary} />}
                </View>
              </Touchable>
            );
          })}
        </View>
      </FormSection>

      <FormSection title={t("settings.mode")} hint={t("settings.modeHint")}>
        <View style={styles.modes}>
          {(
            [
              { value: "light", icon: "sunny-outline", label: t("settings.light") },
              { value: "dark", icon: "moon-outline", label: t("settings.dark") },
              { value: "system", icon: "phone-portrait-outline", label: t("settings.system") },
            ] as { value: ThemeMode; icon: IconName; label: string }[]
          ).map((option) => {
            const selected = option.value === prefs.mode;
            return (
              <Touchable key={option.value} onPress={() => prefs.update({ mode: option.value })} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={option.label} style={[styles.mode, selected && styles.selected]}>
                <View style={[styles.modeIcon, selected && { backgroundColor: colors.primary }]}>
                  <Ionicons name={option.icon} size={22} color={selected ? colors.onPrimary : colors.inkSoft} />
                </View>
                <Text style={[styles.modeLabel, selected && { color: colors.primary }]}>{option.label}</Text>
              </Touchable>
            );
          })}
        </View>
      </FormSection>

      <FormSection title={t("settings.glass")} hint={t("settings.glassHint")}>
        <Card style={{ paddingVertical: spacing.xs }}>
          <ListRow
            icon="layers-outline"
            tone="primary"
            title={t("settings.glassOn")}
            subtitle={t("settings.glassOnSub")}
            right={<Switch value={prefs.glass} onValueChange={(value) => prefs.update({ glass: value })} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#FFFFFF" accessibilityLabel={t("settings.glassOn")} />}
          />
        </Card>
        {prefs.glass && (
          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            <Text style={styles.subLabel}>{t("settings.wallpaper")}</Text>
            <View style={styles.wallpapers}>
              {wallpapers.map((name) => {
                const selected = prefs.wallpaper === name;
                return (
                  <Touchable key={name} onPress={() => prefs.update({ wallpaper: name })} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={t(`settings.wallpapers.${name}`)} style={{ flex: 1 }}>
                    <PhotoBackground source={Photos.wallpaper(name, 300)} shade style={[styles.wallpaper, selected && { borderColor: colors.primary }]}>
                      {selected && (
                        <View style={[styles.wallpaperCheck, { backgroundColor: colors.primary }]}>
                          <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                        </View>
                      )}
                      <Text style={styles.wallpaperLabel}>{t(`settings.wallpapers.${name}`)}</Text>
                    </PhotoBackground>
                  </Touchable>
                );
              })}
            </View>
            <Text style={styles.subLabel}>{t("settings.glassLevel")}</Text>
            <SegmentedControl<GlassLevel>
              value={prefs.glassLevel}
              onChange={(value) => prefs.update({ glassLevel: value })}
              options={[
                { value: "soft", label: t("settings.levels.soft") },
                { value: "medium", label: t("settings.levels.medium") },
                { value: "clear", label: t("settings.levels.clear") },
              ]}
            />
          </View>
        )}
      </FormSection>

      <FormSection title={t("settings.language")} hint={t("settings.languageHint")}>
        <SegmentedControl<Language>
          value={prefs.language}
          onChange={(value) => prefs.update({ language: value })}
          options={[
            { value: "vi", label: t("settings.vietnamese") },
            { value: "en", label: t("settings.english") },
          ]}
        />
      </FormSection>

      <Button
        label={t("settings.reset")}
        variant="ghost"
        icon="refresh"
        onPress={() => {
          prefs.reset();
          notify(t("settings.resetDone"));
        }}
        style={{ marginTop: spacing.xxl }}
      />
      <Text style={styles.note}>{t("settings.savedNote")}</Text>
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  sectionLabel: { ...font.heading, fontSize: 16, marginBottom: spacing.md, marginTop: spacing.sm },
  subLabel: { ...font.label },
  preview: { height: 150, borderRadius: radius.xl, padding: spacing.sm, justifyContent: "flex-end" },
  previewGlass: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.lg, padding: spacing.lg },
  previewTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  previewBody: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 },
  previewButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  presets: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  preset: { width: "48%", borderRadius: radius.lg, padding: spacing.sm, borderWidth: 2, gap: spacing.sm },
  mini: { height: 64, borderRadius: radius.md, padding: spacing.sm, gap: 5 },
  miniLine: { height: 6, borderRadius: 3 },
  miniButton: { position: "absolute", right: 8, bottom: 8, width: 34, height: 16, borderRadius: 8 },
  presetFoot: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4, paddingBottom: 2 },
  presetName: { fontSize: 14, fontWeight: "800" },
  presetHint: { fontSize: 11, fontWeight: "500" },
  modes: { flexDirection: "row", gap: spacing.sm },
  mode: { flex: 1, alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceWarm },
  modeIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  modeLabel: { ...font.label },
  wallpapers: { flexDirection: "row", gap: spacing.sm },
  wallpaper: { height: 96, borderRadius: radius.md, justifyContent: "flex-end", padding: 8, borderWidth: 2, borderColor: "transparent" },
  wallpaperCheck: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  wallpaperLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  note: { ...font.caption, textAlign: "center", marginTop: spacing.md },
}));
