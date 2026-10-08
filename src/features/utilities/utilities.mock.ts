import { L } from "../../shared/i18n/localized";
import type { Localized } from "../../shared/i18n/types";
import { Formatter } from "../../shared/format";
import type { Tone } from "../../shared/theme";

export type UtilityRange = "day" | "week" | "month";
export type UtilityMetric = "electricity" | "water";

export type UtilitySeries = {
  labels: string[] | "weekdays";
  electricity: number[];
  water: number[];
  electricityTotal: number;
  waterTotal: number;
  changePercent: { electricity: number; water: number };
  caption: Localized;
};

export type UtilityAlert = { id: string; tone: Tone; title: Localized; description: Localized; occurredAt: string };

export type DailyRecord = {
  date: string;
  electricityStart: number;
  electricityEnd: number;
  electricity: number;
  waterStart: number;
  waterEnd: number;
  water: number;
  cost: number;
  averageKw: number;
  peakKw: number;
  averageLiterPerHour: number;
  peakLiterPerHour: number;
};

const ELECTRICITY_PRICE = 2_370;
const WATER_PRICE = 10_000;

export class UtilityRepository {
  private static readonly series: Record<UtilityRange, UtilitySeries> = {
    day: {
      labels: ["0h", "6h", "12h", "18h", "24h"],
      electricity: [0.4, 0.2, 0.15, 0.3, 0.9, 1.6, 1.1, 0.9, 1.3, 2.2, 2.5, 1.7, 1.2],
      water: [20, 12, 9, 40, 145, 275, 105, 24, 18, 115, 285, 130, 42],
      electricityTotal: 2.4,
      waterTotal: 0.31,
      changePercent: { electricity: 8, water: -4 },
      caption: L("Hôm nay, 08/10/2026", "Today, 10/08/2026"),
    },
    week: {
      labels: "weekdays",
      electricity: [1.9, 2.2, 1.8, 2.6, 2.3, 3.1, 2.4],
      water: [0.24, 0.29, 0.22, 0.33, 0.27, 0.38, 0.31],
      electricityTotal: 16.3,
      waterTotal: 2.04,
      changePercent: { electricity: 5, water: 11 },
      caption: L("02/10 – 08/10/2026", "10/02 – 10/08/2026"),
    },
    month: {
      labels: ["01", "08", "15", "22", "30"],
      electricity: [1.6, 1.9, 1.7, 2.1, 1.5, 1.8, 2.4, 2.0, 1.7, 1.9, 2.2, 1.6, 1.8, 2.3, 1.9],
      water: [0.26, 0.3, 0.28, 0.33, 0.24, 0.27, 0.36, 0.31, 0.29, 0.25, 0.32, 0.28, 0.3, 0.34, 0.29],
      electricityTotal: 52.4,
      waterTotal: 8.6,
      changePercent: { electricity: -12, water: 18 },
      caption: L("Tháng 09/2026", "September 2026"),
    },
  };

  private static readonly alertRecords: UtilityAlert[] = [
    {
      id: "a1",
      tone: "danger",
      title: L("Điện tăng bất thường", "Unusual power spike"),
      description: L(
        "Lúc 21:15 công suất phòng cao gấp 2,3 lần trung bình. Kiểm tra thiết bị đang bật.",
        "At 21:15 your room drew 2.3× the usual power. Check which devices are on.",
      ),
      occurredAt: "2026-10-07T21:15:00+07:00",
    },
    {
      id: "a2",
      tone: "warning",
      title: L("Lượng nước tăng 18%", "Water use up 18%"),
      description: L("Tháng này phòng dùng nhiều nước hơn tháng trước. Hãy khoá vòi khi không sử dụng.", "Your room used more water than last month. Turn taps off when not in use."),
      occurredAt: "2026-10-05T09:30:00+07:00",
    },
    {
      id: "a3",
      tone: "success",
      title: L("Không phát hiện rò rỉ", "No leaks detected"),
      description: L("Cảm biến không ghi nhận dòng nước chảy liên tục vào ban đêm.", "Sensors saw no continuous water flow overnight."),
      occurredAt: "2026-10-04T06:00:00+07:00",
    },
  ];

  static readonly comparison = { electricity: { room: 52.4, average: 45 }, water: { room: 8.6, average: 7 } };
  static readonly meters = { electricity: 1277.2, water: 325.1, updatedAt: "2026-10-08T08:55:00+07:00" };
  static readonly calendarMonth = "2026-09";

  private static readonly monthRecords: DailyRecord[] = UtilityRepository.buildMonth(UtilityRepository.calendarMonth, 30, 52.4, 8.6, 1224.8, 316.5);

  static get(range: UtilityRange): UtilitySeries {
    return UtilityRepository.series[range];
  }

  /** Nhãn 7 ngày gần nhất (02/10 → 08/10/2026) theo ngôn ngữ đang chọn. */
  static weekLabels(): string[] {
    return Array.from({ length: 7 }, (_, index) => Formatter.weekday(new Date(2026, 9, 2 + index)));
  }

  static alerts(): UtilityAlert[] {
    return UtilityRepository.alertRecords;
  }

  static cost(metric: UtilityMetric, amount: number): number {
    return Math.round(amount * (metric === "electricity" ? ELECTRICITY_PRICE : WATER_PRICE));
  }

  static unitPrice(metric: UtilityMetric): number {
    return metric === "electricity" ? ELECTRICITY_PRICE : WATER_PRICE;
  }

  /** Bản ghi từng ngày của tháng để vẽ lịch nhiệt và xem chi tiết chỉ số. */
  static month(): DailyRecord[] {
    return UtilityRepository.monthRecords;
  }

  private static buildMonth(month: string, days: number, electricityTotal: number, waterTotal: number, electricityStart: number, waterStart: number): DailyRecord[] {
    const eWeights = Array.from({ length: days }, (_, i) => 2.8 + ((i * 7) % 11) * 0.55);
    const wWeights = Array.from({ length: days }, (_, i) => 0.18 + ((i * 5) % 9) * 0.045);
    const eSum = eWeights.reduce((a, b) => a + b, 0);
    const wSum = wWeights.reduce((a, b) => a + b, 0);
    let e = electricityStart;
    let w = waterStart;
    return eWeights.map((weight, i) => {
      const electricity = Number(((weight / eSum) * electricityTotal).toFixed(2));
      const water = Number(((wWeights[i] / wSum) * waterTotal).toFixed(3));
      const record: DailyRecord = {
        date: `${month}-${String(i + 1).padStart(2, "0")}`,
        electricityStart: Number(e.toFixed(2)),
        electricityEnd: Number((e + electricity).toFixed(2)),
        electricity,
        waterStart: Number(w.toFixed(3)),
        waterEnd: Number((w + water).toFixed(3)),
        water,
        cost: Math.round(electricity * ELECTRICITY_PRICE + water * WATER_PRICE),
        averageKw: Number((electricity / 24).toFixed(2)),
        peakKw: Number((electricity * 0.14).toFixed(2)),
        averageLiterPerHour: Number(((water * 1000) / 24).toFixed(1)),
        peakLiterPerHour: Number((water * 1000 * 0.16).toFixed(1)),
      };
      e += electricity;
      w += water;
      return record;
    });
  }
}
