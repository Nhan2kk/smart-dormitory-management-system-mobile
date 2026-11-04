import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, ScrollView, Text, TextInput, View } from "react-native";
import type { ChatUpload } from "../../models/chat.model";
import { ChatAttachmentService } from "../../services/chat-attachment.service";
import { errorMessage } from "../../shared/api";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, useTheme } from "../../shared/theme";
import {
  BottomSheet,
  CircleButton,
  Touchable,
  useToast,
} from "../../shared/ui";
export function Composer({
  sending,
  disabled,
  onSend,
}: {
  sending: boolean;
  disabled: boolean;
  onSend: (text: string, files: ChatUpload[]) => Promise<boolean>;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { notify } = useToast();
  const styles = useStyles();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<ChatUpload[]>([]);
  const [picker, setPicker] = useState(false);
  const [picking, setPicking] = useState(false);
  const select = async (kind: "camera" | "photos" | "file") => {
    setPicker(false);
    setPicking(true);
    try {
      const picked =
        kind === "file"
          ? await ChatAttachmentService.documents()
          : await ChatAttachmentService.photos(
              kind === "camera",
              5 - files.length,
            );
      if (picked === "permission") {
        notify(t("chat.permission"), "warning");
        return;
      }
      const all = [...files, ...picked];
      if (!ChatAttachmentService.valid(all)) {
        notify(t("chat.invalidFiles"), "danger");
        return;
      }
      setFiles(all);
    } catch (error) {
      notify(errorMessage(error), "danger");
    } finally {
      setPicking(false);
    }
  };
  const submit = async () => {
    if ((!text.trim() && !files.length) || text.trim().length > 2000) {
      notify(t("chat.invalidMessage"), "danger");
      return;
    }
    if (await onSend(text.trim(), files)) {
      setText("");
      setFiles([]);
    }
  };
  const busy = sending || picking || disabled;
  return (
    <View style={styles.root}>
      {!!files.length && (
        <ScrollView horizontal contentContainerStyle={styles.files}>
          {files.map((file, index) => (
            <View key={`${file.uri}-${index}`} style={styles.file}>
              {file.contentType.startsWith("image/") ? (
                <Image
                  source={{ uri: file.uri }}
                  style={styles.preview}
                  accessibilityLabel={file.name}
                />
              ) : (
                <Ionicons
                  name="document-text"
                  size={30}
                  color={colors.primary}
                />
              )}
              <Text style={styles.filename} numberOfLines={1}>
                {file.name}
              </Text>
              <Touchable
                disabled={busy}
                accessibilityLabel={t("chat.remove")}
                onPress={() => setFiles(files.filter((_, i) => index !== i))}
              >
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </Touchable>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={styles.row}>
        <Touchable
          disabled={busy || files.length >= 5}
          accessibilityLabel={t("chat.attach")}
          onPress={() => setPicker(true)}
          style={styles.button}
        >
          <Ionicons name="attach" size={24} color={colors.primary} />
        </Touchable>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
          editable={!busy}
          placeholder={t("chat.placeholder")}
          placeholderTextColor={colors.muted}
          accessibilityLabel={t("chat.placeholder")}
        />
        <Touchable
          disabled={busy || (!text.trim() && !files.length)}
          accessibilityLabel={t("chat.send")}
          onPress={() => void submit()}
          style={[styles.send, busy && { opacity: 0.5 }]}
        >
          <Ionicons
            name={sending ? "time-outline" : "send"}
            size={20}
            color={colors.onPrimary}
          />
        </Touchable>
      </View>
      <BottomSheet
        visible={picker}
        onClose={() => setPicker(false)}
        title={t("chat.attach")}
      >
        {(
          [
            ["camera", "camera-outline"],
            ["photos", "images-outline"],
            ["file", "document-text-outline"],
          ] as const
        ).map(([kind, icon]) => (
          <Touchable
            key={kind}
            style={styles.pickerRow}
            onPress={() => void select(kind)}
          >
            <CircleButton
              icon={icon}
              label={t(`chat.${kind}`)}
              onPress={() => void select(kind)}
            />
            <Text style={styles.pickerLabel}>{t(`chat.${kind}`)}</Text>
          </Touchable>
        ))}
      </BottomSheet>
    </View>
  );
}
const useStyles = makeStyles(({ colors }) => ({
  root: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  button: {
    width: 38,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    color: colors.ink,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
    flex: 1,
    fontSize: 15,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  files: { gap: 8 },
  file: {
    width: 110,
    borderRadius: 10,
    padding: 6,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    gap: 4,
  },
  preview: { width: 96, height: 65, borderRadius: 6 },
  filename: { color: colors.ink, fontSize: 11, maxWidth: 96 },
  pickerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  pickerLabel: { color: colors.ink, fontSize: 16 },
}));
