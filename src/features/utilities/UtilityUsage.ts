import type { UtilityMetric, UtilityRange } from "../../enums/utilities.enum";
import type { DailyRecord, StudentMonthlyUsage, UtilityInsight, UtilitySeries } from "../../models/utilities.model";

/** Một điểm trên trục thời gian: tổng điện (kWh) và nước (m³) của giờ/ngày đó. */
type Amount = { electricity: number; water: number };

/** Ngưỡng % thay đổi so với cùng kỳ tháng trước để coi là đáng chú ý. */
const NOTABLE_CHANGE = 15;
const HOUR = 3_600_000;
/** Việt Nam cố định UTC+7 (không đổi giờ mùa hè) nên cộng thẳng offset thay vì dùng Intl. */
const VIETNAM_OFFSET = 7 * HOUR;

type Reading = {
  /** Ngày và giờ (0–23) của giờ đo theo giờ Việt Nam; mốc cuối 00:00 thuộc ngày hôm trước. */
  date: string;
  hour: number;
  recordedAt: string;
  amount: number;
  start: number;
  end: number;
  averageRate: number;
  peakRate: number;
};

/**
 * Tổng hợp số đo theo giờ của tháng hiện tại và tháng trước (API `/student/utilities`)
 * thành số liệu cho màn Điện & nước: biểu đồ ngày/tuần/tháng, lịch theo ngày, tiền ước tính,
 * chỉ số đồng hồ và các nhận xét rút ra từ dữ liệu.
 */
export class UtilityUsage {
  readonly roomCode: string;
  /** Tháng hiện tại theo giờ Việt Nam (yyyy-MM). */
  readonly month: string;
  private readonly today: string;
  private readonly electricity: Reading[];
  private readonly water: Reading[];
  private readonly current: StudentMonthlyUsage;
  /** Sinh viên có phòng nhưng chưa hoàn tất biên bản nhận phòng: không có số đo nào thuộc về mình. */
  readonly notCheckedIn: boolean;
  /** Mốc bắt đầu xem số đo (ISO); null khi BE cũ không trả hoặc chưa nhận phòng. */
  readonly visibleFrom: string | null;
  /** Mốc là lúc phòng có người nhận đầu tiên (điện nước tính theo phòng), không phải ngày mình nhận. */
  readonly roomWide: boolean;
  /** Ngày (giờ Việt Nam) bắt đầu ở; các ngày trước đó không phải "thiếu số đo". */
  readonly firstStayDate: string | null;

  constructor(current: StudentMonthlyUsage, previous: StudentMonthlyUsage | null, now: Date = new Date()) {
    const local = UtilityUsage.local(now.getTime());
    this.current = current;
    this.roomCode = current.roomCode;
    this.today = local.date;
    this.month = local.date.slice(0, 7);
    this.notCheckedIn = current.residencyStatus === "NOT_CHECKED_IN";
    this.roomWide = current.visibleFromSource === "ROOM_CHECK_IN";
    const visibleFrom = [current.visibleFrom, previous?.visibleFrom]
      .map((value) => (value ? Date.parse(value) : NaN))
      .filter(Number.isFinite)
      .sort((a, b) => b - a)[0];
    this.visibleFrom = visibleFrom == null || this.notCheckedIn ? null : new Date(visibleFrom).toISOString();
    // Giờ đo đầu tiên là (visibleFrom, visibleFrom + 1h] nên thuộc cùng ngày với visibleFrom.
    this.firstStayDate = this.visibleFrom == null ? null : UtilityUsage.local(visibleFrom).date;
    // BE đã lọc; chặn thêm số đo có khoảng đo chưa nằm hẳn sau mốc vào ở.
    const afterStay = (recordedAt: string) =>
      !this.notCheckedIn && (visibleFrom == null || Date.parse(recordedAt) > visibleFrom);
    this.electricity = [...(previous?.electricity ?? []), ...current.electricity]
      .flatMap((row) =>
        row.metrics && afterStay(row.recordedAt)
          ? [UtilityUsage.reading(row.recordedAt, row.metrics.consumptionKwh, row.metrics.startKwh, row.metrics.endKwh, row.metrics.avgPowerW / 1000, row.metrics.peakPowerW / 1000)]
          : [],
      )
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    this.water = [...(previous?.water ?? []), ...current.water]
      .flatMap((row) =>
        row.metrics && afterStay(row.recordedAt)
          ? [UtilityUsage.reading(row.recordedAt, row.metrics.consumptionM3, row.metrics.startM3, row.metrics.endM3, row.metrics.avgFlowRateLpm * 60, row.metrics.peakFlowRateLpm * 60)]
          : [],
      )
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  }

