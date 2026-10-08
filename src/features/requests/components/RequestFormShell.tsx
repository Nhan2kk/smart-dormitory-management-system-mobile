import { router } from "expo-router";
import { ReactNode, useState } from "react";
import { Text, View } from "react-native";
import { errorMessage } from "../../../shared/api";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { spacing, useTheme } from "../../../shared/theme";
import { AppHeader, BottomSheet, Button, Callout, Card, FooterBar, InfoRow, Screen, useToast } from "../../../shared/ui";
import type { RequestKind } from "../requestsApi";

type Props = {
  kind: RequestKind;
  /** Trả về thông báo lỗi nếu form chưa hợp lệ. */
  validate: () => string | null;
  summary: { label: string; value: string }[];
  /** Gửi yêu cầu lên BE, trả về mã yêu cầu vừa tạo. */
  onSubmit: () => Promise<string>;
  /** Mặc định mở chi tiết yêu cầu vừa tạo; truyền vào để điều hướng khác (vd. quay về biên bản nhận phòng). */
  onSent?: (id: string) => void;
  /** Nội dung cảnh báo thêm trong bảng xác nhận. */
  confirmNote?: string;
  subtitle?: string;
  children: ReactNode;
};

/** Khung chung cho form tạo yêu cầu: header, nút gửi cố định và bảng xác nhận trước khi gửi. */
export function RequestFormShell({ kind, validate, summary, onSubmit, onSent, confirmNote, subtitle, children }: Props) {
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

  const submit = async () => {
    setSubmitting(true);
    try {
      const id = await onSubmit();
      setConfirming(false);
      notify(t("requestForm.sent"));
      if (onSent) onSent(id);
      else router.replace({ pathname: "/request/[id]", params: { id, kind } });
    } catch (error) {
      notify(errorMessage(error), "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      header={<AppHeader title={t(`requests.kind.${kind}`)} subtitle={subtitle ?? t("requestForm.newRequest")} />}
      footer={
        <FooterBar>
          <Button label={t("common.continue")} icon="arrow-forward" iconPosition="right" onPress={next} style={{ flex: 1 }} />
        </FooterBar>
      }
    >
      {children}
      <BottomSheet
        visible={confirming}
        onClose={() => !submitting && setConfirming(false)}
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
        {confirmNote && (
          <Callout tone="warning" icon="alert-circle">
            {confirmNote}
          </Callout>
        )}
        <Callout tone="info" icon="time-outline">
          {t("requestForm.responseTime")}
        </Callout>
        <Text style={{ ...font.caption, textAlign: "center" }}>{t("requestForm.trackHint")}</Text>
      </BottomSheet>
    </Screen>
  );
}
