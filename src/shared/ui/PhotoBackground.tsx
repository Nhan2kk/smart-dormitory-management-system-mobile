import { Image, ImageSource } from "expo-image";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Photos } from "../images";
import { Gradient } from "./Gradient";
import { useTheme } from "../theme";

type Props = {
  source: ImageSource | number;
  /** Phần ảnh được giữ lại khi khung thấp hơn ảnh. */
  anchor?: "top" | "center" | "bottom";
  /** Phủ lớp tối dần xuống dưới để chữ trắng dễ đọc. */
  shade?: boolean;
  blurRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Ảnh nền phủ kín khung (expo-image: có bộ nhớ đệm, ảnh chờ và hiệu ứng hiện dần). */
export function PhotoBackground({
  source,
  anchor = "center",
  shade,
  blurRadius,
  style,
  children,
}: Props) {
  const { gradients } = useTheme();
  return (
    <View style={[styles.box, style]}>
      <Image
        source={source}
        placeholder={Photos.placeholder}
        placeholderContentFit="cover"
        contentFit="cover"
        contentPosition={anchor}
        transition={300}
        blurRadius={blurRadius}
        style={StyleSheet.absoluteFill}
        accessibilityIgnoresInvertColors
      />
      {shade && (
        <Gradient
          colors={gradients.shade}
          direction="vertical"
          style={StyleSheet.absoluteFill}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ box: { overflow: "hidden" } });
