/**
 * Mở rộng app.json: khi deploy bản web dưới đường dẫn con (GitHub Pages: /<tên-repo>) thì đặt
 * EXPO_PUBLIC_BASE_URL lúc build để Expo ghép đường dẫn đó vào mọi tệp JS/asset và route.
 * Netlify chạy ở gốc domain nên để trống biến này.
 */
module.exports = ({ config }) => {
  const baseUrl = (process.env.EXPO_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
  if (!baseUrl) return config;
  return { ...config, experiments: { ...config.experiments, baseUrl } };
};
