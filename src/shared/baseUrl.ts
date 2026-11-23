/** Đường dẫn con của bản web (vd. "/smart-dormitory-management-system-mobile" trên GitHub Pages), "" khi chạy ở gốc. */
export const WEB_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

/** Ghép đường dẫn tuyệt đối trong app (vd. "/sw.js") với đường dẫn con của bản web. */
export function webPath(path: string): string {
  return `${WEB_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
