import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StudentStage } from "../../enums/student-stage.enum";
import { CheckInService } from "../../services/check-in.service";
import { isNotFound } from "../../shared/api";
import { useAuth } from "../auth/AuthProvider";

/**
 * Giai đoạn của sinh viên dựa trên biên bản nhận phòng và hồ sơ lưu trú.
 * BE sinh hồ sơ lưu trú ngay khi thanh toán đăng ký, nên "đã đăng ký mà chưa nhận phòng"
 * được nhận ra qua biên bản nhận phòng còn `pending`.
 * Khi chưa tải xong hoặc lỗi thì coi như đã ở (`Resident`) để không đẩy nhầm sang đăng ký.
 */
export function useStudentStage(hasResidency: boolean | null): StudentStage {
  const { request } = useAuth();
  const service = useMemo(() => new CheckInService(request), [request]);
  const [pendingCheckIn, setPendingCheckIn] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      service
        .mine()
        .then((record) => setPendingCheckIn(record.status === "pending"))
        .catch((error: unknown) => setPendingCheckIn(isNotFound(error) ? false : null));
    }, [service]),
  );

  if (pendingCheckIn) return StudentStage.CheckIn;
  if (hasResidency === false && pendingCheckIn === false) return StudentStage.Register;
  return StudentStage.Resident;
}
