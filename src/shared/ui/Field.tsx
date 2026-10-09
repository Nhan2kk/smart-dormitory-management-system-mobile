import { Ionicons } from "@expo/vector-icons";
import { forwardRef, ReactNode, useState } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { makeStyles, radius, spacing, useTheme } from "../theme";
import { IconName } from "./Badges";

type Props = TextInputProps & {
  label?: string;
  icon?: IconName;
  error?: string;
  hint?: string;
  right?: ReactNode;
};

/** Ô nhập có nhãn, viền sáng khi focus, thông báo lỗi ngay dưới trường. */
export const Field = forwardRef<TextInput, Props>(function Field(
  {
    label,
    icon,
    error,
    hint,
    right,
    multiline,
    style,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.box,
          multiline && styles.multiline,
          focused && styles.focused,
          !!error && { borderColor: colors.danger },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? colors.primary : colors.muted}
            style={multiline ? { marginTop: 2 } : undefined}
          />
        )}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          accessibilityLabel={label ?? rest.placeholder}
          style={[styles.input, multiline && { minHeight: 96 }, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const useStyles = makeStyles(({ colors, font }) => ({
  wrap: { gap: spacing.sm },
  label: { ...font.label },
  box: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  multiline: { alignItems: "flex-start", paddingVertical: spacing.md },
  focused: { borderColor: colors.primary, backgroundColor: colors.surfaceWarm },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 0,
    outlineStyle: "none",
  } as object,
  error: { color: colors.danger, fontSize: 13, fontWeight: "500" },
  hint: { ...font.caption, fontSize: 13 },
}));
