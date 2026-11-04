import { router } from "expo-router";
import { Image, Text, View } from "react-native";
import type { ChatConversation, ChatMessage } from "../../models/chat.model";
import { AttachmentOpener } from "../../services/attachment-opener.service";
import { useI18n } from "../../shared/i18n/I18nProvider";
import type { TranslationKey } from "../../shared/i18n/types";
import { makeStyles, useTheme } from "../../shared/theme";
import { Avatar, Touchable, useToast } from "../../shared/ui";
import { Formatter } from "../../shared/format";
function systemKey(
  text: string,
): { key: TranslationKey; params?: Record<string, string> } | null {
  const assignee = text.match(/^Nhân viên (.+) đang hỗ trợ bạn$/);
  if (assignee)
    return { key: "chat.systemAssignee", params: { name: assignee[1] } };
  const maintenance = text.match(/^Đã tạo yêu cầu bảo trì #(.+)$/);
  if (maintenance)
    return { key: "chat.systemMaintenance", params: { id: maintenance[1] } };
  const offHours = text.match(
    /^Ban quản lý đã nhận tin, sẽ phản hồi từ (.+)\.$/,
  );
  if (offHours)
    return { key: "chat.systemOffHours", params: { time: offHours[1] } };
  const fixed: Record<string, TranslationKey> = {
    "Cuộc trò chuyện đã được giải quyết. Bạn có thể đánh giá chất lượng hỗ trợ.":
      "chat.systemClosed",
    "Cuộc trò chuyện đã được mở lại": "chat.systemReopened",
    "Cuộc trò chuyện tự đóng do không có phản hồi thêm từ sinh viên.":
      "chat.systemAutoClosed",
  };
  return fixed[text] ? { key: fixed[text] } : null;
}
export function MessageBubble({
  message,
  conversation,
  grouped = false,
  endsGroup = true,
  onRetry,
}: {
  message: ChatMessage;
  conversation: ChatConversation | null;
  /** Continues the previous message's group: hide avatar and name (same rule as web). */
  grouped?: boolean;
  /** Last message of its group: show time and delivery status under it. */
  endsGroup?: boolean;
  onRetry: () => void;
}) {
  const { t, lang } = useI18n();
  const { notify } = useToast();
  const { colors } = useTheme();
  const styles = useStyles();
  if (message.type === "NOTE") return null;
  if (message.type === "SYSTEM") {
    const localized = systemKey(message.content);
    return (
      <Touchable
        onPress={
          message.linkedRequestId
            ? () =>
                router.push({
                  pathname: "/request/[id]",
                  params: {
                    id: message.linkedRequestId!,
                    kind: "supportMaintenance",
                  },
                })
            : undefined
        }
      >
        <Text style={styles.system}>
          {localized ? t(localized.key, localized.params) : message.content}
        </Text>
      </Touchable>
    );
  }
  const own = message.senderRole === "STUDENT";
  const seen =
    conversation?.staffLastReadAt &&
    Date.parse(conversation.staffLastReadAt) >= Date.parse(message.createdAt);
  const textStyle = [styles.content, own && { color: colors.onPrimary }];
  return (
    <View
      style={[
        styles.row,
        own ? styles.rowOwn : styles.rowStaff,
        grouped ? styles.rowGrouped : styles.rowFirst,
      ]}
    >
      {!own &&
        (grouped ? (
          <View style={styles.avatarSpace} />
        ) : (
          <Avatar
            initials={Formatter.initials(message.senderName)}
            uri={message.senderAvatarUrl}
            size={28}
            ring={false}
          />
        ))}
      <View style={[styles.column, own && { alignItems: "flex-end" }]}>
        {!own && !grouped && (
          <Text style={styles.name}>{message.senderName}</Text>
        )}
        <View
          style={[
            styles.bubble,
            own ? styles.own : styles.staff,
            own && !endsGroup && { borderBottomRightRadius: 6 },
            own && grouped && { borderTopRightRadius: 6 },
            !own && !endsGroup && { borderBottomLeftRadius: 6 },
            !own && grouped && { borderTopLeftRadius: 6 },
          ]}
        >
          {!!message.content && (
            <Text style={textStyle}>{message.content}</Text>
          )}
          {message.attachments.map((file) => (
            <Touchable
              key={file.id}
              onPress={() => {
                void AttachmentOpener.open(file).catch((error) =>
                  notify(String(error.message), "danger"),
                );
              }}
            >
              {file.contentType.startsWith("image/") ? (
                <Image
                  source={{ uri: file.url }}
                  style={styles.image}
                  accessibilityLabel={file.fileName}
                  resizeMode="contain"
                />
              ) : (
                <Text
                  style={[
                    styles.content,
                    {
                      color: own ? colors.onPrimary : colors.primary,
                      textDecorationLine: "underline",
                    },
                  ]}
                >
                  {file.fileName}
                </Text>
              )}
            </Touchable>
          ))}
        </View>
        {(endsGroup || message.delivery) && (
          <View style={[styles.meta, !own && styles.metaStaff]}>
            <Text style={styles.time}>
              {new Date(message.createdAt).toLocaleTimeString(
                lang === "en" ? "en-GB" : "vi-VN",
                { hour: "2-digit", minute: "2-digit" },
              )}
              {own
                ? ` · ${t(message.delivery === "sending" ? "chat.sending" : message.delivery === "failed" ? "chat.failed" : seen ? "chat.seen" : "chat.sent")}`
                : ""}
            </Text>
            {message.delivery === "failed" && (
              <Touchable onPress={onRetry}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>
                  {t("chat.retry")}
                </Text>
              </Touchable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
const useStyles = makeStyles(({ colors }) => ({
  // Mirrors the web student thread: avatar + name once per group, time/status at the group end.
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    maxWidth: "88%",
  },
  rowOwn: { alignSelf: "flex-end" },
  rowStaff: { alignSelf: "flex-start" },
  rowFirst: { marginTop: 10 },
  rowGrouped: { marginTop: 2 },
  avatarSpace: { width: 28 },
  column: { flexShrink: 1, gap: 4 },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  own: { backgroundColor: colors.primary },
  staff: { backgroundColor: colors.primarySoft },
  content: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  name: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  time: { color: colors.muted, fontSize: 11 },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  metaStaff: { justifyContent: "flex-start" },
  image: { width: 220, height: 170, maxWidth: "100%", borderRadius: 10 },
  system: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    padding: 10,
  },
}));
