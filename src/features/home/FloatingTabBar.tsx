import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, useTheme } from "../../shared/theme";
import { Glass, IconName, Touchable } from "../../shared/ui";

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { emit: (event: { type: "tabPress"; target: string; canPreventDefault: true }) => { defaultPrevented: boolean }; navigate: (name: string) => void };
  insets: { bottom: number };
};

const tabs: Record<string, { icons: [IconName, IconName]; label: "tabs.home" | "tabs.utilities" | "tabs.requests" | "tabs.profile" }> = {
  index: { icons: ["home-outline", "home"], label: "tabs.home" },
  utilities: { icons: ["flash-outline", "flash"], label: "tabs.utilities" },
  requests: { icons: ["document-text-outline", "document-text"], label: "tabs.requests" },
  profile: { icons: ["person-outline", "person"], label: "tabs.profile" },
};

/** Thanh tab nổi bằng kính mờ, nút tạo yêu cầu nhô lên ở giữa (vùng ngón cái dễ chạm). */
export function FloatingTabBar({ state, navigation, insets }: TabBarProps) {
  const styles = useStyles();
  const { colors, shadow } = useTheme();
  const { t } = useI18n();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 6, 12) }]}>
      <View style={[styles.shadow, shadow(3)]}>
        <Glass intensity={70} style={styles.bar}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            if (route.name === "create")
              return (
                <View key={route.key} style={styles.item}>
                  <Touchable onPress={() => router.push("/assistant")} accessibilityLabel={t("tabs.create")} style={[styles.fab, shadow(2)]} pressScale={0.92}>
                    <Ionicons name="sparkles" size={24} color={colors.onPrimary} />
                    <Text style={[styles.fabLabel, { color: colors.onPrimary }]}>AI</Text>
                  </Touchable>
                </View>
              );
            const meta = tabs[route.name];
            if (!meta) return null;
            const label = t(meta.label);
            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            return (
              <Touchable
                key={route.key}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                style={styles.item}
                pressScale={0.92}
              >
                <View style={[styles.iconWrap, focused && styles.iconActive]}>
                  <Ionicons name={focused ? meta.icons[1] : meta.icons[0]} size={22} color={focused ? colors.primary : colors.muted} />
                </View>
                <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                  {label}
                </Text>
              </Touchable>
            );
          })}
        </Glass>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  shadow: { borderRadius: radius.xl + 6, width: "100%", maxWidth: 520, alignSelf: "center" },
  bar: { flexDirection: "row", alignItems: "center", borderRadius: radius.xl + 6, height: 72, paddingHorizontal: 6 },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, height: "100%" },
  iconWrap: { width: 46, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  iconActive: { backgroundColor: colors.primarySoft },
  label: { fontSize: 11, fontWeight: "600", color: colors.muted },
  labelActive: { color: colors.primary, fontWeight: "800" },
  fabLabel: { fontSize: 10, fontWeight: "900", marginTop: -2, letterSpacing: 0.5 },
  fab: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "rgba(255,255,255,0.7)" },
}));
