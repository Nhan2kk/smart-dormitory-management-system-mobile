import { L } from "../../shared/i18n/localized";
import type { Localized } from "../../shared/i18n/types";
import { Formatter } from "../../shared/format";

export type ResidencyRecordType = "new" | "room_transfer" | "checkout";
export type RoomTypeKey = "roomEight" | "roomSix" | "roomFour";

export type ResidencyLocation = { building: string; floor: number; room: string; bed: string; roomType: RoomTypeKey };

export type ResidencyHistory = {
  id: string;
  type: ResidencyRecordType;
  location: ResidencyLocation;
  previous?: ResidencyLocation;
  effectiveDate: string;
  endedDate?: string;
  linkedRequest: string;
  active: boolean;
  note?: Localized;
};

export type CurrentResidency = ResidencyLocation & {
  recordCode: string;
  linkedRequest: string;
  checkInDate: string;
  expiryDate: string;
  monthlyFee: number;
  roommates: number;
  capacity: number;
};

export class ResidencyRepository {
  private static readonly currentRecord: CurrentResidency = {
    recordCode: "HS-2026-0412",
    linkedRequest: "CP-2026-0087",
    building: "A",
    floor: 1,
    room: "A101",
    bed: "A101-01",
    roomType: "roomEight",
    checkInDate: "2026-03-02",
    expiryDate: "2027-01-15",
    monthlyFee: 450_000,
    roommates: 6,
    capacity: 8,
  };

  private static readonly historyRecords: ResidencyHistory[] = [
    {
      id: "HS-2026-0412",
      type: "room_transfer",
      location: { building: "A", floor: 1, room: "A101", bed: "A101-01", roomType: "roomEight" },
      previous: { building: "B", floor: 2, room: "B205", bed: "B205-03", roomType: "roomSix" },
      effectiveDate: "2026-03-02",
      linkedRequest: "CP-2026-0087",
      active: true,
      note: L("Chuyển phòng do gần khu học tập hơn.", "Transferred to be closer to the lecture halls."),
    },
    {
      id: "HS-2025-1180",
      type: "new",
      location: { building: "B", floor: 2, room: "B205", bed: "B205-03", roomType: "roomSix" },
      effectiveDate: "2025-09-06",
      endedDate: "2026-03-01",
      linkedRequest: "DK-2025-3321",
      active: false,
    },
  ];

  static current(): CurrentResidency {
    return ResidencyRepository.currentRecord;
  }

  static history(): ResidencyHistory[] {
    return ResidencyRepository.historyRecords;
  }

  static remainingDays(): number {
    const end = new Date(ResidencyRepository.currentRecord.expiryDate);
    return Math.max(0, Math.ceil((end.getTime() - Formatter.now.getTime()) / 86_400_000));
  }

  static progress(): number {
    const start = new Date(ResidencyRepository.currentRecord.checkInDate).getTime();
    const end = new Date(ResidencyRepository.currentRecord.expiryDate).getTime();
    return (Formatter.now.getTime() - start) / (end - start);
  }
}
