import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Platform } from "react-native";
import { WebPushEnableResult } from "../../enums/web-push.enum";
import { WebPushService } from "../../services/web-push.service";
import { errorMessage } from "../../shared/api";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { usePreferences } from "../../shared/preferences";
import { useToast } from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";

/**
 * Trạng thái và thao tác bật/tắt thông báo đẩy, dùng chung cho tab Cá nhân và màn Thông báo.
 * Bản web chỉ coi là bật sau khi máy chủ xác nhận đăng ký nhận thông báo của trình duyệt này.
 */
export function usePushNotifications() {
  const { request } = useAuth();
  const prefs = usePreferences();
  const { notify } = useToast();
  const { t } = useI18n();
  const webPush = useMemo(() => new WebPushService(request), [request]);
  const confirmed = useSyncExternalStore(WebPushService.observe, WebPushService.isConfirmed, () => false);
  const enabled = Platform.OS === "web" ? prefs.push && confirmed : prefs.push;

  const setEnabled = useCallback(
    (value: boolean) => {
      if (Platform.OS !== "web") {
        prefs.update({ push: value });
        notify(value ? t("profile.pushOn") : t("profile.pushOff"), "info");
        return;
      }
      if (!value) {
        prefs.update({ push: false });
        void webPush.disable();
        notify(t("profile.pushOff"), "info");
        return;
      }
      // Gọi ngay trong sự kiện bấm: iOS chỉ cho xin quyền thông báo khi người dùng thao tác.
      webPush
        .enable()
        .then((result) => {
          if (result === WebPushEnableResult.Enabled) {
            prefs.update({ push: true });
            notify(t("profile.pushOn"), "success");
          } else if (result === WebPushEnableResult.Denied) notify(t("profile.pushDenied"), "danger");
          else if (result === WebPushEnableResult.ServerDisabled) notify(t("profile.pushServerOff"), "danger");
          else notify(t("profile.pushUnsupported"), "info");
        })
        .catch((error) => notify(errorMessage(error), "danger"));
    },
    [prefs, webPush, notify, t],
  );

  return { enabled, setEnabled };
}
