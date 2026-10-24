import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";
import type { Attachment } from "../../../shared/attachments";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing } from "../../../shared/theme";
import { BottomSheet, Button, Callout, SectionHeader, Touchable } from "../../../shared/ui";

/** Original evidence from the shared request API, regardless of which client uploaded it. */
export function RequestEvidence({ attachments }: { attachments: Attachment[] }) {
  const { t } = useI18n();
  const styles = useStyles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const photos = attachments.filter(item => item.kind === "image" && !!item.url);
  const selected = photos.find(item => item.id === selectedId);
  if (!photos.length) return null;

  return (
    <>
      <SectionHeader title={t("requestForm.evidence")} />
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <Touchable
            key={`${photo.id}:${photo.url}`}
            accessibilityRole="button"
            accessibilityLabel={t("requests.viewPhoto", { index: index + 1, name: photo.name })}
            onPress={() => setSelectedId(photo.id)}
            style={styles.thumbnail}
          >
            <EvidenceImage photo={photo} />
          </Touchable>
        ))}
      </View>
      <BottomSheet
        visible={!!selected}
        onClose={() => setSelectedId(null)}
        title={t("requestForm.evidence")}
        subtitle={selected?.name}
      >
        {selected && <View style={styles.preview}><EvidenceImage key={`${selected.id}:${selected.url}`} photo={selected} contain /></View>}
      </BottomSheet>
    </>
  );
}

function EvidenceImage({ photo, contain = false }: { photo: Attachment; contain?: boolean }) {
  const { t } = useI18n();
  const styles = useStyles();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return failed ? (
    <View style={styles.failure}>
      <Callout tone="warning" action={<Button label={t("common.retry")} size="md" variant="secondary" onPress={() => { setFailed(false); setAttempt(value => value + 1); }} />}>
        {t("requests.photoLoadFailed")}
      </Callout>
    </View>
  ) : (
    <Image
      key={attempt}
      source={{ uri: photo.url }}
      accessibilityLabel={photo.name}
      style={styles.image}
      contentFit={contain ? "contain" : "cover"}
      onError={() => setFailed(true)}
    />
  );
}

const useStyles = makeStyles(({ colors }) => ({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumbnail: { width: "48%", aspectRatio: 1, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.surfaceMuted },
  image: { width: "100%", height: "100%" },
  preview: { width: "100%", aspectRatio: 1, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.surfaceMuted },
  failure: { flex: 1, justifyContent: "center", padding: spacing.xs },
}));
