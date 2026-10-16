import { useEffect, useState } from "react";
import { View } from "react-native";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { spacing } from "../../../shared/theme";
import { Callout } from "../../../shared/ui";

/** Đếm ngược thời gian còn giữ giường đang chọn (tối đa 10 phút kể từ lúc bấm chọn). */
export function HoldCountdown({ deadline }: { deadline: string }) {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(
    0,
    Math.floor((new Date(deadline).getTime() - now) / 1000),
  );
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <View style={{ marginTop: spacing.md }}>
      <Callout tone={seconds <= 60 ? "warning" : "info"} icon="timer-outline">
        {t("registration.holdCountdown", { time })}
      </Callout>
    </View>
  );
}
