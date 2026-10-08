import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { I18nProvider, Language } from "./i18n/I18nProvider";
import { GlassLevel, PresetName, PRESETS, ThemeMode, ThemeProvider, WallpaperName } from "./theme";

export type Preferences = {
  language: Language;
  mode: ThemeMode;
  preset: PresetName;
  /** Chế độ kính trong suốt: ảnh nền mờ + thẻ bán trong suốt. */
  glass: boolean;
  glassLevel: GlassLevel;
  wallpaper: WallpaperName;
  avatarUri: string | null;
  push: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  language: "vi",
  mode: "light",
  preset: "sunset",
  glass: false,
  glassLevel: "medium",
  wallpaper: "lobby",
  avatarUri: null,
  push: true,
};

/** Lưu tuỳ chọn giao diện trên thiết bị (SecureStore trên mobile, localStorage trên web). */
export class PreferencesStore {
  private static readonly key = "sdms.preferences";

  static async load(): Promise<Partial<Preferences>> {
    try {
      const raw = Platform.OS === "web" ? globalThis.localStorage?.getItem(PreferencesStore.key) : await SecureStore.getItemAsync(PreferencesStore.key);
      return raw ? (JSON.parse(raw) as Partial<Preferences>) : {};
    } catch {
      return {};
    }
  }

  static async save(preferences: Preferences): Promise<void> {
    try {
      const raw = JSON.stringify(preferences);
      if (Platform.OS === "web") globalThis.localStorage?.setItem(PreferencesStore.key, raw);
      else await SecureStore.setItemAsync(PreferencesStore.key, raw);
    } catch {
      // Lưu thất bại không ảnh hưởng phiên hiện tại.
    }
  }
}

type PreferencesValue = Preferences & {
  ready: boolean;
  update: (patch: Partial<Preferences>) => void;
  reset: () => void;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

/** Cung cấp tuỳ chọn người dùng, đồng thời bọc Theme và I18n theo tuỳ chọn đó. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    PreferencesStore.load().then((saved) => {
      // Bỏ các khoá cũ/không hợp lệ từ phiên bản trước (vd. "accent").
      const rest: Partial<Preferences> & { accent?: string } = { ...saved };
      delete rest.accent;
      if (rest.preset && !(rest.preset in PRESETS)) delete rest.preset;
      setPreferences((current) => ({ ...current, ...rest }));
      setReady(true);
    });
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      PreferencesStore.save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setPreferences((current) => {
      const next = { ...DEFAULT_PREFERENCES, avatarUri: current.avatarUri, language: current.language };
      PreferencesStore.save(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ...preferences, ready, update, reset }), [preferences, ready, update, reset]);

  return (
    <PreferencesContext.Provider value={value}>
      <ThemeProvider
        mode={preferences.mode}
        preset={preferences.preset}
        glass={preferences.glass}
        glassLevel={preferences.glassLevel}
        wallpaper={preferences.wallpaper}
      >
        <I18nProvider lang={preferences.language}>{children}</I18nProvider>
      </ThemeProvider>
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences phải nằm trong PreferencesProvider");
  return context;
}
