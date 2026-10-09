import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { makeStyles, radius, spacing, useTheme } from "../theme";
import { Glass } from "./Glass";
import { Touchable } from "./Touchable";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** "glass": kính mờ bán trong suốt. */
  variant?: "default" | "warm" | "muted" | "outline" | "glass";
};

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
  variant = "default",
}: Props) {
  const styles = useStyles();
  const { shadow, isDark, glass } = useTheme();
  const body =
    variant === "glass" || (glass && variant === "default") ? (
      <Glass style={[styles.base, styles.glass, style]}>{children}</Glass>
    ) : (
      <View
        style={[
          styles.base,
          styles[variant],
          variant === "default" && !isDark && shadow(1),
          style,
        ]}
      >
        {children}
      </View>
    );
  if (!onPress) return body;
  return (
    <Touchable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      pressScale={0.98}
    >
      {body}
    </Touchable>
  );
}

const useStyles = makeStyles(({ colors, isDark }) => ({
  base: { borderRadius: radius.lg, padding: spacing.lg },
  default: {
    backgroundColor: colors.surface,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  warm: { backgroundColor: colors.surfaceWarm },
  muted: { backgroundColor: colors.surfaceMuted },
  outline: { borderWidth: 1, borderColor: colors.border },
  glass: { backgroundColor: "transparent" },
}));
