import { useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ChatMessageRow } from "../../models/chat.model";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, useTheme } from "../../shared/theme";
import { AppHeader, Backdrop, Touchable } from "../../shared/ui";
import { useSupportChatState } from "./SupportChatProvider";
import { useChat } from "./useChat";
import { Composer } from "./Composer";
import { MessageBubble } from "./MessageBubble";
import { ChatRating } from "./ChatRating";
import { buildChatMessageRows } from "./chat-state";
export function ChatScreen() {
  const { t, lang } = useI18n();
  const { colors, tones } = useTheme();
  const styles = useStyles();
  const { info, allowed } = useSupportChatState();
  const chat = useChat();
  const list = useRef<FlatList<ChatMessageRow>>(null);
  const rows = useMemo(
    () => buildChatMessageRows(chat.messages).reverse(),
    [chat.messages],
  );
  const locale = lang === "en" ? "en-GB" : "vi-VN";
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Backdrop />
      <AppHeader
        title={t("chat.management")}
        subtitle={
          chat.conversation?.assignedEmployeeName
            ? t("chat.supporting", {
                name: chat.conversation.assignedEmployeeName,
              })
            : undefined
        }
      />
      {!allowed ? (
        <Text style={styles.empty}>{t("chat.restricted")}</Text>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {info && (
            <View style={styles.info}>
              <Text style={styles.greeting}>{info.greeting}</Text>
              <Text style={styles.hours}>
                {info.isWorkingHours
                  ? t("chat.working")
                  : t("chat.offHours", {
                      time: new Date(info.nextOpenAt).toLocaleString(locale, {
                        timeZone: info.timezone,
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      }),
                    })}
              </Text>
              <Text style={[styles.emergency, { color: tones.danger.fg }]}>
                {info.emergencyHotline
                  ? `${t("chat.hotline")}: ${info.emergencyHotline}. `
                  : ""}
                {info.emergencyNote}
              </Text>
            </View>
          )}
          <FlatList
            ref={list}
            style={{ flex: 1 }}
            inverted
            data={rows}
            extraData={chat.conversation}
            keyExtractor={(item) => item.message.clientMessageId}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onEndReached={() => void chat.loadMore()}
            onEndReachedThreshold={0.2}
            ListEmptyComponent={
              chat.loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.empty}>{t("chat.empty")}</Text>
              )
            }
            ListFooterComponent={
              chat.hasMore ? (
                <Touchable onPress={() => void chat.loadMore()}>
                  <Text style={styles.loadMore}>{t("chat.loadMore")}</Text>
                </Touchable>
              ) : undefined
            }
            renderItem={({ item }) => {
              const message = item.message;
              const date = new Date(message.createdAt).toLocaleDateString(
                locale,
              );
              return (
                <View>
                  {item.separator === "date" && (
                    <Text style={styles.date}>{date}</Text>
                  )}
                  {item.separator === "time" && (
                    <Text style={styles.date}>
                      {new Date(message.createdAt).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  )}
                  <MessageBubble
                    message={message}
                    conversation={chat.conversation}
                    grouped={!item.startsGroup}
                    endsGroup={item.endsGroup}
                    onRetry={() => void chat.retry(message)}
                  />
                </View>
              );
            }}
          />
          {chat.conversation?.status === "CLOSED" && (
            <ChatRating
              key={chat.conversation.id + (chat.conversation.rating ?? "")}
              conversation={chat.conversation}
              onRate={chat.rate}
            />
          )}
          <Composer
            sending={chat.sending}
            disabled={chat.loading}
            onSend={chat.send}
          />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
const useStyles = makeStyles(({ colors }) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: 12, flexGrow: 1 },
  info: {
    marginHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 4,
    marginBottom: 8,
  },
  greeting: { color: colors.ink, fontSize: 13 },
  hours: { color: colors.primary, fontSize: 12 },
  emergency: { fontSize: 11, lineHeight: 16 },
  empty: { padding: 24, textAlign: "center", color: colors.muted },
  loadMore: { color: colors.primary, padding: 12, textAlign: "center" },
  date: { color: colors.muted, fontSize: 11, textAlign: "center", padding: 10 },
}));
