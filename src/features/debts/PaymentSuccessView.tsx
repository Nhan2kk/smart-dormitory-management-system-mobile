import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { Button } from "../../shared/ui";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const RING_LENGTH = 2 * Math.PI * 40;
const CHECK_LENGTH = 60;
const ICON_SIZE = 84;

export type PaymentSuccessRow = { label: string; value: string };

/**
 * Màn thanh toán thành công: tiêu đề hiện trước, vòng tròn tự vẽ một vòng, dấu check vẽ nét,
 * một vòng sóng lan ra (chạy một lần); chi tiết và nút trồi lên sau. Tắt chuyển động khi máy bật giảm chuyển động.
 */
export function PaymentSuccessView({ title, hint, rows, closeLabel, actionLabel, onClose, onAction }: {
  title: string;
  hint: string;
  rows: PaymentSuccessRow[];
  closeLabel: string;
  actionLabel: string;
  onClose: () => void;
  onAction: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [titleIn] = useState(() => new Animated.Value(0));
  const [pop] = useState(() => new Animated.Value(0));
  const [ring] = useState(() => new Animated.Value(0));
  const [check] = useState(() => new Animated.Value(0));
  const [ripple] = useState(() => new Animated.Value(0));
  const [contentIn] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;
    const ease = Easing.out(Easing.cubic);
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        [titleIn, pop, ring, check, contentIn].forEach((value) => value.setValue(1));
        return;
      }
      Animated.parallel([
        Animated.timing(titleIn, { toValue: 1, duration: 400, easing: ease, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(150),
          Animated.spring(pop, { toValue: 1, friction: 6, tension: 110, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(250),
          Animated.timing(ring, { toValue: 1, duration: 700, easing: ease, useNativeDriver: false }),
          Animated.timing(check, { toValue: 1, duration: 350, easing: ease, useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.delay(950),
          Animated.timing(ripple, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(contentIn, { toValue: 1, duration: 450, easing: ease, useNativeDriver: true }),
        ]),
      ]).start();
    });
    return () => {
      cancelled = true;
    };
  }, [titleIn, pop, ring, check, ripple, contentIn]);

  const rise = (value: Animated.Value) => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });

  return (
    <View style={styles.wrap}>
      <Animated.Text style={[styles.title, rise(titleIn)]} accessibilityRole="header">
        {title}
      </Animated.Text>

      <View style={styles.iconBox}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ripple,
            { backgroundColor: colors.success },
            {
              opacity: ripple.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 0.22, 0] }),
              transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.85] }) }],
            },
          ]}
        />
        <Animated.View
          style={{
            opacity: pop,
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          }}
        >
          <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 96 96">
            <Circle cx={48} cy={48} r={40} fill={colors.successSoft} />
            <AnimatedCircle
              cx={48}
              cy={48}
              r={40}
              fill="none"
              stroke={colors.success}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={ring.interpolate({ inputRange: [0, 1], outputRange: [RING_LENGTH, 0] })}
              rotation={-90}
              origin="48, 48"
            />
            <AnimatedPath
              d="M31 49 L43 61 L66 37"
              fill="none"
              stroke={colors.success}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={CHECK_LENGTH}
              strokeDashoffset={check.interpolate({ inputRange: [0, 1], outputRange: [CHECK_LENGTH, 0] })}
            />
          </Svg>
        </Animated.View>
      </View>

      <Animated.View style={[styles.content, rise(contentIn)]}>
        <Text style={styles.hint}>{hint}</Text>
        {rows.length > 0 && (
          <View style={styles.details}>
            {rows.map((row, index) => (
              <View key={row.label} style={[styles.row, index > 0 && styles.rowDivider]}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.actions}>
          <Button label={actionLabel} onPress={onAction} />
          <Button label={closeLabel} variant="ghost" onPress={onClose} />
        </View>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  wrap: { alignItems: "center", paddingTop: spacing.xxl, paddingHorizontal: spacing.sm },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3, color: colors.ink, textAlign: "center" },
  iconBox: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    marginTop: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: { position: "absolute", width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2 },
  content: { width: "100%", alignItems: "stretch", marginTop: spacing.xl, gap: spacing.lg },
  hint: { fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: "center" },
  details: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { fontSize: 14, color: colors.muted },
  rowValue: { fontSize: 15, fontWeight: "600", color: colors.ink, fontVariant: ["tabular-nums"] },
  actions: { gap: spacing.sm },
}));
