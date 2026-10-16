import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import {
  BillMilestoneKey,
  RoomServiceState,
  RoomUtilityBillStage,
  UtilityReportStatus,
  UtilityReportType,
} from "../../enums/room-utility.enum";
import type { RoomUtilityBill } from "../../models/room-utility.model";
import { useI18n } from "../../shared/i18n/I18nProvider";
import {
  Button,
  Callout,
  Card,
  Chip,
  Field,
  InfoRow,
  Timeline,
  type IconName,
  type TimelineItem,
} from "../../shared/ui";
import { useTheme, spacing, type Tone } from "../../shared/theme";
import { Formatter } from "../../shared/format";

/** Màu và icon của từng giai đoạn hóa đơn. */
const STAGE_STYLE: Record<RoomUtilityBillStage, { tone: Tone; icon: IconName }> = {
  [RoomUtilityBillStage.InTerm]: { tone: "info", icon: "calendar-outline" },
  [RoomUtilityBillStage.DueSoon]: { tone: "warning", icon: "time-outline" },
  [RoomUtilityBillStage.OverdueInGrace]: { tone: "warning", icon: "alert-circle-outline" },
  [RoomUtilityBillStage.GraceFinalWarning]: { tone: "danger", icon: "warning-outline" },
  [RoomUtilityBillStage.ViolationPendingReview]: { tone: "danger", icon: "hourglass-outline" },
  [RoomUtilityBillStage.ViolationRecorded]: { tone: "danger", icon: "shield-outline" },
  [RoomUtilityBillStage.DisciplineProposed]: { tone: "danger", icon: "hammer-outline" },
  [RoomUtilityBillStage.Paid]: { tone: "success", icon: "checkmark-circle-outline" },
};

/**
 * Thẻ một hóa đơn điện nước phòng: giai đoạn và giải thích, mốc tiếp theo, dòng thời gian các mốc,
 * số tiền mỗi người (tham khảo), ai được đóng, người bị ghi lỗi, trạng thái điện nước, báo cáo của
 * bạn (rút được khi chờ xét) và form gửi báo cáo tách trách nhiệm.
 */
