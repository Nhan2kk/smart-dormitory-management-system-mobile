import { ResidencyRecordType } from "../../enums/residency.enum";
import type { ResidencyHistory, ResidencyLocation, ResidencyRecordResponse, ResidencyRoomResponse, StayPeriodResponse } from "../../models/residency.model";

const DAY = 86_400_000;

/**
 * Hồ sơ lưu trú của sinh viên: vị trí hiện tại, thông tin phòng, thời hạn ở và các mốc biến động.
 * Ngày hết hạn là ngày kết thúc lưu trú dự kiến của hồ sơ (ngày thanh toán + thời hạn đăng ký);
 * ngày vào lấy từ hồ sơ sinh viên, thiếu thì dùng ngày hiệu lực của hồ sơ.
 */
export class ResidencyOverview {
  readonly recordCode: string;
  readonly location: ResidencyLocation;
  readonly roomType: string | null;
  readonly capacity: number | null;
  readonly occupants: number | null;
  readonly price: number | null;
  readonly linkedRequest: string | null;
  readonly checkInDate: string | null;
  readonly expiryDate: string | null;
  readonly pricingPeriod: ResidencyRecordResponse["pricingPeriod"];
  /** Đang ở KTX: hồ sơ hiện hành không phải trả phòng và có phòng. */
  readonly active: boolean;

  constructor(
    private readonly record: ResidencyRecordResponse,
    room: ResidencyRoomResponse | null,
    stay: StayPeriodResponse | null,
  ) {
    this.recordCode = record.code ?? record.id;
    this.location = {
      building: record.buildingName ?? "—",
      floor: record.floorName,
      room: record.roomCode ?? "—",
      bed: record.bedCode ?? "—",
    };
    this.roomType = room?.type ?? null;
    this.capacity = room?.capacity ?? null;
    this.occupants = room?.occupants ?? null;
    this.price = room?.price ?? null;
    this.linkedRequest = record.roomTransferRequestId ?? record.registrationId ?? record.roomCheckoutRequestId;
    this.checkInDate = stay?.startDate ?? record.effectiveDate;
    // Ngày kết thúc dự kiến tính từ ngày thanh toán + thời hạn đăng ký; hồ sơ cũ chưa có thì dùng hồ sơ sinh viên.
    this.expiryDate = record.expectedEndDate ?? stay?.endDate ?? null;
    this.pricingPeriod = record.pricingPeriod;
    this.active = record.recordType !== ResidencyRecordType.Checkout && !!record.roomId;
  }

  /** Số ngày còn lại tới hết hạn ở; null khi chưa có ngày hết hạn. */
  remainingDays(now: Date = new Date()): number | null {
    if (!this.expiryDate) return null;
    return Math.max(0, Math.ceil((ResidencyOverview.time(this.expiryDate) - now.getTime()) / DAY));
  }

  /** Tỷ lệ thời gian đã ở (0–1) để vẽ vòng tiến độ; 0 khi thiếu ngày. */
  progress(now: Date = new Date()): number {
    if (!this.checkInDate || !this.expiryDate) return 0;
    const start = ResidencyOverview.time(this.checkInDate);
    const end = ResidencyOverview.time(this.expiryDate);
    return end > start ? Math.min(1, Math.max(0, (now.getTime() - start) / (end - start))) : 0;
  }

  /** Mốc hiện tại, kèm mốc ở phòng cũ nếu hồ sơ là chuyển phòng. */
  history(): ResidencyHistory[] {
    const previous: ResidencyLocation | undefined = this.record.oldRoomCode
      ? { building: this.record.oldBuildingName ?? "—", floor: null, room: this.record.oldRoomCode, bed: this.record.oldBedCode ?? "—" }
      : undefined;
    const items: ResidencyHistory[] = [
      {
        id: this.recordCode,
        type: this.record.recordType,
        location: this.location,
        previous,
        effectiveDate: this.record.effectiveDate,
        linkedRequest: this.linkedRequest,
        active: true,
      },
    ];
    if (previous) {
      items.push({ id: `${this.recordCode}-previous`, type: ResidencyRecordType.New, location: previous, effectiveDate: null, linkedRequest: null, active: false });
    }
    return items;
  }

  /** "2026-10-08" (ngày, không giờ) tính theo giờ máy; chuỗi có giờ thì dùng nguyên. */
  private static time(value: string): number {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(year, month - 1, day).getTime();
    }
    return new Date(value).getTime();
  }
}
