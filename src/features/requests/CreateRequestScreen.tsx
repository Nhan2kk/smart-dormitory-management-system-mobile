import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { spacing, useTheme } from "../../shared/theme";
import { AppHeader, Button, EmptyState, Screen } from "../../shared/ui";
import { useResidency } from "../residency/useResidency";
import { CheckoutForm } from "./components/CheckoutForm";
import { SupportForm } from "./components/SupportForm";
import { TransferForm } from "./components/TransferForm";

export function CreateRequestScreen() {
  const { kind, checkInId } = useLocalSearchParams<{ kind: string; checkInId?: string }>();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { loading, resident } = useResidency();
  // Chưa ở KTX thì không tạo được yêu cầu. Chuyển phòng phát sinh khi nhận phòng (có checkInId) được bỏ qua;
  // lỗi tải hồ sơ (resident = null) thì để BE kiểm tra.
  if (!checkInId && (loading || resident === false)) {
    return (
      <Screen header={<AppHeader title={t("requestForm.newRequest")} />}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <EmptyState
            icon="home-outline"
            title={t("requestForm.notResidentTitle")}
            description={t("requestForm.notResidentBody")}
            action={<Button label={t("requestForm.registerDorm")} size="md" icon="bed-outline" onPress={() => router.replace("/register-dorm")} />}
          />
        )}
      </Screen>
    );
  }
  if (kind === "supportMaintenance") return <SupportForm />;
  if (kind === "roomTransfer") return <TransferForm checkInId={checkInId ? String(checkInId) : undefined} />;
  if (kind === "roomCheckout") return <CheckoutForm />;
  return (
    <Screen header={<AppHeader title={t("requestForm.newRequest")} />}>
      <EmptyState icon="help-circle-outline" title={t("requestForm.invalidKind")} />
    </Screen>
  );
}
