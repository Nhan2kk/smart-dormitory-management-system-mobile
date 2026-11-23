/* Service worker của bản web: nhận thông báo đẩy (Web Push) và mở app khi bấm vào thông báo.
   iOS yêu cầu mọi lượt đẩy đều phải hiện thông báo, nên luôn gọi showNotification. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "SDMS";
  const icon = new URL("icon-192.png", self.registration.scope).href;
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon,
      badge: icon,
      tag: data.tag || undefined,
      data: { url: data.url || "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Đường dẫn máy chủ gửi (vd. "/notifications") tính từ thư mục của service worker, để chạy đúng cả khi
  // bản web nằm dưới đường dẫn con (GitHub Pages).
  const path = (event.notification.data?.url || "/notifications").replace(/^\//, "");
  const target = new URL(path, self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const client = clients.find((item) => item.url.startsWith(self.registration.scope));
      if (client) return client.focus().then((focused) => focused.navigate?.(target) ?? focused);
      return self.clients.openWindow(target);
    }),
  );
});