  get hasData(): boolean {
    return this.electricity.some((row) => row.date.startsWith(this.month)) || this.water.some((row) => row.date.startsWith(this.month));
  }

  /** Tiền ước tính cả tháng hiện tại do BE tính theo bảng giá; null khi chưa có giá. */
  get monthCost(): { electricity: number | null; water: number | null } {
    return { electricity: this.current.electricityEstimatedCost, water: this.current.waterEstimatedCost };
  }

  /** Đơn giá trung bình tháng (đ/kWh, đ/m³) = tiền ước tính ÷ lượng dùng; dùng để ước tính ngày/tuần. */
  unitPrice(metric: UtilityMetric): number | null {
    const cost = metric === "electricity" ? this.current.electricityEstimatedCost : this.current.waterEstimatedCost;
    const used = this.sum(metric === "electricity" ? this.electricity : this.water, (row) => row.date.startsWith(this.month));
    return cost == null || used <= 0 ? null : cost / used;
  }

  cost(metric: UtilityMetric, amount: number): number | null {
    const price = this.unitPrice(metric);
    return price == null ? null : Math.round(amount * price);
  }

  series(range: UtilityRange): UtilitySeries {
    if (range === "day") return this.daySeries();
    // Ngày trước khi vào ở không lên trục: chỉ vẽ từ ngày nhận phòng tới hôm nay.
    if (range === "week") return this.daysSeries(this.fromStay(UtilityUsage.addDays(this.today, -6)), this.today, 7);
    // Tháng: so với cùng số ngày đầu tháng trước (không phải các ngày cuối tháng trước).
    const mtd = this.monthToDate();
    return {
      ...this.daysSeries(this.fromStay(`${this.month}-01`), this.today, this.dayOfMonth),
      changePercent: {
        electricity: UtilityUsage.change(mtd.electricity.current, mtd.electricity.previous),
        water: UtilityUsage.change(mtd.water.current, mtd.water.previous),
      },
    };
  }

  /** Bản ghi từng ngày đã có dữ liệu trong tháng hiện tại (để vẽ lịch và xem chi tiết). */
  days(): DailyRecord[] {
    const dates = new Set([...this.electricity, ...this.water].map((row) => row.date).filter((date) => date.startsWith(this.month)));
    return [...dates].sort().map((date) => this.dayRecord(date));
  }

  /** Lượng dùng từ đầu tháng tới nay so với cùng số ngày của tháng trước. */
  monthToDate(): { electricity: { current: number; previous: number }; water: { current: number; previous: number } } {
    const previousMonth = UtilityUsage.addMonths(`${this.month}-01`, -1).slice(0, 7);
    const inCurrent = (row: Reading) => row.date.startsWith(this.month);
    const inPrevious = (row: Reading) => row.date.startsWith(previousMonth) && Number(row.date.slice(8)) <= this.dayOfMonth;
    return {
      electricity: { current: this.sum(this.electricity, inCurrent), previous: this.sum(this.electricity, inPrevious) },
      water: { current: this.sum(this.water, inCurrent), previous: this.sum(this.water, inPrevious) },
    };
  }

  /** Chỉ số đồng hồ mới nhất (số cuối của giờ đo gần nhất). */
  meters(): { electricity: number | null; water: number | null; updatedAt: string | null } {
    const electricity = this.electricity.at(-1);
    const water = this.water.at(-1);
    const updatedAt = [electricity?.recordedAt, water?.recordedAt].filter(Boolean).sort().at(-1) ?? null;
    return { electricity: electricity?.end ?? null, water: water?.end ?? null, updatedAt };
  }

