import { Platform } from "react-native";
import type { ApiClient } from "../../shared/api";
import type { IconName } from "../../shared/ui";

export type IssueType = "damaged" | "missing" | "notWorking" | "abnormal";
export type AssetCondition = "unchecked" | "ok" | "issue";

export const ISSUE_TYPES: IssueType[] = ["damaged", "missing", "notWorking", "abnormal"];

export type Attachment = { id: string; name: string; size: string; kind: "image" | "document"; url: string };

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
};

export type GeneratedMaintenanceRequest = { id: string; assetId: string; assetName: string; status: string; description: string | null };
export type CheckInSubmitResult = { completedAt: string; maintenanceRequests: GeneratedMaintenanceRequest[] };

export type AssetEvaluation = { status: "ok" } | { status: "issue"; issueType: IssueType; note: string; evidenceAttachmentIds: string[] };

/** Ảnh minh chứng đã chọn: `uri` để xem trước, `id` sau khi upload thành công. */
export type EvidencePhoto = { uri: string; id?: string };

/** Biểu tượng theo loại/tên tài sản (BE chỉ trả chuỗi `category` tự do). */
export function assetIcon(asset: Pick<HandoverAsset, "name" | "category">): IconName {
  const text = `${asset.category ?? ""} ${asset.name}`.toLowerCase();
  const rules: [RegExp, IconName][] = [
    [/giường|nệm|bed|mattress/, "bed-outline"],
    [/tủ|wardrobe|locker|cabinet/, "file-tray-stacked-outline"],
    [/bàn|desk|table/, "desktop-outline"],
    [/ghế|chair/, "cube-outline"],
    [/đèn|lamp|light/, "bulb-outline"],
    [/quạt|fan/, "sync-outline"],
    [/điều hòa|điều hoà|máy lạnh|air/, "snow-outline"],
    [/khoá|khóa|chìa|key|lock/, "key-outline"],
    [/nóng lạnh|bình|heater|water/, "water-outline"],
    [/ổ cắm|điện|socket|electric/, "flash-outline"],
  ];
  return rules.find(([pattern]) => pattern.test(text))?.[1] ?? "construct-outline";
}

export function checkInApi(request: ApiClient) {
  return {
    mine: () => request<CheckInRecord>("/student/check-in", { method: "GET" }),
    evaluate: (recordId: string, assetId: string, body: AssetEvaluation) =>
      request<CheckInRecord>(`/student/check-in/${encodeURIComponent(recordId)}/assets/${encodeURIComponent(assetId)}`, { method: "PUT", body }),
    submit: (recordId: string) => request<CheckInSubmitResult>(`/student/check-in/${encodeURIComponent(recordId)}/submit`, { body: { hasSignature: true } }),
    /** Upload ảnh lên `/attachments` (multipart, field `file`). */
    upload: async (uri: string) => {
      const name = uri.split("/").pop()?.split("?")[0] || `evidence-${Date.now()}.jpg`;
      const form = new FormData();
      if (Platform.OS === "web") {
        const blob = await (await fetch(uri)).blob();
        form.append("file", blob, name.includes(".") ? name : `${name}.jpg`);
      } else {
        const type = /\.png$/i.test(name) ? "image/png" : "image/jpeg";
        form.append("file", { uri, name, type } as unknown as Blob);
      }
      return request<Attachment>("/attachments", { form });
    },
  };
}
