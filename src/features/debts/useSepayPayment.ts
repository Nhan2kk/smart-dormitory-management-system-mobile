import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { errorMessage } from "../../shared/api";

export type SepayPhase = "loading" | "waiting" | "qr_expired" | "paid" | "closed";

/** Trường chung của QR SePay (đăng ký KTX, hoá đơn) cần cho đếm ngược. */
export interface SepayQrTiming {
  qrExpiresAt: string;
  serverTime: string;
}

export interface SepayStatusSnapshot {
  /** paid: đã thanh toán; closed: không thể thanh toán nữa; open: vẫn chờ tiền */
  state: "paid" | "closed" | "open";
  qrExpiresAt: string | null;
  serverTime: string;
}

export interface SepayPaymentOptions<Q extends SepayQrTiming> {
  /** Đổi `key` thì tạo QR lại từ đầu. */
  key: string;
  init: () => Promise<Q>;
  status: () => Promise<SepayStatusSnapshot>;
  /** Hạn cuối của khoản (vd. hết giữ chỗ); null nếu không có. */
  deadlineOf?: (qr: Q) => string | null;
  /** Trạng thái mới nhận qua socket cho đúng khoản này (null nếu chưa có). */
  liveState: "paid" | "closed" | null;
  connected: boolean;
  onError: (message: string) => void;
}

/**
 * Vòng đời thanh toán QR SePay trên mobile: tạo QR, đếm ngược theo giờ server, nhận kết quả qua socket
 * và hỏi lại trạng thái định kỳ. Socket bị ngắt khi sinh viên chuyển sang app ngân hàng để trả tiền nên
 * phải hỏi lại khi app quay về foreground và trong suốt lúc chờ.
 */
export function useSepayPayment<Q extends SepayQrTiming>(options: SepayPaymentOptions<Q>) {
  const { key, liveState, connected } = options;
  const [qr, setQr] = useState<Q | null>(null);
  const [phase, setPhase] = useState<SepayPhase>("loading");
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(0);

  // Hàm truyền vào là hàm mới mỗi lần render; chỉ tạo lại QR khi `key` đổi.
  const optionsRef = useRef(options);
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  const checkStatus = useCallback(async () => {
    try {
      const status = await optionsRef.current.status();
      setOffset(new Date(status.serverTime).getTime() - Date.now());
      if (status.state === "paid") setPhase("paid");
      else if (status.state === "closed") setPhase("closed");
      else if (!status.qrExpiresAt || new Date(status.qrExpiresAt).getTime() <= new Date(status.serverTime).getTime())
        setPhase("qr_expired");
    } catch (error) {
      optionsRef.current.onError(errorMessage(error));
    }
  }, []);

  const createQr = useCallback(async () => {
    setPhase("loading");
    try {
      const next = await optionsRef.current.init();
      setQr(next);
      setOffset(new Date(next.serverTime).getTime() - Date.now());
      setPhase("waiting");
    } catch (error) {
      optionsRef.current.onError(errorMessage(error));
      await checkStatus();
    }
  }, [checkStatus]);

  useEffect(() => {
    const timer = setTimeout(() => void createQr(), 0);
    return () => clearTimeout(timer);
  }, [key, createQr]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkStatus();
    });
    return () => listener.remove();
  }, [checkStatus]);
  useEffect(() => {
    if (phase !== "waiting" && phase !== "qr_expired") return;
    const timer = setInterval(() => void checkStatus(), connected ? 4000 : 2000);
    return () => clearInterval(timer);
  }, [connected, phase, checkStatus]);

  const remaining = (value: string | null | undefined) =>
    value ? Math.max(0, new Date(value).getTime() - now - offset) : null;
  const qrRemaining = qr ? remaining(qr.qrExpiresAt) ?? 0 : 0;
  const deadline = qr ? options.deadlineOf?.(qr) ?? null : null;
  const deadlineRemaining = remaining(deadline);
  const currentPhase: SepayPhase =
    liveState ??
    (phase === "waiting" && qr && now > 0
      ? deadlineRemaining === 0
        ? "closed"
        : qrRemaining === 0
          ? "qr_expired"
          : "waiting"
      : phase);

  return { qr, phase: currentPhase, createQr, qrRemaining, deadline, deadlineRemaining };
}

/** Đồng hồ đếm ngược dạng mm:ss, hoặc hh:mm:ss khi còn từ 1 giờ. */
export function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const pad = (value: number) => value.toString().padStart(2, "0");
  const minutes = `${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return total >= 3600 ? `${pad(Math.floor(total / 3600))}:${minutes}` : minutes;
}
