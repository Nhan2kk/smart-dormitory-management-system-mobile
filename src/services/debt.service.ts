import type { ApiClient } from "../shared/api";
import type { BillPageResponse, BillPayRequest, BillResponse } from "../models/debt.model";

const PAGE_SIZE = 100;
/** Chặn vòng lặp nếu BE trả sai cờ `last`. */
const MAX_PAGES = 20;

/** Gọi API hoá đơn của sinh viên (không đổi hợp đồng backend). */
export class DebtService {
  constructor(private readonly request: ApiClient) {}

  /** Toàn bộ hoá đơn của sinh viên (gộp các trang). */
  async mine(): Promise<BillResponse[]> {
    const bills: BillResponse[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await this.request<BillPageResponse>(`/student/bills?page=${page}&size=${PAGE_SIZE}`, { method: "GET" });
      bills.push(...result.content);
      if (result.last || result.content.length < PAGE_SIZE) break;
    }
    return bills;
  }

  get(id: string): Promise<BillResponse> {
    return this.request<BillResponse>(`/student/bills/${encodeURIComponent(id)}`, { method: "GET" });
  }

  /** Xác nhận đã chuyển khoản; BE đánh dấu hoá đơn đã thanh toán. */
  pay(id: string, body: BillPayRequest = { paymentMethod: "bank_transfer" }): Promise<BillResponse> {
    return this.request<BillResponse>(`/student/bills/${encodeURIComponent(id)}/payment`, { body });
  }
}
