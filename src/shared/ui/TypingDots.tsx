import { useEffect, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";

const nativeDriver = Platform.OS !== "web";
const DELAYS = [0, 160, 320];

/** Ba chấm nhảy lần lượt, báo trợ lý / bên kia đang trả lời. */
export function TypingDots({ color, size = 7 }: { color: string; size?: number }) {
  const [values] = useState(() => DELAYS.map(() => new Animated.Value(0)));

  useEffect(() => {
    const loops = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(DELAYS[index]),
          Animated.timing(value, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: nativeDriver }),
          Animated.timing(value, { toValue: 0, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: nativeDriver }),
          Animated.delay(480 - DELAYS[index]),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [values]);

  return (
    <View style={styles.row} aria-hidden>
      {values.map((value, index) => (
        <Animated.View
          key={DELAYS[index]}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
            transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.7] }) }],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 4 },
});
