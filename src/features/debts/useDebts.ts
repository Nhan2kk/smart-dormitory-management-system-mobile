import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { errorMessage } from "../../shared/api";
import { DebtGroup } from "../../enums/debt.enum";
import { DebtService } from "../../services/debt.service";
import { useAuth } from "../auth/AuthProvider";
import { useNotifyRefresh } from "../notifications/NotificationsProvider";
import { useRealtime } from "../realtime/RealtimeProvider";
import { DebtLedger } from "./DebtLedger";

/**
 * Công nợ của sinh viên từ `/student/debts/*` (tổng hợp, khoản còn nợ, lịch sử) và hoá đơn phát sinh;
 * tự tải lại khi focus, khi có thông báo hoá đơn hoặc khi một hoá đơn vừa được thanh toán.
 */
export function useDebts() {
  const { request } = useAuth();
  const { lastBillPayment, lastRegistrationPayment } = useRealtime();
  const service = useMemo(() => new DebtService(request), [request]);
  const [ledger, setLedger] = useState<DebtLedger | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [summary, outstanding, paid, bills] = await Promise.all([
        service.summary(),
        service.debts(DebtGroup.Outstanding),
        service.debts(DebtGroup.Paid),
        service.bills(),
      ]);
      setLedger(new DebtLedger(summary, outstanding, paid, bills));
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

  useEffect(() => {
    if (!lastBillPayment && !lastRegistrationPayment) return;
    const timer = setTimeout(() => void reload(), 0);
    return () => clearTimeout(timer);
  }, [lastBillPayment, lastRegistrationPayment, reload]);

  return { ledger, error, loading: ledger === null && !error, reload };
}
