import type { Attachment } from "../shared/attachments";
import type { AssetCondition, IssueType } from "../enums/check-in.enum";

export type HandoverAsset = {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  status: AssetCondition;
  note: string | null;
  issueType: IssueType | null;
  evidence: Attachment[];
};

export type CheckInRecord = {
  id: string;
  registrationId: string;
  roomCode: string;
  bedCode: string;
  building: string;
  floor: string;
  roomType: string | null;
  expectedCheckInDate: string | null;
  stayStartDate: string | null;
  status: "pending" | "completed" | "cancelled";
  assets: HandoverAsset[];
  initialElectricity: number | null;
  initialWater: number | null;
  lockedAt: string | null;
  checkInType: "registration" | "room_transfer" | null;
  /** Đơn theo kỳ lưu trú: nhận phòng từ ngày này (= ngày bắt đầu ở). */
  availableFrom?: string | null;
  /** false khi chưa tới ngày bắt đầu ở hoặc giường chưa bàn giao. */
  canSubmit?: boolean;
  bedHandoverPending?: boolean;
};

export type GeneratedMaintenanceRequest = {
  id: string;
  assetId: string;
  assetName: string;
  status: string;
  description: string | null;
};
export type CheckInSubmitResult = {
  completedAt: string;
  maintenanceRequests: GeneratedMaintenanceRequest[];
};

export type AssetEvaluation =
  | { status: "ok" }
  | {
      status: "issue";
      issueType: IssueType;
      note: string;
      evidenceAttachmentIds: string[];
    };
