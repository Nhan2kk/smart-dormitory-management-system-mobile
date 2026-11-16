import { ReactNode, useEffect, useState } from "react";
import { Animated, Platform, StyleSheet } from "react-native";
import { Motion } from "./Motion";

/**
 * push: trượt nhẹ từ phải sang + hiện dần (mở màn hình con).
 * modal: trồi lên từ dưới + hiện dần (màn hình dạng modal).
 * fade: chỉ hiện dần (màn chào, nhóm màn hình gốc).
 */
export type ScreenTransitionKind = "push" | "modal" | "fade";

const OFFSET: Record<ScreenTransitionKind, { x: number; y: number }> = {
  push: { x: 32, y: 0 },
  modal: { x: 0, y: 48 },
  fade: { x: 0, y: 0 },
};

/**
 * Hiệu ứng vào màn hình. Native-stack trên iOS/Android đã tự có hiệu ứng; bản web thì không, nên các
 * layout bọc màn hình bằng component này khi chạy trên web.
 */
export function ScreenTransition({
  kind = "push",
  children,
}: {
  kind?: ScreenTransitionKind;
  children: ReactNode;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let cancelled = false;
    void Motion.prefersReducedMotion().then((reduce) => {
      if (cancelled) return;
      if (reduce) progress.setValue(1);
      else Motion.timing(progress, 1, kind === "fade" ? Motion.duration.base : Motion.duration.slow).start();
    });
    return () => {
      cancelled = true;
      progress.stopAnimation();
    };
  }, [kind, progress]);
  const offset = OFFSET[kind];
  return (
    <Animated.View
      style={[
        styles.fill,
        {
          opacity: progress,
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [offset.x, 0] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [offset.y, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });

type LayoutArgs = {
  route: { name: string };
  options: { presentation?: string; animation?: string };
  children: ReactNode;
};

/**
 * Tạo `screenLayout` cho Stack: bản web bọc mỗi màn hình bằng hiệu ứng vào, chọn kiểu theo
 * presentation/animation của màn hình; iOS/Android giữ hiệu ứng native sẵn có.
 */
export function webScreenLayout(fallback: (routeName: string) => ScreenTransitionKind = () => "push") {
  return function ScreenLayout({ route, options, children }: LayoutArgs) {
    if (Platform.OS !== "web") return <>{children}</>;
    const kind: ScreenTransitionKind = options.presentation?.toLowerCase().includes("modal")
      ? options.animation === "fade"
        ? "fade"
        : "modal"
      : options.animation === "fade"
        ? "fade"
        : fallback(route.name);
    return <ScreenTransition kind={kind}>{children}</ScreenTransition>;
  };
}
