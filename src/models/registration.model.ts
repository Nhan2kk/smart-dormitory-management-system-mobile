import type { BedStatus, CampaignState, PricingPeriod, RegistrationStatus, RoomStatus, ScopeType } from "../enums/registration.enum";

export interface CampaignAudience {
  audienceCode: string;
  registrationStart: string;
  registrationEnd: string;
  checkInStart: string | null;
  checkInEnd: string | null;
}

export interface StudentCampaign {
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
}

export interface StudentCampaignState {
  state: CampaignState;
  message: string | null;
  campaign: StudentCampaign | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface BuildingDto {
  id: string;
  name: string;
  floors: number;
  rooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  status: string;
  baseRoomPrice: number | null;
}

export interface FloorDto {
  id: string;
  name: string;
  symbol: string | null;
  buildingId: string;
  rooms: number;
  beds: number;
  occupancyRate: number;
  status: string;
  baseRoomPrice: number | null;
}

export interface BedDto {
  id: string;
  code: string;
  status: string;
  studentId: string | null;
  studentName: string | null;
}

export interface RoomDto {
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
}

export interface Registration {
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
}

export interface RegistrationCreateBody {
  campaignId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  bedId: string;
  pricingPeriod: PricingPeriod;
}

export interface Bed {
  id: string;
  code: string;
  level?: 1 | 2;
  status: BedStatus;
}

export interface Room {
  id: string;
  code: string;
  floorId: string;
  type: string | null;
  capacity: number;
  available: number;
  status: RoomStatus;
  price: number;
  hasBunkBeds: boolean;
  beds: Bed[];
}

export interface Floor {
  id: string;
  name: string;
  number: number | null;
  status: string;
  rooms: Room[];
}
