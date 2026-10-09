import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";

type Props = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** Mức thu nhỏ khi nhấn, tạo phản hồi xúc giác bằng thị giác. */
  pressScale?: number;
};

/** Pressable có phản hồi khi nhấn (thu nhỏ + mờ nhẹ) dùng cho mọi phần tử bấm được. */
export function Touchable({
  style,
  pressScale = 0.97,
  disabled,
  ...rest
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        style,
        pressed &&
          !disabled && { transform: [{ scale: pressScale }], opacity: 0.88 },
        disabled && { opacity: 0.5 },
      ]}
      {...rest}
    />
  );
}
