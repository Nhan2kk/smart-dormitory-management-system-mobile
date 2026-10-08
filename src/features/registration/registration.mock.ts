import { L } from "../../shared/i18n/localized";
import type { Localized } from "../../shared/i18n/types";

export type RoomStatus = "available" | "full" | "maintenance";
export type BedStatus = "available" | "occupied" | "reserved" | "maintenance";
export type PricingPeriod = "sixMonths" | "oneYear";
export type ApplicationStatus = "completed" | "pending_payment" | "approved" | "cancelled" | "expired";

export type Bed = { code: string; level: 1 | 2; status: BedStatus };
export type Room = { code: string; capacity: number; available: number; status: RoomStatus; price: number; gender: "male" | "female"; beds: Bed[] };
export type Floor = { number: number; rooms: Room[] };
export type Building = { id: string; description: Localized; floors: Floor[] };
export type Application = { id: string; campaign: Localized; place: string; amount: number; createdAt: string; status: ApplicationStatus };

export const roomStatusTone: Record<RoomStatus, "success" | "danger" | "neutral"> = { available: "success", full: "danger", maintenance: "neutral" };
export const applicationTone: Record<ApplicationStatus, "success" | "warning" | "neutral" | "danger" | "info"> = {
  completed: "neutral",
  pending_payment: "warning",
  approved: "success",
  cancelled: "neutral",
  expired: "danger",
};

/** Sinh dữ liệu phòng/giường giả lập ổn định cho luồng đăng ký KTX. */
export class RegistrationRepository {
  static readonly campaign = {
    name: L("Đăng ký KTX học kỳ II · 2026–2027", "Dorm registration · Semester II 2026–2027"),
    audience: L("Sinh viên năm 1, năm 2", "1st & 2nd-year students"),
    registration: "15/10 – 30/10/2026",
    checkIn: "05/01 – 12/01/2027",
    instructions: L("Mang CCCD và biên lai thanh toán đến văn phòng BQL tòa nhà để nhận phòng.", "Bring your ID card and payment receipt to the building office to check in."),
  };

  static readonly months: Record<PricingPeriod, number> = { sixMonths: 6, oneYear: 12 };

  static readonly applications: Application[] = [
    { id: "DK-2025-3321", campaign: L("Học kỳ I · 2025–2026", "Semester I · 2025–2026"), place: "B205 · G03", amount: 3_300_000, createdAt: "2025-08-20T10:00:00+07:00", status: "completed" },
    { id: "DK-2025-2190", campaign: L("Học kỳ I · 2025–2026", "Semester I · 2025–2026"), place: "C301 · G05", amount: 2_280_000, createdAt: "2025-08-18T08:30:00+07:00", status: "expired" },
  ];

  private static readonly data: Building[] = RegistrationRepository.build();

  static buildings(): Building[] {
    return RegistrationRepository.data;
  }

  static availableBeds(building: Building): number {
    return building.floors.reduce((sum, floor) => sum + RegistrationRepository.floorAvailability(floor), 0);
  }

  static floorAvailability(floor: Floor): number {
    return floor.rooms.reduce((sum, room) => sum + room.available, 0);
  }

  private static build(): Building[] {
    const specs = [
      { id: "A", description: L("Gần giảng đường, nhà ăn", "Near lecture halls & canteen"), price: 450_000, capacity: 8, gender: "male" as const },
      { id: "B", description: L("Phòng 6 người, có ban công", "6-bed rooms with balcony"), price: 550_000, capacity: 6, gender: "male" as const },
      { id: "C", description: L("Khu yên tĩnh, gần thư viện", "Quiet area near the library"), price: 380_000, capacity: 8, gender: "female" as const },
      { id: "D", description: L("Phòng 4 người, máy lạnh", "4-bed rooms, air-conditioned"), price: 850_000, capacity: 4, gender: "female" as const },
    ];
    return specs.map((spec, buildingIndex) => ({
      id: spec.id,
      description: spec.description,
      floors: Array.from({ length: 5 }, (_, floorIndex) => {
        const floorNumber = floorIndex + 1;
        return {
          number: floorNumber,
          rooms: Array.from({ length: 6 }, (_, roomIndex) => {
            const seed = (buildingIndex + 1) * 31 + floorNumber * 7 + roomIndex * 13;
            const status: RoomStatus = seed % 11 === 0 ? "maintenance" : seed % 4 === 0 ? "full" : "available";
            const beds: Bed[] = Array.from({ length: spec.capacity }, (_, bedIndex) => {
              const roll = (seed + bedIndex * 5) % 9;
              let bedStatus: BedStatus = roll < 4 ? "occupied" : roll === 4 ? "reserved" : "available";
              if (status === "full") bedStatus = "occupied";
              if (status === "maintenance") bedStatus = "maintenance";
              return { code: String(bedIndex + 1).padStart(2, "0"), level: (bedIndex % 2 === 0 ? 1 : 2) as 1 | 2, status: bedStatus };
            });
            return {
              code: `${spec.id}${floorNumber}${String(roomIndex + 1).padStart(2, "0")}`,
              capacity: spec.capacity,
              available: beds.filter((bed) => bed.status === "available").length,
              status,
              price: spec.price,
              gender: spec.gender,
              beds,
            };
          }),
        };
      }),
    }));
  }
}
