import { ReactNode } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import {
  Edge,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { spacing, useTheme } from "../theme";
import { Backdrop } from "./Backdrop";
import { useTabBarSpace } from "./TabBarSpace";

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

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  inTabs = false,
  padded = true,
  edges = ["top"],
  contentStyle,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const padding = padded ? spacing.xl : 0;
  const bottom = inTabs ? tabBarSpace : footer ? spacing.xl : spacing.xxxl;
  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Backdrop />
      <SafeAreaView style={styles.flex} edges={edges}>
        {header}
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              { paddingHorizontal: padding, paddingBottom: bottom },
              contentStyle,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[styles.flex, { paddingHorizontal: padding }, contentStyle]}
          >
            {children}
          </View>
        )}
        {footer && (
          <View
            style={{
              paddingBottom: edges.includes("bottom") ? 0 : insets.bottom,
            }}
          >
            {footer}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
