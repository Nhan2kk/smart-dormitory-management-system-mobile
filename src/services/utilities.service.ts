import type { ApiClient } from "../shared/api";
import type { StudentMonthlyUsage } from "../models/utilities.model";

/** Gọi API điện nước của sinh viên (không đổi hợp đồng backend). */
export class UtilitiesService {
  constructor(private readonly request: ApiClient) {}

  /** Số đo điện nước của phòng trong một tháng (`YYYY-MM`). */
  month(month: string): Promise<StudentMonthlyUsage> {
    return this.request<StudentMonthlyUsage>("/student/utilities", {
      body: { month },
    });
  }
}
