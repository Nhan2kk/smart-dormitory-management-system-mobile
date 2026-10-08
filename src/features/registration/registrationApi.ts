import type { ApiClient } from "../../shared/api";

// ---- DTO đúng theo backend (/student/registration-campaigns, /student/facilities, /student/registrations) ----

export type CampaignState = "OPEN" | "UPCOMING" | "NONE";
export type ScopeType = "ALL_BUILDINGS" | "SELECTED_BUILDINGS";

export type CampaignAudience = {
  audienceCode: string;
  registrationStart: string;
  registrationEnd: string;
  checkInStart: string | null;
  checkInEnd: string | null;
};

export type StudentCampaign = {
  id: string;
  code: string;
  name: string;
  registrationStart: string;
  registrationEnd: string;
  checkInInstructions: string | null;
  scopeType: ScopeType;
  selectedBuildingIds: string[];
  audiences: CampaignAudience[];
  description: string | null;
};

export type StudentCampaignState = { state: CampaignState; message: string | null; campaign: StudentCampaign | null };

type PageResponse<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number; last: boolean };

export type BuildingDto = { id: string; name: string; floors: number; rooms: number; occupiedRooms: number; occupancyRate: number; status: string; baseRoomPrice: number | null };
export type FloorDto = { id: string; name: string; symbol: string | null; buildingId: string; rooms: number; beds: number; occupancyRate: number; status: string; baseRoomPrice: number | null };
export type BedDto = { id: string; code: string; status: string; studentId: string | null; studentName: string | null };
export type RoomDto = {
  id: string;
  code: string;
  buildingId: string;
  floorId: string;
  type: string | null;
  capacity: number;
  hasBunkBeds: boolean;
  occupants: number;
  status: string;
  price: number | null;
  beds: BedDto[];
};

/** Giá trị gửi lên BE cho thời hạn đăng ký. */
export type PricingPeriod = "6months" | "1year";
export const PERIOD_MONTHS: Record<PricingPeriod, number> = { "6months": 6, "1year": 12 };

export type RegistrationStatus = "pending_payment" | "paid" | "approved" | "rejected" | "cancelled" | "expired" | "completed";

export type Registration = {
  id: string;
  campaignId: string | null;
  campaignCode: string | null;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  roomId: string;
  roomCode: string;
  bedId: string;
  bedCode: string;
  pricingPeriod: PricingPeriod;
  totalAmount: number;
  status: RegistrationStatus;
  paymentDeadline: string | null;
  processedNote: string | null;
  createdAt: string;
};

export type RegistrationCreateBody = { campaignId: string; buildingId: string; floorId: string; roomId: string; bedId: string; pricingPeriod: PricingPeriod };

// ---- View model cho UI ----

export type RoomStatus = "available" | "full" | "maintenance";
export type BedStatus = "available" | "occupied" | "reserved" | "maintenance";

export type Bed = { id: string; code: string; level?: 1 | 2; status: BedStatus };
export type Room = { id: string; code: string; floorId: string; type: string | null; capacity: number; available: number; status: RoomStatus; price: number; hasBunkBeds: boolean; beds: Bed[] };
export type Floor = { id: string; name: string; number: number | null; status: string; rooms: Room[] };

export const roomStatusTone: Record<RoomStatus, "success" | "danger" | "neutral"> = { available: "success", full: "danger", maintenance: "neutral" };
export const applicationTone: Record<RegistrationStatus, "success" | "warning" | "neutral" | "danger" | "info"> = {
  pending_payment: "warning",
  paid: "info",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
  expired: "danger",
  completed: "neutral",
};

/** Đăng ký còn hiệu lực chặn việc tạo đăng ký mới (BE trả 409 nếu tạo thêm). */
export const ACTIVE_STATUSES: RegistrationStatus[] = ["pending_payment", "paid", "approved"];

const BED_STATUSES: BedStatus[] = ["available", "occupied", "reserved", "maintenance"];

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
      status: BED_STATUSES.includes(bed.status as BedStatus) ? (bed.status as BedStatus) : "maintenance",
      ...(room.hasBunkBeds ? { level: (index % 2 === 0 ? 1 : 2) as 1 | 2 } : {}),
    }));
  const available = beds.filter((bed) => bed.status === "available").length;
  const status: RoomStatus = room.status === "maintenance" || (beds.length > 0 && beds.every((bed) => bed.status === "maintenance")) ? "maintenance" : available > 0 ? "available" : "full";
  return { id: room.id, code: room.code, floorId: room.floorId, type: room.type, capacity: room.capacity, available, status, price: Number(room.price ?? 0), hasBunkBeds: room.hasBunkBeds, beds };
}

/** Ghép phòng theo tầng, sắp tầng theo số tầng. */
export function groupFloors(floors: FloorDto[], rooms: RoomDto[]): Floor[] {
  return floors
    .map((floor) => ({
      id: floor.id,
      name: floor.name,
      number: floorNumber(floor),
      status: floor.status,
      rooms: rooms
        .filter((room) => room.floorId === floor.id)
        .map(mapRoom)
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    }))
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0) || a.name.localeCompare(b.name));
}

export function floorAvailability(floor: Floor): number {
  return floor.status === "active" || floor.status === "empty" ? floor.rooms.reduce((sum, room) => sum + (room.status === "available" ? room.available : 0), 0) : 0;
}

/** Nhóm đối tượng hiện chỉ có "ALL" (xem FE_REGISTRATION_CAMPAIGN_INTEGRATION.md). */
export function primaryAudience(campaign: StudentCampaign): CampaignAudience | null {
  return campaign.audiences.find((item) => item.audienceCode.toUpperCase() === "ALL") ?? campaign.audiences[0] ?? null;
}

export function isInScope(campaign: StudentCampaign | null, buildingId: string): boolean {
  return !campaign || campaign.scopeType !== "SELECTED_BUILDINGS" || campaign.selectedBuildingIds.includes(buildingId);
}

async function allPages<T>(load: (page: number) => Promise<PageResponse<T>>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 0; page < 50; page++) {
    const result = await load(page);
    items.push(...result.content);
    if (result.last || result.content.length === 0) break;
  }
  return items;
}

export function registrationApi(request: ApiClient) {
  return {
    currentCampaign: () => request<StudentCampaignState>("/student/registration-campaigns/current"),
    buildings: () =>
      allPages((page) => request<PageResponse<BuildingDto>>("/student/facilities/buildings/searchRequest", { body: { page, size: 100, status: "active" } })),
    floors: (buildingId: string) =>
      allPages((page) => request<PageResponse<FloorDto>>("/student/facilities/floors/searchRequest", { body: { page, size: 100, buildingId } })),
    rooms: (buildingId: string) =>
      allPages((page) => request<PageResponse<RoomDto>>("/student/facilities/rooms/searchRequest", { body: { page, size: 100, buildingId } })),
    mine: () => request<Registration>("/student/registrations", { method: "GET" }),
    create: (body: RegistrationCreateBody) => request<Registration>("/student/registrations", { body }),
    pay: (id: string) => request<Registration>(`/student/registrations/${encodeURIComponent(id)}/payment`),
    cancel: (id: string) => request<Registration>(`/student/registrations/${encodeURIComponent(id)}/cancellation`),
  };
}
