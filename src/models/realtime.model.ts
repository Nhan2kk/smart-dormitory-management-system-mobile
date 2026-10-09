import type { IncidentSeverity, IncidentStatus } from "../enums/realtime.enum";

export interface RoomIncident {
  id: string;
  roomCode: string;
  type: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  lastDetectedAt: string;
  reasons: string[];
}

export interface TelemetryUpdate {
  rooms: { roomCode: string; recordedAt: string }[];
  publishedAt: string;
}
