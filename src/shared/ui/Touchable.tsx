import { useState } from "react";
import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import { Motion } from "./Motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** Mức thu nhỏ khi nhấn, tạo phản hồi xúc giác bằng thị giác. */
  pressScale?: number;
};

/**
 * Pressable có phản hồi khi nhấn dùng cho mọi phần tử bấm được: thu nhỏ và mờ nhẹ theo lò xo,
 * nhả tay thì bật lại mượt thay vì đổi tức thì.
 */
export function Touchable({
  style,
  pressScale = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  // 0 = thả, 1 = đang nhấn.
  const [press] = useState(() => new Animated.Value(0));
  const animate = (to: number) => Motion.spring(press, to).start();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={6}
      onPressIn={(event: GestureResponderEvent) => {
        if (!disabled) animate(1);
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        animate(0);
        onPressOut?.(event);
      }}
      style={[
        style,
        disabled
          ? { opacity: 0.5 }
          : {
              opacity: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] }),
              transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, pressScale] }) }],
            },
      ]}
      {...rest}
    />
  );
}
