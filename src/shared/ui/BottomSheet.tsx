import { ReactNode, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "../i18n/I18nProvider";
import { makeStyles, radius, spacing } from "../theme";
import { CircleButton } from "./AppHeader";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

const nativeDriver = Platform.OS !== "web";

/**
 * Bảng trượt từ dưới lên cho thao tác phụ, giữ người dùng ở lại màn hình hiện tại.
 * Giống bảng "Tạo yêu cầu": nền tối chỉ mờ dần tại chỗ, riêng bảng trượt lên (không kéo cả lớp tối theo).
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: Props) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { t } = useI18n();
  const [progress] = useState(() => new Animated.Value(0));
  // Giữ Modal mở trong lúc chạy hiệu ứng đóng rồi mới gỡ.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: nativeDriver,
        friction: 9,
        tension: 70,
      }).start();
      return;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: nativeDriver,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [progress, visible]);

  const offset = Dimensions.get("window").height;
  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.root}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
          <Pressable
            style={styles.backdrop}
            onPress={onClose}
            accessibilityLabel={t("common.close")}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + spacing.lg,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [offset, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
              {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <CircleButton
              icon="close"
              label={t("common.close")}
              onPress={onClose}
            />
          </View>
          {children && (
            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          )}
          {footer && <View style={styles.footer}>{footer}</View>}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    maxHeight: "88%",
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 10,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { ...font.title, fontSize: 20 },
  subtitle: { ...font.caption, fontSize: 13, marginTop: 2 },
  body: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
}));
