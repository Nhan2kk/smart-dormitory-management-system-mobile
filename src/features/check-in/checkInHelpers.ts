import type { IconName } from "../../shared/ui";
import { IssueType } from "../../enums/check-in.enum";
import type { HandoverAsset } from "../../models/check-in.model";

export const ISSUE_TYPES: IssueType[] = Object.values(IssueType);

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
