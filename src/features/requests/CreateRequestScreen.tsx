import { useLocalSearchParams } from "expo-router";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AppHeader, EmptyState, Screen } from "../../shared/ui";
import { CheckoutForm } from "./components/CheckoutForm";
import { SupportForm } from "./components/SupportForm";
import { TransferForm } from "./components/TransferForm";

export function CreateRequestScreen() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const { t } = useI18n();
  if (kind === "supportMaintenance") return <SupportForm />;
  if (kind === "roomTransfer") return <TransferForm />;
  if (kind === "roomCheckout") return <CheckoutForm />;
  return (
    <Screen header={<AppHeader title={t("requestForm.newRequest")} />}>
      <EmptyState icon="help-circle-outline" title={t("requestForm.invalidKind")} />
    </Screen>
  );
}