export function RoomUtilityBillCard({
  bill,
  busy,
  onReport,
  onWithdraw,
  onBeforePay,
}: {
  bill: RoomUtilityBill;
  busy: boolean;
  onReport: (accusedId: string, content: string) => Promise<boolean>;
  onWithdraw: (reportId: string) => void;
  onBeforePay: () => void;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [reporting, setReporting] = useState(false);
  const [accused, setAccused] = useState("");
  const [content, setContent] = useState("");
  const unpaid = bill.status !== "PAID";
  const style = STAGE_STYLE[bill.stage];
  const next = bill.nextMilestone;
  const consequence = (key: BillMilestoneKey) =>
    key === BillMilestoneKey.GraceEnd && bill.suspensionEnabled
      ? t("roomUtility.milestoneConsequences.GRACE_END_SUSPENSION")
      : t(`roomUtility.milestoneConsequences.${key}`);
  const timeline: TimelineItem[] = bill.milestones.map((m) => ({
    title: t(`roomUtility.milestones.${m.key}`),
    description: consequence(m.key),
    time: Formatter.dateTime(m.at),
    state: m.reached ? "done" : unpaid && next?.key === m.key ? "current" : "upcoming",
  }));
  const reportType =
    accused === ""
      ? null
      : accused === bill.representativeId
        ? UtilityReportType.RepresentativeCollected
        : UtilityReportType.MemberNotContributed;
  const service =
    bill.serviceState === RoomServiceState.Suspended ||
    bill.serviceState === RoomServiceState.RestoreRequired
      ? bill.serviceState
      : null;

  return (
    <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
      {/* Giai đoạn hiện tại: tên, giải thích, mốc tiếp theo */}
      <Callout
        tone={style.tone}
        icon={style.icon}
        title={
          t(`roomUtility.stages.${bill.stage}`) +
          (bill.overdueDays > 0
            ? " · " + t("roomUtility.overdueBy", { count: bill.overdueDays })
            : "")
        }
      >
        {t(`roomUtility.stageHints.${bill.stage}`) +
          (next
            ? "\n" +
              t("roomUtility.nextMilestone") +
              ": " +
              t(`roomUtility.milestones.${next.key}`) +
              " · " +
              Formatter.dateTime(next.at) +
              " — " +
              consequence(next.key)
            : "")}
      </Callout>
      {service && (
        <View style={{ marginTop: spacing.sm }}>
          <Callout tone="danger" icon="flash-off-outline">
            {t(`roomUtility.studentServiceBanner.${service}`)}
          </Callout>
        </View>
      )}
      {bill.reportedAgainstMe && unpaid && (
        <View style={{ marginTop: spacing.sm }}>
          <Callout tone="warning" icon="megaphone-outline">
            {t("roomUtility.reportedAgainstMe")}
          </Callout>
        </View>
      )}

      {/* Tóm tắt hóa đơn */}
      <View style={{ marginTop: spacing.sm }}>
        <InfoRow label={t("roomUtility.room")} value={bill.roomCode} />
        <InfoRow
          label={t("roomUtility.from")}
          value={Formatter.dateTime(bill.periodFrom)}
        />
        <InfoRow label={t("roomUtility.to")} value={Formatter.dateTime(bill.periodTo)} />
        <InfoRow
          label={t("roomUtility.electricity")}
          value={Formatter.decimal(bill.electricityKwh, 3)}
        />
        <InfoRow label={t("roomUtility.water")} value={Formatter.decimal(bill.waterM3, 3)} />
        <InfoRow
          label={t("roomUtility.amount")}
          value={Formatter.currency(bill.amount)}
          strong
        />
        {unpaid && (
          <InfoRow
            label={t("roomUtility.sharePerMember")}
            value={Formatter.currency(bill.sharePerMember)}
          />
        )}
        <InfoRow label={t("roomUtility.dueAt")} value={Formatter.dateTime(bill.dueAt)} />
        <InfoRow
          label={t("roomUtility.representative")}
          value={bill.representativeName || "—"}
        />
        {bill.paidAt && (
          <InfoRow label={t("roomUtility.paidAt")} value={Formatter.dateTime(bill.paidAt)} />
        )}
        {bill.paymentMethod && (
          <InfoRow
            label={t("roomUtility.paymentMethod")}
            value={
              t(`roomUtility.methods.${bill.paymentMethod}`) +
              (bill.cashReceiptNo
                ? " · " + t("roomUtility.receipt", { no: bill.cashReceiptNo })
                : "")
            }
          />
        )}
      </View>
      {unpaid && (
        <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
          {t("roomUtility.shareHint", { count: bill.memberCount })}{" "}
          {t(`roomUtility.payableBy.${bill.payableBy}`)}
        </Text>
      )}

      {/* Dòng thời gian các mốc */}
      {timeline.length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={{ color: colors.ink, fontWeight: "700", marginBottom: spacing.sm }}>
            {t("roomUtility.milestonesTitle")}
          </Text>
          <Timeline items={timeline} />
        </View>
      )}

      {/* Người bị ghi lỗi */}
      {bill.violatedStudents.length > 0 && (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={{ color: colors.danger, fontWeight: "700" }}>
            {t("roomUtility.violatedStudents")}
            {bill.violationTarget
              ? " · " + t(`roomUtility.violationTargets.${bill.violationTarget}`)
              : ""}
          </Text>
          {bill.violatedStudents.map((s) => (
            <Text key={s.id} style={{ color: colors.muted, marginTop: 2 }}>
              {s.name} — {t(`roomUtility.reasons.${s.reason}`)} (
              {t(`roomUtility.violationStatuses.${s.status}`)})
            </Text>
          ))}
        </View>
      )}

      {/* Báo cáo của bạn */}
      {bill.myReport && (
        <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
          <Text style={{ color: colors.ink, fontWeight: "700" }}>
            {t("roomUtility.myReport")}: {bill.myReport.accusedName} ·{" "}
            {t(`roomUtility.reportStatuses.${bill.myReport.status}`)}
          </Text>
          {bill.myReport.reviewNote && (
            <Text style={{ color: colors.muted }}>
              {t("roomUtility.reviewedBy", {
                name: bill.myReport.reviewedByName ?? "",
                note: bill.myReport.reviewNote,
              })}
            </Text>
          )}
          {bill.myReport.status === UtilityReportStatus.Pending && (
            <Button
              label={t("roomUtility.withdrawReport")}
              variant="ghost"
              size="md"
              disabled={busy}
              onPress={() => bill.myReport && onWithdraw(bill.myReport.id)}
            />
          )}
        </View>
      )}

      {/* Gửi báo cáo tách trách nhiệm */}
      {bill.canReport && !reporting && (
        <Button
          label={t("roomUtility.reportAction")}
          variant="secondary"
          size="md"
          onPress={() => {
            setReporting(true);
            setAccused("");
            setContent("");
          }}
          style={{ marginTop: spacing.sm }}
        />
      )}
      {bill.canReport && reporting && (
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          <Text style={{ color: colors.ink, fontWeight: "700" }}>
            {t("roomUtility.reportTitle")}
          </Text>
          <Text style={{ color: colors.muted }}>
            {t("roomUtility.reportHint", {
              deadline: bill.reportDeadline ? Formatter.dateTime(bill.reportDeadline) : "—",
            })}
          </Text>
          <Text style={{ color: colors.ink, fontWeight: "600" }}>
            {t("roomUtility.reportAccused")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {bill.reportableMembers.map((m) => (
              <Chip
                key={m.id}
                label={
                  m.name +
                  (m.id === bill.representativeId ? " (" + t("roomUtility.representative") + ")" : "")
                }
                selected={accused === m.id}
                onPress={() => setAccused(m.id)}
              />
            ))}
          </View>
          {reportType && (
            <Text style={{ color: colors.muted }}>
              {t("roomUtility.reportTypeAuto", {
                type: t(`roomUtility.reportTypes.${reportType}`),
              })}
            </Text>
          )}
          <Field
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={1000}
            placeholder={t("roomUtility.reportPlaceholder")}
          />
          <Button
            label={t("roomUtility.reportSubmit")}
            loading={busy}
            disabled={!accused || content.trim().length < 10}
            onPress={() =>
              void onReport(accused, content.trim()).then((ok) => ok && setReporting(false))
            }
          />
          <Button
            label={t("common.cancel")}
            variant="ghost"
            disabled={busy}
            onPress={() => setReporting(false)}
          />
        </View>
      )}

      {bill.canPay && (
        <Button
          label={t("roomUtility.payment")}
          onPress={() => {
            onBeforePay();
            router.push({
              pathname: "/debts/pay/[id]",
              params: {
                id: bill.id,
                billId: bill.id,
                roomUtility: "true",
                title: t("roomUtility.title") + " " + bill.roomCode,
              },
            });
          }}
          style={{ marginTop: spacing.sm }}
        />
      )}
    </Card>
  );
}
