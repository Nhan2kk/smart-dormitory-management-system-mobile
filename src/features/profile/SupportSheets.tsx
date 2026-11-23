import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { AppVersionService } from "../../services/app-version.service";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { BottomSheet, Button, IconBadge, IconName, Touchable, useToast } from "../../shared/ui";
import type { ChatInfo } from "../../models/chat.model";
import { useSupportChatState } from "../chat/SupportChatProvider";
import { FAQ_ITEMS, RELEASE_NOTES } from "./supportContent";

/** Phiên bản ứng dụng khai báo trong app.json. */
export const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

type SheetProps = { visible: boolean; onClose: () => void };

/** Liên hệ Ban quản lý: hotline, giờ làm việc lấy từ cấu hình hỗ trợ của server, kèm lối vào nhắn tin. */
export function ContactSheet({ visible, onClose }: SheetProps) {
  const { t } = useI18n();
  const { info } = useSupportChatState();
  const styles = useStyles();
  const hotline = info?.emergencyHotline?.trim();
  const openChat = () => {
    onClose();
    router.push("/chat");
  };
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("profile.contactTitle")}
      subtitle={t("profile.contactSub")}
      footer={
        <View style={styles.actions}>
          {hotline ? (
            <Button
              label={t("profile.contactCall")}
              icon="call-outline"
              variant="ghost"
              onPress={() => void Linking.openURL(`tel:${hotline.replace(/[^\d+]/g, "")}`)}
              style={{ flex: 1 }}
            />
          ) : null}
          <Button label={t("profile.contactChat")} icon="chatbubbles-outline" variant="dark" onPress={openChat} style={{ flex: 1 }} />
        </View>
      }
    >
      {info ? (
        <View style={styles.list}>
          <InfoLine
            icon="ellipse"
            tone={info.isWorkingHours ? "success" : "neutral"}
            text={info.isWorkingHours ? t("profile.contactOpen") : t("profile.contactClosed")}
          />
          {hotline ? <InfoLine icon="call-outline" text={`${t("profile.contactHotline")}: ${hotline}`} /> : null}
          {WorkingHours.lines(info, t).map((line) => (
            <InfoLine key={line} icon="time-outline" text={line} />
          ))}
          {info.emergencyNote ? <InfoLine icon="alert-circle-outline" tone="danger" text={info.emergencyNote} /> : null}
        </View>
      ) : (
        <Text style={styles.muted}>{t("profile.contactUnavailable")}</Text>
      )}
    </BottomSheet>
  );
}

/** Gom ca làm việc theo ngày thành dòng chữ, vd. "Thứ 2 – Thứ 6: 07:30–11:30, 13:00–17:00". */
class WorkingHours {
  static lines(info: ChatInfo, t: ReturnType<typeof useI18n>["t"]): string[] {
    const byDay = new Map<number, string>();
    for (const shift of [...info.workingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.start.localeCompare(b.start))) {
      const range = `${shift.start.slice(0, 5)}–${shift.end.slice(0, 5)}`;
      byDay.set(shift.dayOfWeek, byDay.has(shift.dayOfWeek) ? `${byDay.get(shift.dayOfWeek)}, ${range}` : range);
    }
    // Các ngày liền nhau có cùng giờ thì gộp thành một khoảng.
    const groups: { from: number; to: number; hours: string }[] = [];
    for (const [day, hours] of byDay) {
      const last = groups.at(-1);
      if (last && last.hours === hours && last.to === day - 1) last.to = day;
      else groups.push({ from: day, to: day, hours });
    }
    const dayName = (day: number) => t(`profile.weekday${day}` as Parameters<typeof t>[0]);
    return groups.map(({ from, to, hours }) => `${from === to ? dayName(from) : `${dayName(from)} – ${dayName(to)}`}: ${hours}`);
  }
}

/** Câu hỏi thường gặp dạng gập/mở: bấm câu hỏi để xem câu trả lời. */
export function FaqSheet({ visible, onClose }: SheetProps) {
  const { t, l } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <BottomSheet visible={visible} onClose={onClose} title={t("profile.faqTitle")} subtitle={t("profile.faqSub")}>
      <View style={styles.list}>
        {FAQ_ITEMS.map((item, index) => {
          const expanded = open === index;
          return (
            <Touchable
              key={index}
              onPress={() => setOpen(expanded ? null : index)}
              accessibilityLabel={l(item.question)}
              accessibilityState={{ expanded }}
              pressScale={0.99}
            >
              <View style={[styles.faq, expanded && { borderColor: colors.primary }]}>
                <View style={styles.faqHead}>
                  <Text style={styles.question}>{l(item.question)}</Text>
                  <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
                </View>
                {expanded && <Text style={styles.answer}>{l(item.answer)}</Text>}
              </View>
            </Touchable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

/** Phiên bản ứng dụng, những gì có trong bản này và (bản web) kiểm tra bản mới đã phát hành. */
export function VersionSheet({ visible, onClose }: SheetProps) {
  const { t, l } = useI18n();
  const { colors } = useTheme();
  const { notify } = useToast();
  const styles = useStyles();
  const [checking, setChecking] = useState(false);
  const check = async () => {
    setChecking(true);
    const newer = await new AppVersionService().newerVersion();
    setChecking(false);
    if (newer) AppVersionService.reload();
    else notify(t("profile.versionLatest"));
  };
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("profile.versionTitle")}
      subtitle={t("profile.versionSub")}
      footer={
        AppVersionService.supported ? (
          <Button label={t("profile.versionCheck")} icon="refresh" variant="dark" loading={checking} onPress={() => void check()} />
        ) : (
          <Button label={t("common.close")} variant="dark" onPress={onClose} />
        )
      }
    >
      <View style={styles.versionHead}>
        <IconBadge icon="shield-checkmark" tone="success" size={48} rounded="circle" />
        <View style={{ flex: 1 }}>
          <Text style={styles.appName}>SDMS</Text>
          <Text style={[styles.versionText, { color: colors.success }]}>{t("profile.versionCurrent", { version: APP_VERSION })}</Text>
        </View>
      </View>
      <Text style={styles.notesTitle}>{t("profile.versionNotes")}</Text>
      <View style={styles.list}>
        {RELEASE_NOTES.map((note) => (
          <View key={l(note)} style={styles.note}>
            <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
            <Text style={styles.noteText}>{l(note)}</Text>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

function InfoLine({ icon, text, tone = "primary" }: { icon: IconName; text: string; tone?: "primary" | "success" | "neutral" | "danger" }) {
  const { tones } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.line}>
      <Ionicons name={icon} size={icon === "ellipse" ? 10 : 18} color={tones[tone].fg} style={styles.lineIcon} />
      <Text style={styles.lineText}>{text}</Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  actions: { flexDirection: "row", gap: spacing.md },
  list: { gap: spacing.sm },
  muted: { ...font.body, color: colors.muted },
  line: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: 4 },
  lineIcon: { width: 18, textAlign: "center", marginTop: 2 },
  lineText: { ...font.body, fontSize: 15, flex: 1, color: colors.ink },
  faq: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surface },
  faqHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  question: { ...font.label, fontSize: 15, flex: 1 },
  answer: { ...font.body, fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: spacing.sm },
  versionHead: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  appName: { ...font.heading, fontSize: 18 },
  versionText: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  notesTitle: { ...font.label, fontSize: 15, marginBottom: spacing.sm },
  note: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  noteText: { ...font.body, fontSize: 14, lineHeight: 21, flex: 1 },
}));
