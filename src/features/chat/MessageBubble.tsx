import { router } from "expo-router";
import { Image, Linking, Text, View } from "react-native";
import type { ChatConversation, ChatMessage } from "../../models/chat.model";
import { useI18n } from "../../shared/i18n/I18nProvider";
import type { TranslationKey } from "../../shared/i18n/types";
import { makeStyles, useTheme } from "../../shared/theme";
import { Touchable, useToast } from "../../shared/ui";
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
  onRetry,
}: {
  message: ChatMessage;
  conversation: ChatConversation | null;
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
  return (
    <View style={[styles.bubble, own ? styles.own : styles.staff]}>
      {!own && <Text style={styles.name}>{message.senderName}</Text>}
      {!!message.content && (
        <Text style={styles.content}>{message.content}</Text>
      )}
      {message.attachments.map((file) => (
        <Touchable
          key={file.id}
          onPress={() => {
            void Linking.openURL(file.url).catch((error) =>
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
                { color: colors.primary, textDecorationLine: "underline" },
              ]}
            >
              {file.fileName}
            </Text>
          )}
        </Touchable>
      ))}
      <View style={styles.meta}>
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
    </View>
  );
}
const useStyles = makeStyles(({ colors }) => ({
  bubble: {
    maxWidth: "88%",
    borderRadius: 16,
    padding: 12,
    gap: 6,
    marginVertical: 4,
  },
  own: { backgroundColor: colors.primarySoft, alignSelf: "flex-end" },
  staff: {
    backgroundColor: colors.surface,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  name: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  time: { color: colors.muted, fontSize: 10 },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
  },
  image: { width: 220, height: 170, maxWidth: "100%", borderRadius: 10 },
  system: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    padding: 10,
  },
}));
