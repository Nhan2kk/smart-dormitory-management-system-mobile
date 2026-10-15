import type { ApiClient } from "../shared/api";
import type {
  RoomUtilityAccount,
  RoomUtilityBill,
  RoomUtilityHandover,
} from "../models/room-utility.model";
import type { BillPaymentQr } from "../models/debt.model";
export class RoomUtilityService {
  constructor(private readonly request: ApiClient) {}
  mine() {
    return this.request<RoomUtilityAccount | null>(
      "/student/room-utilities/mine",
    );
  }
  bills() {
    return this.request<RoomUtilityBill[]>("/student/room-utilities/search", {
      body: { debtOnly: false },
    });
  }
  propose(roomId: string, studentId: string) {
    return this.request<RoomUtilityAccount>("/student/room-utilities/propose", {
      body: { roomId, studentId },
    });
  }
  cancel(roomId: string) {
    return this.request<RoomUtilityAccount>("/student/room-utilities/cancel", {
      body: { roomId },
    });
  }
  respond(roomId: string, accept: boolean) {
    return this.request<RoomUtilityAccount>(
      "/student/room-utilities/" + (accept ? "accept" : "reject"),
      { body: { roomId } },
    );
  }
  history(roomId: string) {
    return this.request<RoomUtilityHandover[]>(
      "/student/room-utilities/history",
      { body: { roomId } },
    );
  }
  payment(id: string) {
    return this.request<BillPaymentQr>("/student/room-utilities/payment", {
      body: { id },
    });
  }
  status(id: string) {
    return this.request<{
      billStatus: string;
      qrExpiresAt: string | null;
      serverTime: string;
    }>("/student/room-utilities/payment-status", { body: { id } });
  }
}
