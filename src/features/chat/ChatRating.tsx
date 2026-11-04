import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import type { ChatConversation } from "../../models/chat.model";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, useTheme } from "../../shared/theme";
import { Touchable } from "../../shared/ui";
export function ChatRating({
  conversation,
  onRate,
}: {
  conversation: ChatConversation;
  onRate: (rating: number, comment: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const { colors, tones } = useTheme();
  const styles = useStyles();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  if (conversation.rating)
    return (
      <Text style={styles.rated}>
        {t("chat.rated", { rating: conversation.rating })}
      </Text>
    );
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {t("chat.closed")} · {t("chat.rating")}
      </Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Touchable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: rating === value }}
            accessibilityLabel={t("chat.stars", { count: value })}
            onPress={() => setRating(value)}
          >
            <Text
              style={{
                color: value <= rating ? tones.warning.fg : colors.muted,
                fontSize: 28,
              }}
            >
              ★
            </Text>
          </Touchable>
        ))}
      </View>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder={t("chat.comment")}
          placeholderTextColor={colors.muted}
          maxLength={1000}
          value={comment}
          onChangeText={setComment}
        />
        <Touchable
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            await onRate(rating, comment);
            setBusy(false);
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            {t("chat.rate")}
          </Text>
        </Touchable>
      </View>
    </View>
  );
}
const useStyles = makeStyles(({ colors }) => ({
  card: {
    padding: 12,
    gap: 4,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { color: colors.ink, fontSize: 13 },
  stars: { flexDirection: "row", gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    color: colors.ink,
  },
  rated: { padding: 12, fontSize: 13, color: colors.primary },
}));
