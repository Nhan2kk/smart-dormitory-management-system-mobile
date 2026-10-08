import { useMemo, useState } from "react";
import { View } from "react-native";
import { Formatter } from "../../../shared/format";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { spacing } from "../../../shared/theme";
import { Callout, DateStrip, DateStripModel, Field, FormSection } from "../../../shared/ui";
import { useAuth } from "../../auth/AuthProvider";
import { requestsApi } from "../requestsApi";
import { RequestFormShell } from "./RequestFormShell";

export function CheckoutForm() {
  const { t } = useI18n();
  const { request } = useAuth();
  const api = useMemo(() => requestsApi(request), [request]);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const checkoutDates = useMemo(() => DateStripModel.range(new Date(today.getTime() + 86_400_000), 30), [today]);
  const inspectionDates = useMemo(() => DateStripModel.range(today, 30), [today]);
  const [checkoutDate, setCheckoutDate] = useState<string | null>(null);
  const [inspectionDate, setInspectionDate] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  return (
    <RequestFormShell
      kind="roomCheckout"
      validate={() => (!checkoutDate ? t("requestForm.errCheckoutDate") : !inspectionDate ? t("requestForm.errInspection") : !reason.trim() ? t("requestForm.errReason") : null)}
      onSubmit={async () => {
        const created = await api.createCheckout({ expectedCheckoutDate: checkoutDate!, preferredInspectionDate: inspectionDate!, reason: reason.trim(), studentNote: note.trim() || undefined });
        return created.id;
      }}
      summary={[
        { label: t("requestForm.checkoutDate"), value: checkoutDate ? Formatter.date(checkoutDate) : "—" },
        { label: t("requestForm.inspectionDate"), value: inspectionDate ? Formatter.date(inspectionDate) : "—" },
        { label: t("requestForm.checkoutReason"), value: reason.trim() },
        ...(note.trim() ? [{ label: t("requestForm.note"), value: note.trim() }] : []),
      ]}
    >
      <View style={{ marginTop: spacing.sm }}>
        <Callout tone="violet" icon="information-circle" title={t("requestForm.checkoutFlowTitle")}>
          {t("requestForm.checkoutFlow")}
        </Callout>
      </View>

      <FormSection title={t("requestForm.checkoutDate")}>
        <DateStrip
          dates={checkoutDates}
          value={checkoutDate}
          onChange={(iso) => {
            setCheckoutDate(iso);
            if (inspectionDate && inspectionDate >= iso) setInspectionDate(null);
          }}
        />
      </FormSection>

      <FormSection title={t("requestForm.inspectionDate")} hint={t("requestForm.inspectionHint")}>
        <DateStrip dates={inspectionDates} value={inspectionDate} onChange={setInspectionDate} isDisabled={(date) => !checkoutDate || DateStripModel.iso(date) >= checkoutDate} />
      </FormSection>

      <FormSection title={t("requestForm.checkoutReason")}>
        <Field multiline value={reason} onChangeText={setReason} placeholder={t("requestForm.checkoutReasonPlaceholder")} maxLength={500} />
      </FormSection>

      <FormSection title={t("requestForm.note")} hint={t("requestForm.optional")}>
        <Field multiline value={note} onChangeText={setNote} placeholder={t("requestForm.notePlaceholder")} maxLength={500} />
      </FormSection>
    </RequestFormShell>
  );
}
