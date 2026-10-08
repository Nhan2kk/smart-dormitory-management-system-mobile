import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { AppHeader, Backdrop, BottomSheet, Card, CircleButton, EmptyState, Field, Gradient, Touchable, useToast } from "../../shared/ui";
import { AssistantMockEngine, ChatMessage, Conversation } from "./assistant.mock";

export function AssistantScreen() {
  const { notify } = useToast();
  const { t, lang } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const [conversations, setConversations] = useState<Conversation[]>(() => AssistantMockEngine.history(lang));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const list = useRef<FlatList<ChatMessage>>(null);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || thinking) return;
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", text: question }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((current) => [...current, AssistantMockEngine.reply(question, lang)]);
      setThinking(false);
    }, 1100);
  };

  const rate = (id: string, feedback: "up" | "down") => {
    setMessages((current) => current.map((message) => (message.id === id ? { ...message, feedback } : message)));
    notify(t("assistant.feedbackSaved"), "info");
  };

  const filtered = conversations.filter((conversation) => conversation.title.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Backdrop />
      <AppHeader
        title={t("assistant.title")}
        subtitle={t("assistant.online")}
        right={<CircleButton icon="time-outline" label={t("assistant.history")} onPress={() => setHistoryOpen(true)} />}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Welcome onPick={send} />}
          ListFooterComponent={thinking ? <Typing /> : null}
          renderItem={({ item }) => (item.role === "user" ? <UserBubble text={item.text} /> : <BotBubble message={item} onRate={rate} />)}
        />
        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t("assistant.placeholder")}
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
            accessibilityLabel={t("assistant.placeholder")}
            onSubmitEditing={() => send(input)}
            submitBehavior="submit"
            returnKeyType="send"
          />
          <Touchable onPress={() => send(input)} disabled={!input.trim() || thinking} accessibilityLabel={t("assistant.send")} style={[styles.send, (!input.trim() || thinking) && { backgroundColor: colors.border }]}>
            <Ionicons name="arrow-up" size={22} color={colors.onPrimary} />
          </Touchable>
        </View>
        <Text style={styles.disclaimer}>{t("assistant.disclaimer")}</Text>
      </KeyboardAvoidingView>

      <BottomSheet visible={historyOpen} onClose={() => setHistoryOpen(false)} title={t("assistant.history")}>
        <Touchable
          onPress={() => {
            setMessages([]);
            setHistoryOpen(false);
          }}
          accessibilityLabel={t("assistant.newChat")}
          style={styles.newChat}
        >
          <Ionicons name="create-outline" size={18} color={colors.onPrimary} />
          <Text style={styles.newChatText}>{t("assistant.newChat")}</Text>
        </Touchable>
        <Field icon="search-outline" value={search} onChangeText={setSearch} placeholder={t("assistant.searchChats")} />
        {filtered.length === 0 ? (
          <EmptyState icon="chatbubbles-outline" title={t("assistant.noChats")} />
        ) : (
          filtered.map((conversation) => (
            <Card key={conversation.id} style={styles.chatRow}>
              <Touchable
                onPress={() => {
                  setMessages(conversation.messages);
                  setHistoryOpen(false);
                }}
                accessibilityLabel={conversation.title}
                style={{ flex: 1 }}
              >
                <Text style={styles.chatTitle} numberOfLines={1}>
                  {conversation.title}
                </Text>
                <Text style={styles.caption}>
                  {Formatter.relative(conversation.updatedAt)} · {t("assistant.messages", { count: conversation.messages.length })}
                </Text>
              </Touchable>
              <Touchable
                onPress={() => {
                  setConversations((current) => current.filter((item) => item.id !== conversation.id));
                  notify(t("assistant.deleted"));
                }}
                accessibilityLabel={t("assistant.deleteChat")}
                style={styles.delete}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Touchable>
            </Card>
          ))
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, l } = useI18n();
  return (
    <View style={styles.welcome}>
      <Gradient style={styles.orb}>
        <Ionicons name="sparkles" size={34} color={colors.white} />
      </Gradient>
      <Text style={styles.welcomeTitle}>{t("assistant.welcome")}</Text>
      <Text style={styles.welcomeBody}>{t("assistant.welcomeBody")}</Text>
      <View style={styles.suggestions}>
        {AssistantMockEngine.suggestions.map((suggestion) => (
          <Touchable key={suggestion.vi} onPress={() => onPick(l(suggestion))} accessibilityLabel={l(suggestion)} style={styles.suggestion}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
            <Text style={styles.suggestionText}>{l(suggestion)}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.muted} />
          </Touchable>
        ))}
      </View>
    </View>
  );
}

