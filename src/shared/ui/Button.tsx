import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleProp, Text, ViewStyle } from "react-native";
import { makeStyles, radius, useTheme } from "../theme";
import { Touchable } from "./Touchable";

type Props = {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  size?: "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, icon, iconPosition = "left", variant = "primary", size = "lg", loading, disabled, style }: Props) {
  const { colors, shadow } = useTheme();
  const styles = useStyles();
  const palette = {
    primary: { bg: colors.primary, fg: colors.onPrimary },
    secondary: { bg: colors.primarySoft, fg: colors.primary },
    ghost: { bg: colors.surface, fg: colors.ink },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    dark: { bg: colors.inverse, fg: colors.onInverse },
  }[variant];
  const iconNode = icon ? <Ionicons name={icon} size={19} color={palette.fg} /> : null;
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[styles.base, size === "md" && styles.md, { backgroundColor: palette.bg }, variant === "primary" && shadow(2), variant === "ghost" && styles.ghost, style]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {iconPosition === "left" && iconNode}
          <Text style={[styles.label, size === "md" && { fontSize: 14 }, { color: palette.fg }]} numberOfLines={1}>
            {label}
          </Text>
          {iconPosition === "right" && iconNode}
        </>
      )}
    </Touchable>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  base: { height: 56, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18 },
  md: { height: 44, paddingHorizontal: 16 },
  ghost: { borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 16, fontWeight: "700", flexShrink: 1 },
}));
