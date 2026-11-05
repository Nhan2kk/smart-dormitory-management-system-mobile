import type { ApiClient } from "../shared/api";
import type {
  ResidencyRecordResponse,
  ResidencyRoomResponse,
  RoommateResponse,
  StayPeriodResponse,
} from "../models/residency.model";

type PageResponse<T> = { content: T[] };

export class ResidencyService {
  constructor(private readonly request: ApiClient) {}

  /** Hồ sơ lưu trú hiện hành; BE trả 404 khi sinh viên chưa có hồ sơ. */
  current(): Promise<ResidencyRecordResponse> {
    return this.request<ResidencyRecordResponse>("/student/residency-records");
  }

  /** Sinh viên đang ở cùng phòng (gồm cả chính mình); chưa ở giường nào thì rỗng. */
  roommates(): Promise<RoommateResponse[]> {
    return this.request<RoommateResponse[]>("/student/residency-records/roommates");
  }

  /** Phòng đang ở (tìm theo mã trong tòa); null nếu không tìm thấy. */
  async room(
    roomCode: string,
    buildingId: string | null,
  ): Promise<ResidencyRoomResponse | null> {
    const page = await this.request<PageResponse<ResidencyRoomResponse>>(
      "/student/facilities/rooms/searchRequest",
      {
        body: { page: 0, size: 20, keyword: roomCode, buildingId },
      },
    );
    return (
      page.content.find(
        (room) => room.code.toUpperCase() === roomCode.toUpperCase(),
      ) ?? null
    );
  }

  /** Thời hạn ở (ngày bắt đầu / kết thúc) trong hồ sơ sinh viên. */
  stayPeriod(): Promise<StayPeriodResponse> {
    return this.request<StayPeriodResponse>("/student/profile");
  }
}
