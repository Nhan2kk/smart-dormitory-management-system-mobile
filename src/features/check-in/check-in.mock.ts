import { L } from "../../shared/i18n/localized";
import type { Localized } from "../../shared/i18n/types";
import type { IconName } from "../../shared/ui";

export type AssetCondition = "unchecked" | "ok" | "issue";
export type IssueType = "damaged" | "missing" | "notWorking" | "abnormal";

export type HandoverAsset = { id: string; name: Localized; code: string; icon: IconName; quantity: number };
export type AssetReport = { condition: AssetCondition; issueType?: IssueType; note?: string; photos?: number };

export const ISSUE_TYPES: IssueType[] = ["damaged", "missing", "notWorking", "abnormal"];

export class CheckInRepository {
  static readonly registration = {
    code: "DK-2026-4410",
    building: "A",
    floor: 1,
    room: "A101",
    bed: "A101-01",
    stayStartDate: "2026-10-08",
    meters: { electricity: 1277.2, water: 325.1 },
  };

  static readonly assets: HandoverAsset[] = [
    { id: "as1", name: L("Giường tầng + nệm", "Bunk bed + mattress"), code: "GT-A101-01", icon: "bed-outline", quantity: 1 },
    { id: "as2", name: L("Tủ quần áo cá nhân", "Personal wardrobe"), code: "TQA-A101-01", icon: "file-tray-stacked-outline", quantity: 1 },
    { id: "as3", name: L("Bàn học", "Study desk"), code: "BH-A101-01", icon: "desktop-outline", quantity: 1 },
    { id: "as4", name: L("Ghế", "Chair"), code: "GH-A101-01", icon: "cube-outline", quantity: 1 },
    { id: "as5", name: L("Đèn học", "Desk lamp"), code: "DH-A101-01", icon: "bulb-outline", quantity: 1 },
    { id: "as6", name: L("Quạt trần", "Ceiling fan"), code: "QT-A101-02", icon: "sync-outline", quantity: 1 },
    { id: "as7", name: L("Chìa khoá phòng", "Room keys"), code: "CK-A101-01", icon: "key-outline", quantity: 2 },
  ];
}
