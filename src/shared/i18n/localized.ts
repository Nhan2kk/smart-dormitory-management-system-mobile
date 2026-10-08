import type { Localized } from "./types";

/** Tạo văn bản song ngữ cho dữ liệu mock. */
export const L = (vi: string, en: string): Localized => ({ vi, en });
