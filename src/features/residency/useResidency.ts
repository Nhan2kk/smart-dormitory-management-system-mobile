import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { errorMessage, isNotFound } from "../../shared/api";
import { useAuth } from "../auth/AuthProvider";
import { ResidencyService } from "../../services/residency.service";
import { ResidencyOverview } from "./ResidencyOverview";

/**
 * Hồ sơ lưu trú hiện hành (`GET /student/residency-records`) kèm thông tin phòng và thời hạn ở.
 * BE trả 404 khi sinh viên chưa có hồ sơ (chưa nhận phòng) → `none`. Tự tải lại khi màn được focus.
 */
export function useResidency() {
  const { request } = useAuth();
  const service = useMemo(() => new ResidencyService(request), [request]);
  const [overview, setOverview] = useState<ResidencyOverview | null>(null);
  const [none, setNone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const record = await service.current();
      // Phòng và thời hạn chỉ bổ sung: lỗi thì vẫn hiện hồ sơ.
      const [room, stay] = await Promise.all([
        record.roomCode ? service.room(record.roomCode, record.buildingId).catch(() => null) : Promise.resolve(null),
        service.stayPeriod().catch(() => null),
      ]);
      setOverview(new ResidencyOverview(record, room, stay));
      setNone(false);
      setError(null);
    } catch (reason) {
      if (isNotFound(reason)) {
        setOverview(null);
        setNone(true);
        setError(null);
      } else {
        setError(errorMessage(reason));
      }
    }
  }, [service]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const loading = overview === null && !none && !error;
  /** Đã có chỗ ở KTX; null khi đang tải hoặc lỗi (không xác định được). */
  const resident = loading || error ? null : !!overview?.active;
  return { overview, none, error, loading, resident, reload };
}
