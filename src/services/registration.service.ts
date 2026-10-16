import type { ApiClient } from "../shared/api";
import type {
  PaymentQr,
  PaymentStatus,
} from "../models/registration-payment.model";
import type {
  BedAvailabilitySnapshot,
  BedHold,
  BuildingDto,
  FloorDto,
  PageResponse,
  Registration,
  RegistrationCreateBody,
  RoomDto,
  StudentCampaignState,
} from "../models/registration.model";

export class RegistrationService {
  constructor(private readonly request: ApiClient) {}

  currentCampaign(): Promise<StudentCampaignState> {
    return this.request<StudentCampaignState>(
      "/student/registration-campaigns/current",
    );
  }

  buildings(): Promise<BuildingDto[]> {
    return this.allPages((page) =>
      this.request<PageResponse<BuildingDto>>(
        "/student/facilities/buildings/searchRequest",
        { body: { page, size: 100, status: "active" } },
      ),
    );
  }

  floors(buildingId: string): Promise<FloorDto[]> {
    return this.allPages((page) =>
      this.request<PageResponse<FloorDto>>(
        "/student/facilities/floors/searchRequest",
        { body: { page, size: 100, buildingId } },
      ),
    );
  }

  rooms(buildingId: string): Promise<RoomDto[]> {
    return this.allPages((page) =>
      this.request<PageResponse<RoomDto>>(
        "/student/facilities/rooms/searchRequest",
        { body: { page, size: 100, buildingId } },
      ),
    );
  }

  mine(): Promise<Registration> {
    return this.request<Registration>("/student/registrations", {
      method: "GET",
    });
  }

  create(body: RegistrationCreateBody): Promise<Registration> {
    return this.request<Registration>("/student/registrations", { body });
  }

  initPayment(id: string): Promise<PaymentQr> {
    return this.request<PaymentQr>(
      `/student/registrations/${encodeURIComponent(id)}/payment-init`,
    );
  }

  paymentStatus(id: string): Promise<PaymentStatus> {
    return this.request<PaymentStatus>(
      `/student/registrations/${encodeURIComponent(id)}/payment-status`,
    );
  }

  cancel(id: string): Promise<Registration> {
    return this.request<Registration>(
      `/student/registrations/${encodeURIComponent(id)}/cancellation`,
    );
  }

  /** Số giường còn chọn được + giường người khác đang giữ (cập nhật tiếp qua WebSocket). */
  availability(): Promise<BedAvailabilitySnapshot> {
    return this.request<BedAvailabilitySnapshot>(
      "/student/registrations/availability",
    );
  }

  /** Giữ tạm giường vừa chọn; `renew` = tự gia hạn (lượt quá thời gian tối đa thì BE báo BED_HOLD_EXPIRED). */
  holdBed(bedId: string, renew = false): Promise<BedHold> {
    return this.request<BedHold>("/student/registrations/bed-holds", {
      body: { bedId, renew },
    });
  }

  releaseBedHold(): Promise<void> {
    return this.request<void>("/student/registrations/bed-holds/release");
  }

  private async allPages<T>(
    load: (page: number) => Promise<PageResponse<T>>,
  ): Promise<T[]> {
    const items: T[] = [];
    for (let page = 0; page < 50; page++) {
      const result = await load(page);
      items.push(...result.content);
      if (result.last || result.content.length === 0) break;
    }
    return items;
  }
}
