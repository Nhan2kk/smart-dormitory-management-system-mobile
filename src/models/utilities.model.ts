import type { Tone } from "../shared/theme";
import type { UtilityInsightKind } from "../enums/utilities.enum";

export interface HourlyElectricity {
  recordedAt: string;
  metrics?: {
    startKwh: number;
    endKwh: number;
    consumptionKwh: number;
    avgPowerW: number;
    peakPowerW: number;
  };
}

export interface HourlyWater {
  recordedAt: string;
  metrics?: {
    startM3: number;
    endM3: number;
    consumptionM3: number;
    avgFlowRateLpm: number;
    peakFlowRateLpm: number;
  };
}

export type PriceStatus = string;

export interface StudentMonthlyUsage {
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
  /** Mốc bắt đầu xem số đo (giờ nhận phòng hiện tại, làm tròn giờ, ISO UTC). BE cũ không trả trường này. */
  visibleFrom?: string | null;
  visibleFromSource?: "CHECK_IN" | "RESIDENCY_RECORD" | null;
  residencyStatus?: "CHECKED_IN" | "NOT_CHECKED_IN";
}

export interface UtilitySeries {
  labels: string[];
  electricity: number[];
  water: number[];
  electricityTotal: number;
  waterTotal: number;
  changePercent: { electricity: number | null; water: number | null };
  from: string;
  to: string;
}

export interface DailyRecord {
  date: string;
  electricityStart: number;
  electricityEnd: number;
  electricity: number;
  waterStart: number;
  waterEnd: number;
  water: number;
  cost: number | null;
  averageKw: number;
  peakKw: number;
  averageLiterPerHour: number;
  peakLiterPerHour: number;
}

export interface UtilityInsight {
  kind: UtilityInsightKind;
  tone: Tone;
  value: number;
}
