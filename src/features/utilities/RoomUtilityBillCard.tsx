import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import {
  BillMilestoneKey,
  RoomUtilityBillStage,
  UtilityReportStatus,
  UtilityCommodity,
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

/** Màu và icon của từng trạng thái hóa đơn. */
const STAGE_STYLE: Record<RoomUtilityBillStage, { tone: Tone; icon: IconName }> = {
  [RoomUtilityBillStage.Unpaid]: { tone: "info", icon: "calendar-outline" },
  [RoomUtilityBillStage.Overdue]: { tone: "danger", icon: "alert-circle-outline" },
  [RoomUtilityBillStage.Paid]: { tone: "success", icon: "checkmark-circle-outline" },
  [RoomUtilityBillStage.PaidLate]: { tone: "warning", icon: "time-outline" },
};

/**
 * Thẻ một hóa đơn điện nước phòng: trạng thái và giải thích, mốc tiếp theo, tiền điện/nước, dòng
 * thời gian các mốc, số tiền mỗi người (tham khảo), báo cáo của bạn (rút được khi chờ xét) và form
 * gửi báo cáo người chưa góp tiền.
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
  const consequence = (key: BillMilestoneKey) => t(`roomUtility.milestoneConsequences.${key}`);
  // Đã qua ngày thanh toán nhưng còn trong thời gian được đóng trễ.
  const inLateWindow = bill.stage === RoomUtilityBillStage.Unpaid && bill.overdueDays > 0;
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
        {(inLateWindow
          ? t("roomUtility.lateUntil", { time: Formatter.dateTime(bill.lateUntil) })
          : t(`roomUtility.stageHints.${bill.stage}`)) +
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
        {bill.charges?.length > 0 ? (
          bill.charges.map((charge) => (
            <View key={charge.commodity}>
              <InfoRow
                label={t(
                  charge.commodity === UtilityCommodity.Electricity
                    ? "roomUtility.chargeElectricity"
                    : "roomUtility.chargeWater",
                  { usage: Formatter.decimal(charge.consumption ?? 0, 3) },
                )}
                value={Formatter.currency(charge.amount)}
              />
              {charge.lines.length > 1 &&
                charge.lines.map((line, index) => (
                  <Text
                    key={index}
                    style={{ color: colors.muted, fontSize: 12, paddingLeft: spacing.md }}
                  >
                    {t("roomUtility.chargeTier", {
                      index: index + 1,
                      quantity: Formatter.decimal(line.quantity ?? 0, 3),
                      price: Formatter.currency(line.unitPrice ?? 0),
                    })}
                    {" = "}
                    {Formatter.currency(line.amount ?? 0)}
                  </Text>
                ))}
            </View>
          ))
        ) : (
          <>
            <InfoRow
              label={t("roomUtility.electricity")}
              value={Formatter.decimal(bill.electricityKwh, 3)}
            />
            <InfoRow label={t("roomUtility.water")} value={Formatter.decimal(bill.waterM3, 3)} />
          </>
        )}
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
          {t("roomUtility.anyMemberCanPay")}
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
            {t("roomUtility.reportHint")}
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
