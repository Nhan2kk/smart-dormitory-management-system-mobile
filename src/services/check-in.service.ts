import type { ApiClient } from "../shared/api";
import type {
  AssetEvaluation,
  CheckInRecord,
  CheckInSubmitResult,
} from "../models/check-in.model";
import type {
  RoomTransferCreateBody,
  RoomTransferRequest,
} from "../models/request.model";

export class CheckInService {
  constructor(private readonly request: ApiClient) {}

  mine(): Promise<CheckInRecord> {
    return this.request<CheckInRecord>("/student/check-in");
  }

  evaluate(
    recordId: string,
    assetId: string,
    body: AssetEvaluation,
  ): Promise<CheckInRecord> {
    return this.request<CheckInRecord>(
      `/student/check-in/${encodeURIComponent(recordId)}/assets/${encodeURIComponent(assetId)}`,
      { method: "PUT", body },
    );
  }

  submit(recordId: string): Promise<CheckInSubmitResult> {
    return this.request<CheckInSubmitResult>(
      `/student/check-in/${encodeURIComponent(recordId)}/submit`,
      { body: { hasSignature: true } },
    );
  }

  /**
   * Gửi yêu cầu chuyển phòng ngay từ biên bản có tài sản sự cố. BE khoá biên bản ngay sau đó:
   * sinh viên chọn chuyển phòng thay vì nhận phòng này (không sinh yêu cầu bảo trì).
   */
  requestTransfer(
    recordId: string,
    body: Omit<RoomTransferCreateBody, "attachmentIds">,
  ): Promise<RoomTransferRequest> {
    return this.request<RoomTransferRequest>(
      `/student/check-in/${encodeURIComponent(recordId)}/room-transfer-request`,
      { body },
    );
  }
}
