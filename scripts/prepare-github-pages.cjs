/**
 * Hoàn thiện thư mục dist/ sau `expo export --platform web` để chạy trên GitHub Pages:
 * - Ghép đường dẫn con (EXPO_PUBLIC_BASE_URL) vào các link tuyệt đối viết tay trong public/index.html
 *   (manifest, icon màn hình chính) — Expo chỉ tự ghép cho tệp JS/asset do nó sinh ra.
 * - Tạo 404.html giống index.html: GitHub Pages không có rewrite như Netlify, nên F5 ở route con
 *   (vd. /debts) sẽ nhận 404.html và expo-router tự mở đúng màn hình.
 * - Tạo .nojekyll để thư mục `_expo` (bắt đầu bằng dấu gạch dưới) không bị Jekyll bỏ qua.
 */
const fs = require("node:fs");
const path = require("node:path");

class GitHubPagesPreparer {
  static HAND_WRITTEN_LINKS = ["/manifest.json", "/apple-touch-icon.png"];

  constructor(distDir, baseUrl) {
    this.distDir = distDir;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  run() {
    const indexPath = path.join(this.distDir, "index.html");
    if (!fs.existsSync(indexPath)) throw new Error(`Không thấy ${indexPath}. Chạy expo export trước.`);
    const html = this.prefixLinks(fs.readFileSync(indexPath, "utf8"));
    fs.writeFileSync(indexPath, html);
    fs.writeFileSync(path.join(this.distDir, "404.html"), html);
    fs.writeFileSync(path.join(this.distDir, ".nojekyll"), "");
    console.log(`Đã chuẩn bị ${this.distDir} cho GitHub Pages (base: "${this.baseUrl || "/"}").`);
  }

  prefixLinks(html) {
    if (!this.baseUrl) return html;
    return GitHubPagesPreparer.HAND_WRITTEN_LINKS.reduce(
      (result, link) => result.split(`href="${link}"`).join(`href="${this.baseUrl}${link}"`),
      html,
    );
  }
}

new GitHubPagesPreparer(path.resolve(__dirname, "..", "dist"), process.env.EXPO_PUBLIC_BASE_URL ?? "").run();
