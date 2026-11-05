import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { errorMessage } from "../../shared/api";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { Avatar, Button, Callout, Card, SectionHeader, StatusBadge } from "../../shared/ui";
import type { RoommateResponse } from "../../models/residency.model";
import { ResidencyService } from "../../services/residency.service";
import { useAuth } from "../auth/AuthProvider";

/** Danh sách sinh viên đang ở cùng phòng; tự tải lại khi màn được focus. */
export function RoommatesSection() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const { request } = useAuth();
  const service = useMemo(() => new ResidencyService(request), [request]);
  const [roommates, setRoommates] = useState<RoommateResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setRoommates(await service.roommates());
      setError(null);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }, [service]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return (
    <>
      <SectionHeader title={t("residency.roommates.title")} />
      {error && !roommates ? (
        <Callout tone="danger" icon="cloud-offline-outline" title={t("residency.roommates.loadError")} action={<Button label={t("common.retry")} size="md" variant="secondary" onPress={reload} />}>
          {error}
        </Callout>
      ) : !roommates ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
      ) : roommates.length === 0 ? (
        <Card>
          <Text style={styles.caption}>{t("residency.roommates.empty")}</Text>
        </Card>
      ) : (
        <Card style={{ paddingVertical: spacing.xs }}>
          <Text style={[styles.caption, styles.count]}>{t("residency.roommates.count", { count: roommates.length })}</Text>
          {roommates.map((roommate, index) => (
            <View key={roommate.studentId} style={[styles.row, index < roommates.length - 1 && styles.divider]}>
              <View style={roommate.me && styles.meRing}>
                <Avatar initials={Formatter.initials(roommate.fullName ?? "")} uri={roommate.avatarUrl} size={44} ring={false} />
              </View>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {roommate.fullName ?? "—"}
                  </Text>
                  {roommate.me && <StatusBadge label={t("residency.roommates.you")} tone="success" />}
                </View>
                <Text style={styles.caption} numberOfLines={1}>
                  {[roommate.studentCode, roommate.className].filter(Boolean).join(" · ") || "—"}
                </Text>
                {roommate.faculty ? (
                  <Text style={styles.caption} numberOfLines={1}>
                    {roommate.faculty}
                  </Text>
                ) : null}
                <View style={styles.tags}>
                  <View style={styles.bed}>
                    <Ionicons name="bed-outline" size={14} color={colors.primary} />
                    <Text style={styles.bedText}>
                      {t("common.bed")} {roommate.bedCode ?? "—"}
                    </Text>
                  </View>
                  {roommate.representative && <StatusBadge label={t("residency.roommates.representative")} tone="warning" />}
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}
    </>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  caption: { ...font.caption },
  count: { paddingTop: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  meRing: { borderWidth: 2, borderColor: colors.primary, borderRadius: radius.pill, padding: 2 },
  info: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { ...font.label, fontSize: 15, flexShrink: 1 },
  tags: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm, marginTop: 4 },
  bed: { flexDirection: "row", alignItems: "center", gap: 4 },
  bedText: { ...font.body, fontSize: 13, color: colors.ink, fontWeight: "600" },
}));
