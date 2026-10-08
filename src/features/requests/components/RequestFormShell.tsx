import { router } from "expo-router";
import { ReactNode, useState } from "react";
import { Text, View } from "react-native";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { spacing, useTheme } from "../../../shared/theme";
import { AppHeader, BottomSheet, Button, Callout, Card, FooterBar, InfoRow, Screen, useToast } from "../../../shared/ui";
import { RequestKind } from "../requests.mock";

type Props = {
  kind: RequestKind;
  /** Trả về thông báo lỗi nếu form chưa hợp lệ. */
  validate: () => string | null;
  summary: { label: string; value: string }[];
  children: ReactNode;
};

/** Khung chung cho form tạo yêu cầu: header, nút gửi cố định và bảng xác nhận trước khi gửi. */
export function RequestFormShell({ kind, validate, summary, children }: Props) {
  const { notify } = useToast();
  const { t } = useI18n();
  const { font } = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const next = () => {
    const error = validate();
    if (error) {
      notify(error, "warning");
      return;
    }
    setConfirming(true);
  };

  const submit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setConfirming(false);
      notify(t("requestForm.sent"));
      router.dismissTo("/requests");
    }, 700);
  };

  return (
    <Screen
      header={<AppHeader title={t(`requests.kind.${kind}`)} subtitle={t("requestForm.newRequest")} />}
      footer={
        <FooterBar>
          <Button label={t("common.continue")} icon="arrow-forward" iconPosition="right" onPress={next} style={{ flex: 1 }} />
        </FooterBar>
      }
    >
      {children}
      <BottomSheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        title={t("requestForm.confirmTitle")}
        subtitle={t("requestForm.confirmSubtitle")}
        footer={
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Button label={t("requestForm.editAgain")} variant="ghost" onPress={() => setConfirming(false)} style={{ flex: 1 }} />
            <Button label={t("requestForm.send")} icon="send" loading={submitting} onPress={submit} style={{ flex: 1.4 }} />
          </View>
        }
      >
        <Card style={{ paddingVertical: spacing.xs }}>
          {summary.map((row, index) => (
            <InfoRow key={row.label} label={row.label} value={row.value} divider={index < summary.length - 1} />
          ))}
        </Card>
        <Callout tone="info" icon="time-outline">
          {t("requestForm.responseTime")}
        </Callout>
        <Text style={{ ...font.caption, textAlign: "center" }}>{t("requestForm.trackHint")}</Text>
      </BottomSheet>
    </Screen>
  );
}
