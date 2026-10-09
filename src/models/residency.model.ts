import type { ResidencyRecordType } from "../enums/residency.enum";

// ---- Dữ liệu server trả về ----

/** `GET /student/residency-records` — hồ sơ lưu trú hiện hành. */
export interface ResidencyRecordResponse {
  id: string;
  code: string | null;
  studentCode: string | null;
  recordType: ResidencyRecordType;
  buildingId: string | null;
  buildingName: string | null;
  floorId: string | null;
  floorName: string | null;
  roomId: string | null;
  roomCode: string | null;
  bedId: string | null;
  bedCode: string | null;
  oldBuildingName: string | null;
  oldRoomCode: string | null;
  oldBedCode: string | null;
  registrationId: string | null;
  roomTransferRequestId: string | null;
  roomCheckoutRequestId: string | null;
  effectiveDate: string | null;
  endedReason: string | null;
}

/** Một phòng trong `POST /student/facilities/rooms/searchRequest` (chỉ các trường màn lưu trú dùng). */
export interface ResidencyRoomResponse {
  id: string;
  code: string;
  type: string | null;
  capacity: number;
  occupants: number;
  price: number | null;
}

/** Thời hạn ở lấy từ `GET /student/profile`. */
export interface StayPeriodResponse {
  startDate: string | null;
  endDate: string | null;
}

// ---- Dữ liệu cho màn hình ----

export interface ResidencyLocation {
  building: string;
  floor: string | null;
  room: string;
  bed: string;
}

/** Một mốc trong lịch sử lưu trú. */
export interface ResidencyHistory {
  id: string;
  type: ResidencyRecordType;
  location: ResidencyLocation;
  previous?: ResidencyLocation;
  effectiveDate: string | null;
  linkedRequest: string | null;
  active: boolean;
}
