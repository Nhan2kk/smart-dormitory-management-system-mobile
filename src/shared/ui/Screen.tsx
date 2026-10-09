import { ReactNode, useEffect, useRef } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View, ViewStyle } from "react-native";
import { Edge, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing, TAB_BAR_SPACE, useTheme } from "../theme";
import { Backdrop } from "./Backdrop";

type Props = {
  children: ReactNode;
  /** Nội dung cố định ở trên (header). */
  header?: ReactNode;
  /** Nội dung cố định ở dưới (nút hành động chính). */
  footer?: ReactNode;
  scroll?: boolean;
  /** Màn hình nằm trong tab → chừa chỗ cho thanh tab nổi. */
  inTabs?: boolean;
  padded?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
};

/** Khoảng trống giữ giữa ô đang nhập và mép trên bàn phím. */
const KEYBOARD_GAP = spacing.xl;

export function Screen({ children, header, footer, scroll = true, inTabs = false, padded = true, edges = ["top"], contentStyle }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const padding = padded ? spacing.xl : 0;
  const bottom = inTabs ? TAB_BAR_SPACE : footer ? spacing.xl : spacing.xxxl;
  const scrollRef = useRef<ScrollView>(null);
  // Khung bao vùng cuộn — đo vị trí/chiều cao phần đang nhìn thấy.
  const viewportRef = useRef<View>(null);
  const offset = useRef(0);

  // Khi bàn phím mở, cuộn để ô đang nhập nằm ngay trên bàn phím. Chờ một nhịp để KeyboardAvoidingView
  // co vùng cuộn xong rồi mới đo vị trí.
  useEffect(() => {
    if (!scroll) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reveal = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const input = TextInput.State.currentlyFocusedInput();
        const view = scrollRef.current;
        const viewport = viewportRef.current;
        if (!input || !view || !viewport) return;
        viewport.measureInWindow((_x, viewY, _w, viewHeight) => {
          input.measureInWindow((_ix, inputY, _iw, inputHeight) => {
            const overflowBottom = inputY + inputHeight + KEYBOARD_GAP - (viewY + viewHeight);
            const overflowTop = viewY + KEYBOARD_GAP - inputY;
            // Ô cao hơn vùng nhìn thấy (ô mô tả nhiều dòng) → ưu tiên hiện phần đầu ô.
            const delta = overflowTop > 0 ? -overflowTop : overflowBottom > 0 ? Math.min(overflowBottom, inputY - viewY - KEYBOARD_GAP) : 0;
            if (delta !== 0) view.scrollTo({ y: Math.max(0, offset.current + delta), animated: true });
          });
        });
      }, 80);
    };
    const subscriptions = [Keyboard.addListener("keyboardDidShow", reveal), Keyboard.addListener("keyboardDidChangeFrame", reveal)];
    return () => {
      clearTimeout(timer);
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [scroll]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Backdrop />
      <SafeAreaView style={styles.flex} edges={edges}>
        {header}
        {/* Bàn phím mở thì đẩy nội dung + nút dưới cùng lên thay vì che mất ô đang nhập. */}
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          {scroll ? (
            <View ref={viewportRef} style={styles.flex} collapsable={false}>
              <ScrollView
                ref={scrollRef}
                style={styles.flex}
                contentContainerStyle={[{ paddingHorizontal: padding, paddingBottom: bottom }, contentStyle]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                onScroll={(event) => {
                  offset.current = event.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={32}
              >
                {children}
              </ScrollView>
            </View>
          ) : (
            <View style={[styles.flex, { paddingHorizontal: padding }, contentStyle]}>{children}</View>
          )}
          {footer && <View style={{ paddingBottom: edges.includes("bottom") ? 0 : insets.bottom }}>{footer}</View>}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
