import type { ApiClient } from "../shared/api";
import type { DebtGroup } from "../enums/debt.enum";
import type {
  BillPageResponse,
  BillPaymentQr,
  BillPaymentStatus,
  BillResponse,
  StudentDebt,
  StudentDebtPage,
  StudentDebtSummary,
} from "../models/debt.model";

const PAGE_SIZE = 100;
/** Chặn vòng lặp nếu BE trả sai cờ `last`. */
const MAX_PAGES = 20;

/** Gọi API công nợ và hoá đơn của sinh viên. */
export class DebtService {
  constructor(private readonly request: ApiClient) {}

  /** Tổng hợp công nợ: còn nợ, quá hạn, đến hạn 7 ngày, đã trả. */
  summary(): Promise<StudentDebtSummary> {
    return this.request<StudentDebtSummary>("/student/debts/summary");
  }

  /** Mọi khoản thuộc một nhóm (gộp các trang); BE đã sắp xếp: quá hạn và hạn gần nhất lên trước. */
  async debts(group: DebtGroup): Promise<StudentDebt[]> {
    const items: StudentDebt[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await this.request<StudentDebtPage>("/student/debts/search", {
        body: { page, size: PAGE_SIZE, group },
      });
      items.push(...result.content);
      if (result.last || result.content.length < PAGE_SIZE) break;
    }
    return items;
  }

  /** Toàn bộ hoá đơn của sinh viên (gộp các trang), kể cả hoá đơn đã huỷ. */
  async bills(): Promise<BillResponse[]> {
    const bills: BillResponse[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await this.request<BillPageResponse>(
        "/student/bills/search",
        { body: { page, size: PAGE_SIZE } },
      );
      bills.push(...result.content);
      if (result.last || result.content.length < PAGE_SIZE) break;
    }
    return bills;
  }

  /** Lấy QR SePay còn hạn hoặc tạo QR mới (15 phút) để trả hoá đơn. */
  initPayment(billId: string): Promise<BillPaymentQr> {
    return this.request<BillPaymentQr>(
      `/student/bills/${encodeURIComponent(billId)}/payment-init`,
    );
  }

  paymentStatus(billId: string): Promise<BillPaymentStatus> {
    return this.request<BillPaymentStatus>(
      `/student/bills/${encodeURIComponent(billId)}/payment-status`,
    );
  }
}

