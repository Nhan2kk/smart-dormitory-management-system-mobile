import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { errorMessage } from "../../shared/api";
import { DebtService } from "../../services/debt.service";
import { useAuth } from "../auth/AuthProvider";
import { useNotifyRefresh } from "../notifications/NotificationsProvider";
import { DebtLedger } from "./DebtLedger";

/** Hoá đơn của sinh viên (`GET /student/bills`) dựng thành sổ công nợ; tự tải lại khi focus hoặc có thông báo hoá đơn. */
export function useDebts() {
  const { request } = useAuth();
  const service = useMemo(() => new DebtService(request), [request]);
  const [ledger, setLedger] = useState<DebtLedger | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLedger(new DebtLedger(await service.mine()));
      setError(null);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }, [service]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // BE gửi thông báo "/student/debts" khi hoá đơn đổi trạng thái (vd. đã thanh toán).
  useNotifyRefresh(["/student/debts", "/student/bills"], reload);

  return { ledger, error, loading: ledger === null && !error, reload };
}
