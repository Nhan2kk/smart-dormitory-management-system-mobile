import { useCallback, useEffect, useRef, useState } from "react";
import { RealtimeConnection } from "../../shared/realtime";
import type {
  BedAvailabilityEvent,
  BedHold,
} from "../../models/registration.model";
import type { RegistrationService } from "../../services/registration.service";
import { useAuth } from "../auth/AuthProvider";

const TOPIC = "/topic/registration/beds";
/** Server giữ giường 120 giây; gia hạn sớm để không bị nhả khi sinh viên còn ở màn chọn. */
const RENEW_MS = 40_000;

export type HoldLostReason = "expired" | "taken";

export type BedAvailabilityCounts = {
  rooms: Record<string, number>;
  floors: Record<string, number>;
  buildings: Record<string, number>;
};

type Options = {
  api: RegistrationService;
  gender: string | null;
  /** Đợt đang đăng ký: đợt theo kỳ lưu trú cho chọn cả giường đặt trước được. */
  campaignId?: string | null;
  /** Mỗi sự kiện giường (sau khi đã cập nhật số chỗ). */
  onEvent?: (event: BedAvailabilityEvent) => void;
  /** Mất giường đang giữ: hết thời gian giữ tối đa, hoặc không gia hạn được (đã bị người khác lấy). */
  onHoldLost?: (bedId: string, reason: HoldLostReason) => void;
};

/**
 * Chọn giường realtime: tải số chỗ còn lại theo phòng/tầng/tòa, nghe `/topic/registration/beds` để cập nhật ngay,
 * và giữ tạm giường sinh viên đang chọn (tự gia hạn, tự nhả khi rời màn hình).
 */
