import { Text, View } from "react-native";
import { usePreferences } from "../../shared/preferences";
import { radius } from "../../shared/theme";
import { Glass, Touchable } from "../../shared/ui";
import type { Language } from "../../shared/i18n/types";

/** Công tắc VI | EN dạng kính, dùng trên ảnh ở màn chào/đăng nhập. */
export function LanguageToggle() {
  const { language, update } = usePreferences();
  return (
    <Glass variant="photo" style={{ flexDirection: "row", borderRadius: radius.pill, padding: 3 }}>
      {(["vi", "en"] as Language[]).map((lang) => {
        const active = lang === language;
        return (
          <Touchable
            key={lang}
            onPress={() => update({ language: lang })}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={lang === "vi" ? "Tiếng Việt" : "English"}
            style={{ paddingHorizontal: 12, height: 32, borderRadius: radius.pill, justifyContent: "center", backgroundColor: active ? "rgba(255,255,255,0.95)" : "transparent" }}
          >
            <View>
              <Text style={{ fontSize: 12, fontWeight: "800", color: active ? "#1F1B17" : "#FFFFFF" }}>{lang.toUpperCase()}</Text>
            </View>
          </Touchable>
        );
      })}
    </Glass>
  );
}