function UserBubble({ text }: { text: string }) {
  const styles = useStyles();
  return (
    <View style={[styles.bubble, styles.user]}>
      <Text style={styles.userText}>{text}</Text>
    </View>
  );
}

function BotBubble({ message, onRate }: { message: ChatMessage; onRate: (id: string, feedback: "up" | "down") => void }) {
  const styles = useStyles();
  const { colors, shadow } = useTheme();
  const { t } = useI18n();
  return (
    <View style={styles.botRow}>
      <View style={styles.botAvatar}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: spacing.sm }}>
        <View style={[styles.bubble, styles.bot, shadow(1)]}>
          <Text style={styles.botText}>{message.text}</Text>
          {message.sources && (
            <View style={styles.sources}>
              {message.sources.map((source) => (
                <View key={`${source.title}-${source.page}`} style={styles.source}>
                  <Ionicons name="document-text-outline" size={12} color={colors.info} />
                  <Text style={styles.sourceText}>
                    {source.title} · {t("assistant.page", { page: source.page })}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.rate}>
          <Touchable onPress={() => onRate(message.id, "up")} accessibilityLabel={t("assistant.helpful")} style={styles.rateBtn}>
            <Ionicons name={message.feedback === "up" ? "thumbs-up" : "thumbs-up-outline"} size={16} color={message.feedback === "up" ? colors.success : colors.muted} />
          </Touchable>
          <Touchable onPress={() => onRate(message.id, "down")} accessibilityLabel={t("assistant.notHelpful")} style={styles.rateBtn}>
            <Ionicons name={message.feedback === "down" ? "thumbs-down" : "thumbs-down-outline"} size={16} color={message.feedback === "down" ? colors.danger : colors.muted} />
          </Touchable>
        </View>
      </View>
    </View>
  );
}

function Typing() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View style={styles.botRow} accessibilityLabel={t("assistant.thinking")}>
      <View style={styles.botAvatar}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
      </View>
      <View style={[styles.bubble, styles.bot, styles.typing]}>
        <View style={[styles.typingDot, { opacity: 0.4 }]} />
        <View style={[styles.typingDot, { opacity: 0.7 }]} />
        <View style={styles.typingDot} />
        <Text style={[styles.caption, { marginLeft: 6 }]}>{t("assistant.thinking")}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  caption: { ...font.caption },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  welcome: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxl },
  orb: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  welcomeTitle: { ...font.title, textAlign: "center", marginTop: spacing.xl },
  welcomeBody: { ...font.body, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.lg },
  suggestions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.xxl },
  suggestion: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  suggestionText: { ...font.label, flex: 1, fontWeight: "600" },
  bubble: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.lg, maxWidth: "88%" },
  user: { alignSelf: "flex-end", backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  userText: { color: colors.onPrimary, fontSize: 15, lineHeight: 21 },
  botRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  botAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", marginTop: 4 },
  bot: { alignSelf: "flex-start", backgroundColor: colors.surface, borderTopLeftRadius: 6, maxWidth: "100%" },
  botText: { ...font.body, color: colors.ink, lineHeight: 22 },
  sources: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.md },
  source: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.infoSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  sourceText: { fontSize: 11, fontWeight: "700", color: colors.info },
  rate: { flexDirection: "row", gap: 4 },
  rateBtn: { width: 36, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  typing: { flexDirection: "row", alignItems: "center", gap: 5 },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, marginHorizontal: spacing.lg, padding: 6, paddingLeft: spacing.lg, backgroundColor: colors.surface, borderRadius: 28, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, fontSize: 16, color: colors.ink, maxHeight: 120, paddingVertical: 12, outlineStyle: "none" } as object,
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  disclaimer: { ...font.caption, fontSize: 11, textAlign: "center", marginTop: 6, marginBottom: 4, paddingHorizontal: spacing.xl },
  newChat: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: radius.pill, backgroundColor: colors.primary },
  newChatText: { color: colors.onPrimary, fontWeight: "700", fontSize: 15 },
  chatRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  chatTitle: { ...font.label, fontSize: 15, marginBottom: 2 },
  delete: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.dangerSoft, alignItems: "center", justifyContent: "center" },
}));
