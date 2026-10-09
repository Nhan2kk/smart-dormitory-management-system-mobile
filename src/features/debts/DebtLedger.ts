import { BillStatus, DebtStatus } from "../../enums/debt.enum";
import type { BillResponse, Debt, PaymentAccount } from "../../models/debt.model";

const DAY = 86_400_000;
/** Còn trong chừng này ngày thì coi là "đến hạn". */
const DUE_WINDOW_DAYS = 7;

/**
 * Tài khoản nhận chuyển khoản của KTX. Backend chưa có API trả tài khoản nhận tiền,
 * nên dùng thông tin cố định (cùng ngân hàng, số tài khoản với web `MOCK_STUDENT_PAYMENT_ACCOUNT`).
 */
export const PAYMENT_ACCOUNT: PaymentAccount = { bank: "Techcombank", accountNumber: "1903 1234 5678 9012", holder: "KY TUC XA DN" };

/** Sổ công nợ của sinh viên dựng từ danh sách hoá đơn: khoản cần trả, đã trả, tổng theo mức hạn. */
export class DebtLedger {
  readonly bills: BillResponse[];
  private readonly debts: Debt[];

  constructor(bills: BillResponse[], now: Date = new Date()) {
    this.bills = [...bills].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    this.debts = this.bills.map((bill) => DebtLedger.toDebt(bill, today));
  }

  /** Khoản chờ thanh toán (kể cả thanh toán lỗi), hạn gần nhất lên trước. */
  unpaid(): Debt[] {
    return this.debts
      .filter((debt) => debt.status !== DebtStatus.Paid && debt.bill.status !== BillStatus.Cancelled)
      .sort((a, b) => (a.daysLeft ?? Number.MAX_SAFE_INTEGER) - (b.daysLeft ?? Number.MAX_SAFE_INTEGER));
  }

  /** Khoản đã thanh toán, mới nhất lên trước. */
  paid(): Debt[] {
    return this.debts.filter((debt) => debt.status === DebtStatus.Paid).sort((a, b) => (b.bill.paidAt ?? "").localeCompare(a.bill.paidAt ?? ""));
  }

  totalUnpaid(): number {
    return this.unpaid().reduce((sum, debt) => sum + debt.bill.amount, 0);
  }

  sumBy(status: DebtStatus): number {
    return this.unpaid()
      .filter((debt) => debt.status === status)
      .reduce((sum, debt) => sum + debt.bill.amount, 0);
  }

  hasOverdue(): boolean {
    return this.unpaid().some((debt) => debt.status === DebtStatus.Overdue);
  }

  /** Nội dung chuyển khoản để BQL đối soát: mã hoá đơn + mã sinh viên. */
  static transferContent(billId: string, studentCode: string | null | undefined): string {
    return `KTXDN ${billId}${studentCode ? ` ${studentCode}` : ""}`;
  }

  private static toDebt(bill: BillResponse, today: number): Debt {
    if (bill.status === BillStatus.Paid) return { bill, status: DebtStatus.Paid, daysLeft: null };
    if (!bill.dueDate) return { bill, status: DebtStatus.Due, daysLeft: null };
    const due = new Date(bill.dueDate);
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const daysLeft = Math.round((dueDay - today) / DAY);
    const status = daysLeft < 0 ? DebtStatus.Overdue : daysLeft <= DUE_WINDOW_DAYS ? DebtStatus.Due : DebtStatus.Upcoming;
    return { bill, status, daysLeft };
  }
}
