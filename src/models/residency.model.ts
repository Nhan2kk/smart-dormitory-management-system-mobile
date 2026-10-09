import type { ResidencyRecordType } from "../enums/residency.enum";

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

export interface ResidencyRoomResponse {
  id: string;
  code: string;
  type: string | null;
  capacity: number;
  occupants: number;
  price: number | null;
}

export interface StayPeriodResponse {
  startDate: string | null;
  endDate: string | null;
}

export interface ResidencyLocation {
  building: string;
  floor: string | null;
  room: string;
  bed: string;
}

export interface ResidencyHistory {
  id: string;
  type: ResidencyRecordType;
  location: ResidencyLocation;
  previous?: ResidencyLocation;
  effectiveDate: string | null;
  linkedRequest: string | null;
  active: boolean;
}
