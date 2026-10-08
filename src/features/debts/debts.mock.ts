import { L } from "../../shared/i18n/localized";
import type { Localized } from "../../shared/i18n/types";
import type { Tone } from "../../shared/theme";
import type { IconName } from "../../shared/ui";

export type DebtStatus = "overdue" | "due" | "upcoming" | "paid";
export type DebtType = "room" | "utilities" | "service";

export type Debt = {
  id: string;
  type: DebtType;
  title: Localized;
  amount: number;
  dueDate: string;
  status: DebtStatus;
  daysLeft?: number;
  paidAt?: string;
  method?: string;
};

export type BillType = "maintenanceCost" | "checkoutSettlement" | "roomTransferSettlement" | "registration";
export type BillStatus = "pending" | "paid" | "failed" | "cancelled";

export type Bill = { id: string; type: BillType; title: Localized; amount: number; createdAt: string; status: BillStatus };

/** Khoản có thể thanh toán (công nợ hoặc hoá đơn). */
export type Payable = { id: string; title: Localized; amount: number };

export const debtStatusTone: Record<DebtStatus, Tone> = { overdue: "danger", due: "warning", upcoming: "info", paid: "success" };
export const debtTypeMeta: Record<DebtType, { icon: IconName; tone: Tone }> = {
  room: { icon: "home-outline", tone: "primary" },
  utilities: { icon: "flash-outline", tone: "warning" },
  service: { icon: "sparkles-outline", tone: "violet" },
};
export const billStatusTone: Record<BillStatus, Tone> = { pending: "warning", paid: "success", failed: "danger", cancelled: "neutral" };

export class DebtRepository {
  private static readonly debts: Debt[] = [
    { id: "CN-1009", type: "utilities", title: L("Điện, nước tháng 09/2026", "Utilities 09/2026"), amount: 210_200, dueDate: "2026-10-05", status: "overdue", daysLeft: -3 },
    { id: "CN-1010", type: "room", title: L("Tiền phòng tháng 10/2026", "Rent 10/2026"), amount: 450_000, dueDate: "2026-10-12", status: "due", daysLeft: 4 },
    { id: "CN-1011", type: "service", title: L("Phí dịch vụ quý IV/2026", "Service fee Q4/2026"), amount: 300_000, dueDate: "2026-10-15", status: "due", daysLeft: 7 },
    { id: "CN-1101", type: "room", title: L("Tiền phòng tháng 11/2026", "Rent 11/2026"), amount: 450_000, dueDate: "2026-11-10", status: "upcoming", daysLeft: 33 },
    { id: "CN-0909", type: "room", title: L("Tiền phòng tháng 09/2026", "Rent 09/2026"), amount: 450_000, dueDate: "2026-09-10", status: "paid", paidAt: "2026-09-08T20:14:00+07:00", method: "QR · Techcombank" },
    { id: "CN-0809", type: "utilities", title: L("Điện, nước tháng 08/2026", "Utilities 08/2026"), amount: 214_015, dueDate: "2026-09-05", status: "paid", paidAt: "2026-09-03T08:41:00+07:00", method: "Bank transfer" },
    { id: "CN-0808", type: "room", title: L("Tiền phòng tháng 08/2026", "Rent 08/2026"), amount: 450_000, dueDate: "2026-08-10", status: "paid", paidAt: "2026-08-09T19:02:00+07:00", method: "QR · Techcombank" },
  ];

  private static readonly billRecords: Bill[] = [
    { id: "HD-0240", type: "roomTransferSettlement", title: L("Chênh lệch chuyển phòng A101 → B205", "Transfer difference A101 → B205"), amount: 300_000, createdAt: "2026-10-06T10:00:00+07:00", status: "pending" },
    { id: "HD-0231", type: "maintenanceCost", title: L("Thay khoá cửa phòng A101", "Door lock replacement A101"), amount: 120_000, createdAt: "2026-10-02T10:00:00+07:00", status: "pending" },
    { id: "HD-0188", type: "roomTransferSettlement", title: L("Chênh lệch chuyển phòng B205 → A101", "Transfer difference B205 → A101"), amount: 350_000, createdAt: "2026-03-01T15:30:00+07:00", status: "paid" },
  ];

  static readonly account = { bank: "Techcombank", accountNumber: "1903 1234 5678 9012", holder: "KY TUC XA DN" };

  static all(): Debt[] {
    return DebtRepository.debts;
  }

  static unpaid(): Debt[] {
    return DebtRepository.debts.filter((debt) => debt.status !== "paid");
  }

  static paid(): Debt[] {
    return DebtRepository.debts.filter((debt) => debt.status === "paid");
  }

  static bills(): Bill[] {
    return DebtRepository.billRecords;
  }

  static find(id: string): Payable | undefined {
    return DebtRepository.debts.find((debt) => debt.id === id) ?? DebtRepository.billRecords.find((bill) => bill.id === id);
  }

  static totalUnpaid(): number {
    return DebtRepository.unpaid().reduce((sum, debt) => sum + debt.amount, 0);
  }

  static hasOverdue(): boolean {
    return DebtRepository.debts.some((debt) => debt.status === "overdue");
  }

  static sumBy(status: DebtStatus): number {
    return DebtRepository.debts.filter((debt) => debt.status === status).reduce((sum, debt) => sum + debt.amount, 0);
  }

  static transferContent(id: string): string {
    return `KTXDN ${id} SV2026001`;
  }
}
