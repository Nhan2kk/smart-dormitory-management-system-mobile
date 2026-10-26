import { useState } from "react";
import { Text, View } from "react-native";
import type { RoomUtilityPolicy } from "../../models/room-utility.model";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { Button, Card } from "../../shared/ui";
import { useTheme, spacing } from "../../shared/theme";
import { Formatter } from "../../shared/format";

/**
 * Quy định đóng tiền điện nước đang áp dụng, viết thành câu với ngày giờ của kỳ hiện tại. Con số lấy
 * từ cấu hình thật; chưa có cấu hình thì dùng mặc định trùng backend.
 */
export function RoomUtilityPolicySection({ policy }: { policy: RoomUtilityPolicy }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const e = policy.example;
  const s = policy.schedule;
  const rules = {
    dueSoonHours: s?.dueSoonWarningHours ?? 72,
    dailyHour: s?.dailyReminderHour ?? 8,
    grace: s?.gracePeriodDays ?? 5,
    suspension: s?.suspensionEnabled ?? true,
    disciplineDays: s?.disciplineOverdueDays ?? 30,
    count: s?.disciplineViolationCount ?? 3,
    months: s?.disciplineWindowMonths ?? 12,
  };
  const items = [
    t("roomUtility.policyRules.close", { time: Formatter.dateTime(e.closeAt) }),
    t("roomUtility.policyRules.due", { time: Formatter.dateTime(e.dueAt) }),
    t("roomUtility.policyRules.dueSoon", {
      time: Formatter.dateTime(e.dueSoonAt),
      hours: rules.dueSoonHours,
    }),
    t("roomUtility.policyRules.daily", { hour: String(rules.dailyHour).padStart(2, "0") }),
    t("roomUtility.policyRules.grace", {
      days: rules.grace,
      time: Formatter.dateTime(e.graceEndsAt),
    }),
    t("roomUtility.policyRules.violation"),
    ...(rules.suspension ? [t("roomUtility.policyRules.suspension")] : []),
    t("roomUtility.policyRules.discipline", {
      days: rules.disciplineDays,
      time: Formatter.dateTime(e.disciplineAt),
      count: rules.count,
      months: rules.months,
    }),
  ];
  return (
    <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
      <Button
        label={t(open ? "roomUtility.policyHide" : "roomUtility.policyShow")}
        variant="ghost"
        size="md"
        icon="book-outline"
        onPress={() => setOpen(!open)}
      />
      {open && (
        <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
          <Text style={{ color: colors.ink, fontWeight: "700" }}>
            {t("roomUtility.policyTitle")}
          </Text>
          {!s && <Text style={{ color: colors.muted }}>{t("roomUtility.policyNoSchedule")}</Text>}
          <Text style={{ color: colors.muted }}>
            {t("roomUtility.policyExample", {
              // Server trả "yyyy-MM"; hiển thị "10/2026".
              month: Formatter.monthYear(e.month + "-01T00:00:00"),
            })}
          </Text>
          {items.map((item, index) => (
            <Text key={item} style={{ color: colors.ink }}>
              {index + 1}. {item}
            </Text>
          ))}
        </View>
      )}
    </Card>
  );
}
