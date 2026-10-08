import type { vi } from "./vi";

export type Dictionary = typeof vi;
export type Language = "vi" | "en";

/** Văn bản dữ liệu (mock/API) có sẵn hai ngôn ngữ. */
export type Localized = { vi: string; en: string };

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;

/** Mọi đường dẫn khoá dạng "a.b.c" tới một chuỗi trong từ điển. */
export type TranslationKey<T = Dictionary> = {
  [K in keyof T]: T[K] extends string ? K & string : Join<K, TranslationKey<T[K]>>;
}[keyof T];
