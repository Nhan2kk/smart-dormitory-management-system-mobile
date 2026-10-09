import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { Formatter } from "../format";
import { en } from "./en";
import type { Dictionary, Language, Localized, TranslationKey } from "./types";
import { vi } from "./vi";

const dictionaries: Record<Language, Dictionary> = { vi, en };

type Params = Record<string, string | number>;

type I18nValue = {
  lang: Language;
  t: (key: TranslationKey, params?: Params) => string;
  /** Chọn bản ngôn ngữ phù hợp của dữ liệu song ngữ. */
  l: (text: Localized) => string;
};

/** Tra cứu khoá dạng "a.b.c" và thay tham số {{name}}. */
export class Translator {
  static translate(
    dictionary: Dictionary,
    key: string,
    params?: Params,
  ): string {
    const value = key
      .split(".")
      .reduce<unknown>(
        (node, part) => (node as Record<string, unknown> | undefined)?.[part],
        dictionary,
      );
    const text = typeof value === "string" ? value : key;
    return params
      ? text.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
          String(params[name] ?? ""),
        )
      : text;
  }
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  lang,
  children,
}: {
  lang: Language;
  children: ReactNode;
}) {
  Formatter.setLanguage(lang, dictionaries[lang]);
  const t = useCallback(
    (key: TranslationKey, params?: Params) =>
      Translator.translate(dictionaries[lang], key, params),
    [lang],
  );
  const l = useCallback((text: Localized) => text[lang], [lang]);
  const value = useMemo(() => ({ lang, t, l }), [lang, t, l]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n phải nằm trong I18nProvider");
  return context;
}

export type { Language, Localized, TranslationKey };
