import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { errorMessage } from "../../shared/api";
import { useAuth } from "../auth/AuthProvider";
import { useNotifyRefresh } from "../notifications/NotificationsProvider";
import { fromSummary, StudentRequest } from "./requestModel";
import { requestsApi } from "./requestsApi";

/** Danh sách yêu cầu của tôi (`GET /student/requests`), tự tải lại mỗi khi màn hình được focus. */
export function useMyRequests() {
  const { request } = useAuth();
  const api = useMemo(() => requestsApi(request), [request]);
  const [requests, setRequests] = useState<StudentRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      api
        .mine()
        .then((items) => {
          setRequests(items.map(fromSummary));
          setError(null);
        })
        .catch((reason: unknown) => setError(errorMessage(reason))),
    [api],
  );

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // BQL vừa xử lý yêu cầu (có thông báo mới) → cập nhật danh sách ngay.
  useNotifyRefresh(["/student/requests"], reload);

  return { requests, error, loading: requests === null && !error, reload };
}
