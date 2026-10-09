import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, errorMessage } from "../../shared/api";
import { useAuth } from "../auth/AuthProvider";
import { useRealtime } from "../realtime/RealtimeProvider";
import { utilitiesApi } from "./utilitiesApi";
import { UtilityUsage } from "./utilityModel";

/**
 * Điện nước phòng hiện tại (`POST /student/utilities`): tải tháng này và tháng trước để so sánh,
 * tự tải lại mỗi khi màn hình được focus và khi WebSocket báo phòng có số đo giờ mới.
 */
export function useUtilities() {
  const { request } = useAuth();
  const api = useMemo(() => utilitiesApi(request), [request]);
  const [usage, setUsage] = useState<UtilityUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** BE trả 404 khi sinh viên chưa có phòng hiện tại. */
  const [noRoom, setNoRoom] = useState(false);

  const reload = useCallback(() => {
    const month = UtilityUsage.currentMonth();
    return Promise.all([
      api.month(month),
      // Tháng trước chỉ để so sánh: lỗi thì vẫn hiện tháng này.
      api.month(UtilityUsage.previousMonth(month)).catch(() => null),
    ])
      .then(([current, previous]) => {
        setUsage(new UtilityUsage(current, previous));
        setError(null);
        setNoRoom(false);
      })
      .catch((reason: unknown) => {
        if (reason instanceof ApiError && reason.status === 404) {
          setNoRoom(true);
          setError(null);
        } else {
          setError(errorMessage(reason));
        }
      });
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const { lastTelemetry } = useRealtime();
  useEffect(() => {
    if (lastTelemetry) reload();
  }, [lastTelemetry, reload]);

  return { usage, error, noRoom, loading: usage === null && !error && !noRoom, reload };
}