export function useBedAvailability({
  api,
  gender,
  campaignId = null,
  onEvent,
  onHoldLost,
}: Options) {
  const { accessToken, refresh } = useAuth();
  const [counts, setCounts] = useState<BedAvailabilityCounts | null>(null);
  const [preBookable, setPreBookable] = useState<Record<string, string>>({});
  const campaignIdRef = useRef(campaignId);
  const [heldBedIds, setHeldBedIds] = useState<Set<string>>(() => new Set());
  const [myHold, setMyHold] = useState<BedHold | null>(null);
  const myHoldRef = useRef<BedHold | null>(null);
  const seqRef = useRef(0);
  const snapshotSeqRef = useRef(0);
  const lastOpRef = useRef<"hold" | "release">("release");
  const genderRef = useRef(gender);
  const onEventRef = useRef(onEvent);
  const onHoldLostRef = useRef(onHoldLost);
  const refreshedFor = useRef<string | null>(null);
  useEffect(() => {
    campaignIdRef.current = campaignId;
    genderRef.current = gender;
    onEventRef.current = onEvent;
    onHoldLostRef.current = onHoldLost;
  });

  const updateHold = useCallback((hold: BedHold | null) => {
    myHoldRef.current = hold;
    setMyHold(hold);
  }, []);

  const reload = useCallback(async () => {
    const snapshotSeq = ++snapshotSeqRef.current;
    const operationSeq = seqRef.current;
    const snapshot = await api.availability(campaignIdRef.current);
    if (snapshotSeq !== snapshotSeqRef.current) return null;
    setPreBookable(snapshot.preBookableBeds ?? {});
    setCounts({
      rooms: snapshot.rooms,
      floors: snapshot.floors,
      buildings: snapshot.buildings,
    });
    setHeldBedIds(new Set(snapshot.heldBedIds));
    if (operationSeq !== seqRef.current) return snapshot;
    if (lastOpRef.current === "hold") updateHold(snapshot.myHold);
    // Lượt giữ còn sót từ lần mở trước mà giờ không chọn giường nào: nhả luôn.
    else if (snapshot.myHold) void api.releaseBedHold().catch(() => undefined);
    return snapshot;
  }, [api, updateHold]);

  useEffect(() => { void reload().catch(() => undefined); }, [reload, campaignId]);

  const apply = useCallback(
    (event: BedAvailabilityEvent) => {
      if (campaignIdRef.current) {
        void reload().then(snapshot => {
          if (!snapshot) return;
          const selectable = snapshot.preBookableBeds?.[event.bedId] &&
            (!snapshot.heldBedIds.includes(event.bedId) || snapshot.myHold?.bedId === event.bedId);
          onEventRef.current?.(selectable ? { ...event, status: "available" } : event);
        }).catch(() => undefined);
        return;
      }
      const key =
        genderRef.current === "male" || genderRef.current === "female"
          ? genderRef.current
          : "all";
      setCounts((prev) =>
        prev
          ? {
              rooms: { ...prev.rooms, [event.roomId]: event.roomAvailable },
              floors: { ...prev.floors, [event.floorId]: event.floorAvailable },
              buildings: {
                ...prev.buildings,
                [event.buildingId]: event.buildingAvailable[key] ?? 0,
              },
            }
          : prev,
      );
      setHeldBedIds((prev) => {
        if ((event.status === "held") === prev.has(event.bedId)) return prev;
        const next = new Set(prev);
        if (event.status === "held") next.add(event.bedId);
        else next.delete(event.bedId);
        return next;
      });
      if (
        myHoldRef.current?.bedId === event.bedId &&
        event.status !== "held" &&
        event.status !== "available"
      )
        updateHold(null);
      onEventRef.current?.(event);
    },
    [reload, updateHold],
  );

  useEffect(() => {
    if (
      !accessToken ||
      accessToken === "mock" ||
      !RealtimeConnection.configured
    )
      return;
    return RealtimeConnection.open(
      accessToken,
      [
        {
          destination: TOPIC,
          onMessage: (body) => apply(body as BedAvailabilityEvent),
        },
      ],
      {
        // Mỗi lần (nối lại) kết nối đều tải ảnh chụp: không lỡ sự kiện nào trong lúc rớt mạng.
        onConnected: (connected) => {
          if (connected) void reload().catch(() => undefined);
        },
        onAuthError: () => {
          if (refreshedFor.current === accessToken) return;
          refreshedFor.current = accessToken;
          void refresh();
        },
      },
    );
  }, [accessToken, apply, refresh, reload]);

  const hold = useCallback(
    async (bedId: string) => {
      const seq = ++seqRef.current;
      lastOpRef.current = "hold";
      const result = await api.holdBed(bedId, false, campaignIdRef.current);
      if (seq !== seqRef.current) {
        // Đã đổi giường/nhả trong lúc chờ: nhả lại phòng khi server xử lý lệnh nhả trước lệnh giữ này.
        if ((lastOpRef.current as string) === "release")
          void api.releaseBedHold().catch(() => undefined);
        return null;
      }
      updateHold(result);
      return result;
    },
    [api, updateHold],
  );

  const release = useCallback(() => {
    seqRef.current++;
    const hadHold = lastOpRef.current === "hold" || myHoldRef.current !== null;
    lastOpRef.current = "release";
    updateHold(null);
    if (hadHold) void api.releaseBedHold().catch(() => undefined);
  }, [api, updateHold]);

  /** Đăng ký đã tạo: server tự bỏ lượt giữ, chỉ cần quên ở client. */
  const forget = useCallback(() => {
    seqRef.current++;
    lastOpRef.current = "release";
    updateHold(null);
  }, [updateHold]);

  const heldBedId = myHold?.bedId ?? null;
  useEffect(() => {
    if (!heldBedId) return;
    const timer = setInterval(() => {
      const seq = seqRef.current;
      api
        .holdBed(heldBedId, true, campaignIdRef.current)
        .then((result) => {
          if (seq === seqRef.current) updateHold(result);
        })
        .catch((error: unknown) => {
          if (seq !== seqRef.current) return;
          updateHold(null);
          onHoldLostRef.current?.(
            heldBedId,
            (error as { code?: string } | null)?.code === "BED_HOLD_EXPIRED"
              ? "expired"
              : "taken",
          );
        });
    }, RENEW_MS);
    return () => clearInterval(timer);
  }, [api, heldBedId, updateHold]);

  // Chọn giường rồi bỏ đó: hết mốc tối đa (10 phút) thì tự bỏ chọn, nhả cho người khác.
  const holdDeadline = myHold?.holdDeadline ?? null;
  useEffect(() => {
    if (!heldBedId || !holdDeadline) return;
    const delay = Math.max(new Date(holdDeadline).getTime() - Date.now(), 0);
    const timer = setTimeout(() => {
      if (myHoldRef.current?.bedId !== heldBedId) return;
      seqRef.current++;
      lastOpRef.current = "release";
      updateHold(null);
      void api.releaseBedHold().catch(() => undefined);
      onHoldLostRef.current?.(heldBedId, "expired");
    }, delay);
    return () => clearTimeout(timer);
  }, [api, heldBedId, holdDeadline, updateHold]);

  // Rời màn chọn khi đang giữ giường: nhả ngay cho người khác.
  useEffect(
    () => () => {
      if (myHoldRef.current || lastOpRef.current === "hold")
        void api.releaseBedHold().catch(() => undefined);
    },
    [api],
  );

  return {
    counts,
    preBookable,
    heldBedIds,
    myHoldBedId: heldBedId,
    holdDeadline,
    hold,
    release,
    forget,
  };
}
