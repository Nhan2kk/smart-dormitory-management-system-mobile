import type { ApiClient } from "../shared/api";
import type { RequestKind } from "../enums/request.enum";
import type {
  Bill,
  PricePreview,
  RequestPageResponse,
  RequestSummary,
  Residency,
  RoomCheckoutCreateBody,
  RoomCheckoutRequest,
  RoomTransferCreateBody,
  RoomTransferRequest,
  SupportCreateBody,
  SupportMaintenanceRequest,
} from "../models/request.model";

const q = encodeURIComponent;

export class RequestService {
  constructor(private readonly request: ApiClient) {}

  /** Danh sách tổng hợp mọi loại yêu cầu của tôi, mới nhất trước. */
  async mine(kind?: RequestKind): Promise<RequestSummary[]> {
    const page = await this.request<RequestPageResponse<RequestSummary>>(
      "/student/requests/search",
      { body: { page: 0, size: 100, ...(kind ? { kind } : {}) } },
    );
    return page.content;
  }

  residency(): Promise<Residency> {
    return this.request<Residency>("/student/residency-records");
  }

  transfer(id: string): Promise<RoomTransferRequest> {
    return this.request<RoomTransferRequest>(
      "/student/room-transfer-requests/detail",
      { body: { id } },
    );
  }

  createTransfer(body: RoomTransferCreateBody): Promise<RoomTransferRequest> {
    return this.request<RoomTransferRequest>(
      "/student/room-transfer-requests",
      { body },
    );
  }

  previewTransferPrice(desiredRoomId: string): Promise<PricePreview> {
    return this.request<PricePreview>(
      "/student/room-transfer-requests/price-preview",
      { body: { desiredRoomId } },
    );
  }

  checkout(id: string): Promise<RoomCheckoutRequest> {
    return this.request<RoomCheckoutRequest>(
      "/student/room-checkout-requests/detail",
      { body: { id } },
    );
  }

  createCheckout(body: RoomCheckoutCreateBody): Promise<RoomCheckoutRequest> {
    return this.request<RoomCheckoutRequest>(
      "/student/room-checkout-requests",
      { body },
    );
  }

  support(id: string): Promise<SupportMaintenanceRequest> {
    return this.request<SupportMaintenanceRequest>(
      "/student/maintenance-requests/detail",
      { body: { id } },
    );
  }

  createSupport(body: SupportCreateBody): Promise<SupportMaintenanceRequest> {
    return this.request<SupportMaintenanceRequest>(
      "/student/maintenance-requests",
      { body },
    );
  }

  /** Sinh viên xác nhận kết quả sửa chữa (chỉ khi `repaired`). */
  confirmSupport(
    id: string,
    body: {
      result: "done" | "not_done";
      note?: string;
      attachmentIds?: string[];
    },
  ): Promise<SupportMaintenanceRequest> {
    return this.request<SupportMaintenanceRequest>(
      `/student/maintenance-requests/${q(id)}/confirmation`,
      { method: "PUT", body },
    );
  }

  payBill(id: string): Promise<Bill> {
    return this.request<Bill>(`/student/bills/${q(id)}/payment`, {
      body: { paymentMethod: "bank_transfer" },
    });
  }
}