  /** Nhận xét rút ra từ dữ liệu: thay đổi so với cùng kỳ tháng trước và giờ dùng điện nhiều nhất. */
  insights(): UtilityInsight[] {
    const items: UtilityInsight[] = [];
    const mtd = this.monthToDate();
    // Chỉ kết luận "ổn định" khi thật sự so được với tháng trước (tháng trước có số liệu).
    let compared = false;
    for (const metric of ["electricity", "water"] as const) {
      const change = UtilityUsage.change(mtd[metric].current, mtd[metric].previous);
      if (change == null) continue;
      compared = true;
      if (change >= NOTABLE_CHANGE) items.push({ kind: metric === "electricity" ? "electricityUp" : "waterUp", tone: "warning", value: change });
      else if (change <= -NOTABLE_CHANGE) items.push({ kind: metric === "electricity" ? "electricityDown" : "waterDown", tone: "success", value: Math.abs(change) });
    }
    const peak = this.peakHour();
    if (peak != null) items.push({ kind: "peakHour", tone: "info", value: peak });
    if (compared && items.every((item) => item.kind === "peakHour")) items.unshift({ kind: "stable", tone: "success", value: 0 });
    return items;
  }

  private fromStay(date: string): string {
    return this.firstStayDate != null && this.firstStayDate > date ? this.firstStayDate : date;
  }

  private get dayOfMonth(): number {
    return Number(this.today.slice(8));
  }

  /** Hôm nay theo từng giờ đã có số đo, so với cùng các giờ đó của hôm qua. */
  private daySeries(): UtilitySeries {
    const yesterday = UtilityUsage.addDays(this.today, -1);
    // Giờ đang chạy chưa có số đo (số đo gửi lúc hết giờ) nên chỉ lấy tới giờ cuối đã có dữ liệu.
    const measured = [...this.electricity, ...this.water].filter((row) => row.date === this.today).map((row) => row.hour);
    const hours = measured.length ? Math.max(...measured) + 1 : 0;
    const values = Array.from({ length: hours }, (): Amount => ({ electricity: 0, water: 0 }));
    for (const [metric, rows] of [["electricity", this.electricity], ["water", this.water]] as const) {
      for (const row of rows) if (row.date === this.today && row.hour < hours) values[row.hour][metric] += row.amount;
    }
    const sameHoursYesterday = (row: Reading) => row.date === yesterday && row.hour < hours;
    const electricityTotal = values.reduce((sum, value) => sum + value.electricity, 0);
    const waterTotal = values.reduce((sum, value) => sum + value.water, 0);
    return {
      labels: UtilityUsage.ticks(Array.from({ length: hours + 1 }, (_, hour) => `${hour}h`)),
      electricity: UtilityUsage.padSeries(values.map((value) => value.electricity)),
      water: UtilityUsage.padSeries(values.map((value) => value.water)),
      electricityTotal,
      waterTotal,
      changePercent: {
        electricity: UtilityUsage.change(electricityTotal, this.sum(this.electricity, sameHoursYesterday)),
        water: UtilityUsage.change(waterTotal, this.sum(this.water, sameHoursYesterday)),
      },
      from: this.today,
      to: this.today,
    };
  }

  /** Tổng theo ngày từ `from` tới `to`, so với `length` ngày liền trước. */
  private daysSeries(from: string, to: string, length: number): UtilitySeries {
    const dates = Array.from({ length }, (_, index) => UtilityUsage.addDays(from, index)).filter((date) => date <= to);
    const total = (rows: Reading[], date: string) => this.sum(rows, (row) => row.date === date);
    const electricity = dates.map((date) => total(this.electricity, date));
    const water = dates.map((date) => total(this.water, date));
    const previousFrom = UtilityUsage.addDays(from, -length);
    const inPrevious = (row: Reading) => row.date >= previousFrom && row.date < from;
    const electricityTotal = electricity.reduce((a, b) => a + b, 0);
    const waterTotal = water.reduce((a, b) => a + b, 0);
    return {
      labels: length === 7 ? dates : UtilityUsage.ticks(dates.map((date) => date.slice(8))),
      electricity: UtilityUsage.padSeries(electricity),
      water: UtilityUsage.padSeries(water),
      electricityTotal,
      waterTotal,
      changePercent: {
        electricity: UtilityUsage.change(electricityTotal, this.sum(this.electricity, inPrevious)),
        water: UtilityUsage.change(waterTotal, this.sum(this.water, inPrevious)),
      },
      from,
      to,
    };
  }

