import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { makeStyles, radius, spacing, Tone, useTheme } from "../theme";
import { IconBadge, IconName } from "./Badges";
import { Glass } from "./Glass";
import { Touchable } from "./Touchable";

export function SectionHeader({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {action && (
        <Touchable
          onPress={onAction}
          accessibilityLabel={action}
          style={styles.sectionAction}
        >
          <Text style={styles.sectionActionText}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Touchable>
      )}
    </View>
  );
}

/** Dòng danh sách chuẩn: icon – tiêu đề/mô tả – phần phải – mũi tên. */
export function ListRow({
  icon,
  tone = "neutral",
  title,
  subtitle,
  right,
  onPress,
  chevron = !!onPress,
  divider,
  destructive,
}: {
  icon?: IconName;
  tone?: Tone;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  divider?: boolean;
  destructive?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const content = (
    <View style={[styles.row, divider && styles.divider]}>
      {icon && (
        <IconBadge icon={icon} tone={destructive ? "danger" : tone} size={40} />
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.rowTitle, destructive && { color: colors.danger }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.rowSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
      {chevron && (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      )}
    </View>
  );
  if (!onPress) return content;
  return (
    <Touchable onPress={onPress} accessibilityLabel={title} pressScale={0.99}>
      {content}
    </Touchable>
  );
}

/** Cặp nhãn – giá trị trong thẻ thông tin. */
export function InfoRow({
  label,
  value,
  divider = true,
  strong,
}: {
  label: string;
  value: ReactNode;
  divider?: boolean;
  strong?: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.info, divider && styles.divider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      {typeof value === "string" || typeof value === "number" ? (
        <Text
          style={[styles.infoValue, strong && styles.infoStrong]}
          numberOfLines={3}
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!description && (
        <Text style={styles.emptyDescription}>{description}</Text>
      )}
      {action}
    </View>
  );
}

export function ProgressBar({
  value,
  tone = "primary",
  height = 8,
  track,
}: {
  value: number;
  tone?: Tone;
  height?: number;
  track?: string;
}) {
  const { tones, colors } = useTheme();
  return (
    <View
      style={{
        height,
        borderRadius: height,
        backgroundColor: track ?? colors.surfaceMuted,
        overflow: "hidden",
      }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      <View
        style={{
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          height: "100%",
          borderRadius: height,
          backgroundColor: tones[tone].fg,
        }}
      />
    </View>
  );
}

/** Hộp gợi ý / cảnh báo có icon. */
export function Callout({
  tone = "info",
  icon,
  title,
  children,
  action,
}: {
  tone?: Tone;
  icon?: IconName;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const styles = useStyles();
  const palette = useTheme().tones[tone];
  return (
    <View style={[styles.callout, { backgroundColor: palette.bg }]}>
      <Ionicons
        name={icon ?? "information-circle"}
        size={20}
        color={palette.fg}
      />
      <View style={{ flex: 1, gap: 2 }}>
        {!!title && (
          <Text style={[styles.calloutTitle, { color: palette.fg }]}>
            {title}
          </Text>
        )}
        <Text style={styles.calloutText}>{children}</Text>
        {action && (
          <View style={{ marginTop: spacing.sm, alignSelf: "flex-start" }}>
            {action}
          </View>
        )}
      </View>
    </View>
  );
}

/** Thanh hành động cố định cuối màn hình (nút chính trong vùng ngón cái). */
export function FooterBar({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const { glass } = useTheme();
  if (glass)
    return (
      <Glass strong style={[styles.footer, styles.footerGlass]}>
        {children}
      </Glass>
    );
  return <View style={styles.footer}>{children}</View>;
}

/** Tiêu đề nhóm dạng chữ hoa nhỏ. */
export function GroupLabel({ children }: { children: string }) {
  const styles = useStyles();
  return <Text style={styles.group}>{children}</Text>;
}

const useStyles = makeStyles(({ colors, font }) => ({
  section: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...font.heading },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
  },
  sectionActionText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTitle: { ...font.label, fontSize: 15 },
  rowSubtitle: { ...font.caption, fontSize: 13, marginTop: 2 },
  info: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: 13,
  },
  infoLabel: { ...font.body, fontSize: 14, color: colors.muted },
  infoValue: { ...font.label, flexShrink: 1, textAlign: "right" },
  infoStrong: { fontWeight: "800", fontSize: 16 },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: { ...font.heading, textAlign: "center" },
  emptyDescription: {
    ...font.body,
    textAlign: "center",
    color: colors.muted,
    marginBottom: spacing.md,
  },
  callout: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md + 2,
    borderRadius: radius.md,
  },
  calloutTitle: { fontSize: 14, fontWeight: "700" },
  calloutText: { ...font.body, fontSize: 13, lineHeight: 19 },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerGlass: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  group: {
    ...font.caption,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
}));
