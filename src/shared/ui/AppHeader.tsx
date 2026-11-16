import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ReactNode } from "react";
import { Text, View } from "react-native";
import { useI18n } from "../i18n/I18nProvider";
import { makeStyles, spacing, useTheme } from "../theme";
import { Glass } from "./Glass";
import { Touchable } from "./Touchable";

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Nút tròn: "surface" nền đặc theo theme, viền rõ, không làm mờ và không đổ bóng để mép nút sắc nét;
 * "photo" là kính tối dùng trên ảnh.
 */
export function CircleButton({
  icon,
  onPress,
  label,
  variant = "surface",
  badge,
  size = 44,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  variant?: "surface" | "photo";
  /** `true`: chấm nhỏ; số > 0: huy hiệu đếm (vd. số thông báo chưa đọc, quá 99 hiện "99+"). */
  badge?: boolean | number;
  size?: number;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Touchable
      onPress={onPress}
      accessibilityLabel={label}
      style={{ borderRadius: size / 2 }}
    >
      {variant === "photo" ? (
        <Glass
          variant="photo"
          style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <Ionicons name={icon} size={size * 0.47} color={colors.white} />
        </Glass>
      ) : (
        <View
          style={[
            styles.circle,
            styles.solid,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Ionicons name={icon} size={size * 0.47} color={colors.ink} />
        </View>
      )}
      {typeof badge === "number"
        ? badge > 0 && (
            <View style={styles.countBadge} pointerEvents="none">
              <Text style={styles.countText}>{badge > 99 ? "99+" : badge}</Text>
            </View>
          )
        : badge && <View style={styles.badge} />}
    </Touchable>
  );
}

type Props = {
  title: string;
  subtitle?: string;
  /** Ẩn nút quay lại (màn hình gốc của tab). */
  hideBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  /** Header đặt trên ảnh: chữ trắng, nút kính tối. */
  onPhoto?: boolean;
};

/** Header kiểu iOS: nút tròn quay lại – tiêu đề giữa – thao tác phải. */
export function AppHeader({
  title,
  subtitle,
  hideBack,
  onBack,
  right,
  onPhoto,
}: Props) {
  const { t } = useI18n();
  const styles = useStyles();
  const back =
    onBack ??
    (() => (router.canGoBack() ? router.back() : router.replace("/")));
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {!hideBack && (
          <CircleButton
            icon="chevron-back"
            label={t("common.back")}
            onPress={back}
            variant={onPhoto ? "photo" : "surface"}
          />
        )}
      </View>
      <View style={styles.center}>
        <Text
          style={[styles.title, onPhoto && styles.onPhoto]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            style={[styles.subtitle, onPhoto && styles.onPhotoSoft]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[styles.side, { alignItems: "flex-end" }]}>{right}</View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  side: { width: 48 },
  center: { flex: 1, alignItems: "center" },
  title: { ...font.heading },
  subtitle: { ...font.caption, marginTop: 2 },
  onPhoto: { color: colors.white },
  onPhotoSoft: { color: "rgba(255,255,255,0.82)" },
  circle: { alignItems: "center", justifyContent: "center" },
  solid: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  badge: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  countBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
}));
