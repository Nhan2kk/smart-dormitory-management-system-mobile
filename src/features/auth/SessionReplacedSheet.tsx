import { router } from "expo-router";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { BottomSheet, Button } from "../../shared/ui";
import { useAuth } from "./AuthProvider";

/**
 * Máy này vừa bị đẩy ra vì tài khoản đăng nhập trên thiết bị khác: báo lý do, xác nhận thì về màn đăng nhập.
 */
export function SessionReplacedSheet() {
  const { sessionNotice, dismissSessionNotice } = useAuth();
  const { t } = useI18n();
  const confirm = () => {
    dismissSessionNotice();
    router.replace("/login");
  };
  return (
    <BottomSheet
      visible={!!sessionNotice}
      onClose={dismissSessionNotice}
      title={t("auth.sessionReplacedTitle")}
      subtitle={sessionNotice ?? t("auth.sessionReplacedBody")}
      footer={<Button label={t("auth.sessionReplacedAction")} icon="log-in-outline" variant="dark" onPress={confirm} />}
    />
  );
}
