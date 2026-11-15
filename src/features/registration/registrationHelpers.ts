import type {
  BedStatus,
  PricingPeriod,
  RegistrationStatus,
  RoomStatus,
} from "../../enums/registration.enum";
import type {
  Bed,
  CampaignAudience,
  Floor,
  BuildingDto,
  FloorDto,
  Room,
  RoomDto,
  StudentCampaign,
} from "../../models/registration.model";

export const PERIOD_MONTHS: Record<PricingPeriod, number> = {
  "6months": 6,
  "1year": 12,
};

export const roomStatusTone: Record<
  RoomStatus,
  "success" | "danger" | "neutral"
> = { available: "success", full: "danger", maintenance: "neutral" };
export const applicationTone: Record<
  RegistrationStatus,
  "success" | "warning" | "neutral" | "danger" | "info"
> = {
  pending_payment: "warning",
  paid: "info",
  approved: "success",
  cancelled: "neutral",
  expired: "danger",
  completed: "neutral",
};

/** Đăng ký còn hiệu lực chặn việc tạo đăng ký mới (BE trả 409 nếu tạo thêm). */
export const ACTIVE_STATUSES: RegistrationStatus[] = [
  "pending_payment",
  "paid",
  "approved",
];

const BED_STATUSES: BedStatus[] = [
  "available",
  "occupied",
  "reserved",
  "maintenance",
];

function floorNumber(floor: FloorDto): number | null {
  const match = (floor.symbol ?? "").match(/\d+/) ?? floor.name.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

export function mapRoom(room: RoomDto): Room {
  const beds: Bed[] = [...room.beds]
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    .map((bed, index) => ({
      id: bed.id,
      code: bed.code,
      status: BED_STATUSES.includes(bed.status as BedStatus)
        ? (bed.status as BedStatus)
        : "maintenance",
      ...(room.hasBunkBeds
        ? { level: (index % 2 === 0 ? 1 : 2) as 1 | 2 }
        : {}),
    }));
  const available = beds.filter((bed) => bed.status === "available").length;
  const status: RoomStatus =
    room.status === "maintenance" ||
    (beds.length > 0 && beds.every((bed) => bed.status === "maintenance"))
      ? "maintenance"
      : available > 0
        ? "available"
        : "full";
  return {
    id: room.id,
    code: room.code,
    floorId: room.floorId,
    type: room.type,
    capacity: room.capacity,
    available,
    status,
    price: Number(room.price ?? 0),
    hasBunkBeds: room.hasBunkBeds,
    beds,
  };
}

/** Ghép phòng theo tầng, sắp tầng theo số tầng. */
export function groupFloors(floors: FloorDto[], rooms: RoomDto[]): Floor[] {
  return floors
    .map((floor) => ({
      id: floor.id,
      name: floor.name,
      number: floorNumber(floor),
      status: floor.status,
      gender: floor.gender ?? null,
      rooms: rooms
        .filter((room) => room.floorId === floor.id)
        .map(mapRoom)
        .sort((a, b) =>
          a.code.localeCompare(b.code, undefined, { numeric: true }),
        ),
    }))
    .sort(
      (a, b) =>
        (a.number ?? 0) - (b.number ?? 0) ||
        a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
}

function withBeds(room: Room, beds: Bed[]): Room {
  const available = beds.filter((bed) => bed.status === "available").length;
  const status: RoomStatus =
    room.status === "maintenance"
      ? "maintenance"
      : available > 0
        ? "available"
        : "full";
  return { ...room, beds, available, status };
}

/** Sự kiện realtime đổi trạng thái giường (đặt/huỷ/nhận phòng…): cập nhật sơ đồ đang xem. */
export function applyBedStatus(
  floors: Floor[],
  roomId: string,
  bedId: string,
  status: BedStatus,
): Floor[] {
  return floors.map((floor) =>
    floor.rooms.some((room) => room.id === roomId)
      ? {
          ...floor,
          rooms: floor.rooms.map((room) =>
            room.id === roomId
              ? withBeds(
                  room,
                  room.beds.map((bed) =>
                    bed.id === bedId ? { ...bed, status } : bed,
                  ),
                )
              : room,
          ),
        }
      : floor,
  );
}

/** Giường người khác đang giữ hiển thị như "đã giữ chỗ" và không tính là còn trống. */
export function withHolds(
  room: Room,
  heldBedIds: Set<string>,
  myHoldBedId: string | null,
  preBookable: Record<string, string> = {},
): Room {
  const heldByOther = (bed: Bed) =>
    (bed.status === "available" || Boolean(preBookable[bed.id])) &&
    heldBedIds.has(bed.id) &&
    bed.id !== myHoldBedId;
  if (!room.beds.some((bed) => heldByOther(bed) || preBookable[bed.id]))
    return room;
  // Giường đặt trước được (sẽ trống trước kỳ) hiển thị như giường trống kèm "Trống từ ngày …".
  return withBeds(
    room,
    room.beds.map((bed) =>
      heldByOther(bed)
        ? { ...bed, status: "reserved" as const, availableFrom: undefined }
        : preBookable[bed.id]
          ? { ...bed, status: "available" as const, availableFrom: preBookable[bed.id] }
          : bed,
    ),
  );
}

export function floorAvailability(floor: Floor): number {
  return floor.status === "active" || floor.status === "empty"
    ? floor.rooms.reduce(
        (sum, room) => sum + (room.status === "available" ? room.available : 0),
        0,
      )
    : 0;
}

/** Nhóm đối tượng hiện chỉ có "ALL" (xem FE_REGISTRATION_CAMPAIGN_INTEGRATION.md). */
export function primaryAudience(
  campaign: StudentCampaign,
): CampaignAudience | null {
  return (
    campaign.audiences.find(
      (item) => item.audienceCode.toUpperCase() === "ALL",
    ) ??
    campaign.audiences[0] ??
    null
  );
}

export function isInScope(
  campaign: StudentCampaign | null,
  buildingId: string,
): boolean {
  return (
    !campaign ||
    campaign.scopeType !== "SELECTED_BUILDINGS" ||
    campaign.selectedBuildingIds.includes(buildingId)
  );
}

/** Khu/tầng không phân khu, hoặc hồ sơ chưa có giới tính (để BE quyết định), thì cho đăng ký. */
export function genderAllows(
  studentGender: string | null | undefined,
  areaGender: string | null | undefined,
): boolean {
  return !areaGender || !studentGender || areaGender === studentGender;
}

/** Tòa chỉ dành cho một giới tính khác thì không đăng ký được; tòa "mixed" còn tầng hợp giới tính. */
export function buildingGender(building: BuildingDto): string | null {
  const value = building.gender ?? building.genderSummary ?? null;
  return value === "male" || value === "female" ? value : null;
}
