import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, View } from "react-native";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, useTheme } from "../../shared/theme";
import { Glass, IconName, Touchable } from "../../shared/ui";
import { SupportLauncherMenu } from "../support/SupportLauncherMenu";
import { useSupportChatState } from "../chat/SupportChatProvider";

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  emitter: { emit: (event: { type: "tabPress"; target: string; canPreventDefault: true }) => { defaultPrevented: boolean } };
  navigateToTab: (routeKey: string) => void;
  insets: { bottom: number };
};

const tabs: Record<string, { icons: [IconName, IconName]; label: "tabs.home" | "tabs.utilities" | "tabs.requests" | "tabs.profile" }> = {
  index: { icons: ["home-outline", "home"], label: "tabs.home" },
  utilities: { icons: ["flash-outline", "flash"], label: "tabs.utilities" },
  requests: { icons: ["document-text-outline", "document-text"], label: "tabs.requests" },
  profile: { icons: ["person-outline", "person"], label: "tabs.profile" },
};

/** Thanh tab nổi bằng kính mờ, nút tạo yêu cầu nhô lên ở giữa (vùng ngón cái dễ chạm). */
export function FloatingTabBar({ state, emitter, navigateToTab, insets }: TabBarProps) {
  const styles = useStyles();
  const { colors, shadow } = useTheme();
  const { t } = useI18n();
  const [supportOpen, setSupportOpen] = useState(false);
  const { unread } = useSupportChatState();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 6, 12) }]}>
      <View style={[styles.shadow, shadow(3)]}>
        <Glass intensity={70} style={styles.bar}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            if (route.name === "create")
              return (
                <View key={route.key} style={styles.item}>
                  <Touchable onPress={() => setSupportOpen(true)} accessibilityLabel={t("chat.support")} accessibilityState={{ expanded: supportOpen }} style={[styles.fab, shadow(2)]} pressScale={0.92}>
                    {/* Icon only, like the web launcher button: no "Hỗ trợ" caption while the menu is closed. */}
                    <Ionicons name="chatbubbles" size={24} color={colors.onPrimary} />
                    {unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{Math.min(unread,99)}</Text></View>}
                  </Touchable>
                </View>
              );
            const meta = tabs[route.name];
            if (!meta) return null;
            const label = t(meta.label);
            const onPress = () => {
              const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
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
                  <Ionicons name={focused ? meta.icons[1] : meta.icons[0]} size={19} color={focused ? colors.primary : colors.muted} />
                </View>
                <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                  {label}
                </Text>
              </Touchable>
            );
          })}
        </Glass>
      </View>
      <SupportLauncherMenu visible={supportOpen} onClose={() => setSupportOpen(false)} />
    </View>
  );
}

const useStyles = makeStyles(({ colors, tones }) => ({
  badge: { position: "absolute", top: -4, right: -5, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 4, backgroundColor: tones.danger.fg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.onPrimary },
  badgeText: { color: colors.onPrimary, fontSize: 10, fontWeight: "800" },
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  shadow: { borderRadius: radius.pill, width: "100%", maxWidth: 520, alignSelf: "center" },
  // Bo tròn hoàn toàn hai đầu; chừa lề trong rộng hơn để icon ngoài cùng không sát mép cong.
  bar: { flexDirection: "row", alignItems: "center", borderRadius: radius.pill, height: 72, paddingHorizontal: 14 },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, height: "100%" },
  // Nền icon đang chọn là hình tròn (rộng = cao).
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  iconActive: { backgroundColor: colors.primarySoft },
  label: { fontSize: 11, fontWeight: "600", color: colors.muted },
  labelActive: { color: colors.primary, fontWeight: "800" },
  fab: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "rgba(255,255,255,0.7)" },
}));