  private dayRecord(date: string): DailyRecord {
    const electricity = this.electricity.filter((row) => row.date === date);
    const water = this.water.filter((row) => row.date === date);
    const electricityTotal = this.sum(electricity);
    const waterTotal = this.sum(water);
    const electricityCost = this.cost("electricity", electricityTotal);
    const waterCost = this.cost("water", waterTotal);
    return {
      date,
      electricityStart: electricity[0]?.start ?? 0,
      electricityEnd: electricity.at(-1)?.end ?? 0,
      electricity: electricityTotal,
      waterStart: water[0]?.start ?? 0,
      waterEnd: water.at(-1)?.end ?? 0,
      water: waterTotal,
      cost: electricityCost == null && waterCost == null ? null : (electricityCost ?? 0) + (waterCost ?? 0),
      averageKw: UtilityUsage.average(electricity.map((row) => row.averageRate)),
      peakKw: Math.max(0, ...electricity.map((row) => row.peakRate)),
      averageLiterPerHour: UtilityUsage.average(water.map((row) => row.averageRate)),
      peakLiterPerHour: Math.max(0, ...water.map((row) => row.peakRate)),
    };
  }

  /** Giờ trong ngày có lượng điện trung bình cao nhất của tháng hiện tại (0–23). */
  private peakHour(): number | null {
    const totals = Array.from({ length: 24 }, () => 0);
    let samples = 0;
    for (const row of this.electricity) {
      if (!row.date.startsWith(this.month)) continue;
      totals[row.hour] += row.amount;
      samples++;
    }
    if (samples === 0) return null;
    // Chỉ nêu giờ cao điểm khi giờ đó thật sự nổi bật (cao hơn trung bình các giờ ít nhất 20%).
    const peak = Math.max(...totals);
    const average = totals.reduce((a, b) => a + b, 0) / 24;
    return peak > average * 1.2 ? totals.indexOf(peak) : null;
  }

  private sum(rows: Reading[], include: (row: Reading) => boolean = () => true): number {
    return rows.reduce((total, row) => (include(row) ? total + row.amount : total), 0);
  }

  private static reading(recordedAt: string, amount: number, start: number, end: number, averageRate: number, peakRate: number): Reading {
    // Mốc cuối của giờ đo: trừ 1 ms để 00:00 thuộc giờ 23 của ngày hôm trước.
    const local = UtilityUsage.local(new Date(recordedAt).getTime() - 1);
    return { ...local, recordedAt, amount: Math.max(0, amount), start, end, averageRate, peakRate };
  }

  private static local(time: number): { date: string; hour: number } {
    const shifted = new Date(time + VIETNAM_OFFSET);
    const pad = (value: number) => String(value).padStart(2, "0");
    return {
      date: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
      hour: shifted.getUTCHours(),
    };
  }

  static addDays(date: string, days: number): string {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
  }

  private static addMonths(date: string, months: number): string {
    const [year, month] = date.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1 + months, 1)).toISOString().slice(0, 10);
  }

  /** yyyy-MM-dd → Date theo giờ máy (chỉ để định dạng ngày/thứ, không tính toán). */
  static dateOf(date: string): Date {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  /** Tháng liền trước của một tháng yyyy-MM. */
  static previousMonth(month: string): string {
    return UtilityUsage.addMonths(`${month}-01`, -1).slice(0, 7);
  }

  /** Tháng hiện tại theo giờ Việt Nam (yyyy-MM). */
  static currentMonth(now: Date = new Date()): string {
    return UtilityUsage.local(now.getTime()).date.slice(0, 7);
  }

  private static change(current: number, previous: number): number | null {
    return previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  }

  private static average(values: number[]): number {
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  /** Biểu đồ cần ít nhất 2 điểm để vẽ đường. */
  private static padSeries(values: number[]): number[] {
    return values.length >= 2 ? values : [...values, ...Array.from({ length: 2 - values.length }, () => 0)];
  }

  /** Tối đa 5 mốc rải đều trên trục X (giờ của biểu đồ ngày, ngày của biểu đồ tháng). */
  private static ticks(values: string[]): string[] {
    if (values.length <= 1) return values;
    const count = Math.min(5, values.length);
    return Array.from({ length: count }, (_, index) => values[Math.round((index * (values.length - 1)) / (count - 1))]);
  }
}
