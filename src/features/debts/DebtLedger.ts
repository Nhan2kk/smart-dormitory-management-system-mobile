import { DebtStatus, LedgerStatus } from "../../enums/debt.enum";
import type { BillResponse, Debt, StudentDebt, StudentDebtSummary } from "../../models/debt.model";

/**
 * Sổ công nợ của sinh viên dựng từ dữ liệu backend (`/student/debts/*`): tổng hợp do server tính,
 * khoản còn nợ (đã sắp xếp quá hạn → hạn gần nhất), lịch sử đã trả và danh sách hoá đơn phát sinh.
 */
export class DebtLedger {
  constructor(
    readonly summary: StudentDebtSummary,
    private readonly outstanding: StudentDebt[],
    private readonly history: StudentDebt[],
    readonly bills: BillResponse[],
  ) {}

  /** Khoản còn nợ (gồm phí đăng ký đang giữ chỗ), quá hạn và hạn gần nhất lên trước. */
  unpaid(): Debt[] {
    return this.outstanding.map((item) => ({ item, status: DebtLedger.levelOf(item) }));
  }

  /** Khoản đã thanh toán, mới nhất lên trước. */
  paid(): StudentDebt[] {
    return this.history;
  }

  totalUnpaid(): number {
    return this.summary.outstandingAmount;
  }

  sumBy(status: DebtStatus): number {
    switch (status) {
      case DebtStatus.Overdue:
        return this.summary.overdueAmount;
      case DebtStatus.Due:
        return this.summary.dueSoonAmount;
      case DebtStatus.Upcoming:
        return Math.max(0, this.summary.outstandingAmount - this.summary.overdueAmount - this.summary.dueSoonAmount);
      default:
        return this.summary.paidAmount;
    }
  }

  hasOverdue(): boolean {
    return this.summary.overdueCount > 0;
  }

  private static levelOf(item: StudentDebt): DebtStatus {
    if (item.status === LedgerStatus.Paid) return DebtStatus.Paid;
    if (item.status === LedgerStatus.Overdue) return DebtStatus.Overdue;
    return item.dueSoon ? DebtStatus.Due : DebtStatus.Upcoming;
  }
}
