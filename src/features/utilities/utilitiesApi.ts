import type { ApiClient } from "../../shared/api";

// DTO đúng theo backend: POST /student/utilities { month: "YYYY-MM" }.
// Số đo theo từng giờ của phòng hiện tại; `recordedAt` là mốc CUỐI của giờ đo.

export type HourlyElectricity = {
  recordedAt: string;
  metrics?: { startKwh: number; endKwh: number; consumptionKwh: number; avgPowerW: number; peakPowerW: number };
};

export type HourlyWater = {
  recordedAt: string;
  metrics?: { startM3: number; endM3: number; consumptionM3: number; avgFlowRateLpm: number; peakFlowRateLpm: number };
};

/** Trạng thái giá: `HISTORICAL_ROOM_UNVERIFIED` = tháng cũ, không gắn tiền vì sinh viên có thể đã đổi phòng. */
export type PriceStatus = string;

export type StudentMonthlyUsage = {
  roomCode: string;
  electricity: HourlyElectricity[];
  water: HourlyWater[];
  electricityConsumption?: number;
  waterConsumption?: number;
  electricityEstimatedCost: number | null;
  waterEstimatedCost: number | null;
  electricityPriceStatus: PriceStatus;
  waterPriceStatus: PriceStatus;
  calculationBasis: string;
};

export function utilitiesApi(request: ApiClient) {
  return {
    /** Số đo điện nước của phòng trong một tháng (`YYYY-MM`). */
    month: (month: string) => request<StudentMonthlyUsage>("/student/utilities", { body: { month } }),
  };
}
